## Big picture

There are **two layers**, deliberately split:

1. **A reusable library** — `Digdir.Library.Utils.AspNet` — owns the *endpoint shape*, the *tag→endpoint routing*, the `self` check, and the generic external-HTTP-endpoint check. This is the part you'd lift into another product.
2. **Per-app infrastructure checks** — `Digdir.Domain.Dialogporten.Infrastructure/HealthChecks` — registers the concrete dependency checks (Postgres, Redis, Service Bus, warmup) that are specific to this app.

Each of the three services (WebApi, GraphQL, Service) calls the same two extension methods: `AddAspNetHealthChecks(...)` at registration and `MapAspNetHealthChecks()` at routing. The infrastructure checks come in via `AddCustomHealthChecks()` inside `InfrastructureExtensions`.

The whole design is documented in `docs/HealthCheck.md` — but note **one discrepancy I found**: that doc says `/health/readiness` = `critical` only, while the actual code (`AspNetUtilitiesExtensions.cs:35`) routes `critical` **OR** `warmup`. The code is the source of truth; the doc is slightly stale on warmup. I'll flag where this matters below.

## The core pattern: tags, not endpoints

This is the key idea worth stealing. Every check is registered **once** with one or more **tags**. Endpoints are then defined as **predicates over tags**, so a single check can appear in multiple endpoints, and you add an endpoint without touching any check.

Registration (`AspNetUtilitiesExtensions.cs:22-29`):
```csharp
services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["self"])
    .AddCheck<EndpointsHealthCheck>("Endpoints", failureStatus: HealthStatus.Unhealthy, tags: ["external"]);
```

Routing (`AspNetUtilitiesExtensions.cs:32-43`) — each endpoint is just a tag filter, all sharing the HealthChecks-UI JSON response writer:

| Endpoint | Predicate (tags) | Checks it runs | Consumed by |
|---|---|---|---|
| `/health/liveness` | `self` | always-healthy stub | Container Apps **Liveness** probe |
| `/health/readiness` | `critical` OR `warmup` | postgres + warmup gate | Container Apps **Readiness** probe |
| `/health/startup` | `dependencies` | postgres + redis + servicebus | Container Apps **Startup** probe |
| `/health` | `dependencies` | postgres + redis + servicebus | humans / dashboards |
| `/health/deep` | `dependencies` OR `external` | the above + outbound HTTP checks | APIM availability test (`.azure/infrastructure/main.bicep:172`) |

The probe wiring lives in `.azure/modules/containerApp/main.bicep:122-151` (Startup→`/health/startup`, Readiness→`/health/readiness`, Liveness→`/health/liveness`).

ASP.NET's default status→HTTP mapping does the rest: `Healthy`/`Degraded` → **200**, `Unhealthy` → **503**. So a check returning `Degraded` keeps the probe green; only `Unhealthy` trips it.

## The registered checks and *why* each chose its severity

This severity philosophy is the most transferable design decision — **"what should this failure actually do?"** drives the status.

**`self`** (`self` tag) — always `Healthy`. Liveness must answer "is the process wedged?", nothing more. No dependencies, or you'd get pods restarted for downstream outages they can't fix.

**Postgres** (`dependencies` + `critical`) — `AddDbContextCheck<DialogDbContext>` (`InfrastructureExtensions.cs:467`). The **only** `critical` dependency, so the only infra check that can fail readiness. Rationale: without Postgres the app can neither serve requests nor preserve outbox messages, so it *should* be pulled from traffic.

**Redis** (`dependencies` only — `RedisHealthCheck.cs`) — connects and `PING`s. Crucially, **every failure path returns `Degraded`, never `Unhealthy`** (timeout, connection failure, unexpected exception — all `Degraded`; slow >5s also `Degraded`). It's not `critical`, so Redis problems never pull a pod from traffic — the app degrades to cache-miss behavior instead.

**Azure Service Bus** (`dependencies` — `ServiceBusHealthCheck.cs`) — the most interesting one. It does **not** call the Azure SDK. It's a thin app-level wrapper over **MassTransit's own** health check:
- MassTransit's check is registered but renamed/retagged internally to `masstransit-servicebus` / `masstransit-servicebus-internal` (`InfrastructureExtensions.cs:446-451`) so it is *never* selected by any public endpoint's tag predicate.
- The wrapper (`servicebus`, tagged `dependencies`) calls `HealthCheckService.CheckHealthAsync` with a predicate matching only that inner check (`ServiceBusHealthCheck.cs:23,49-51`), then re-maps the result:

| Inner MassTransit result | Wrapper returns | Why |
|---|---|---|
| Healthy | Healthy | |
| Degraded **or** Unhealthy | **Degraded** | the Postgres outbox buffers outbound messages until the broker recovers; restarting pods won't fix broker connectivity |
| Missing (not registered) | **Unhealthy** | that's local misconfiguration, a different class of problem |

This "wrap a library's own check so you control how it's exposed" pattern is worth noting — it avoids double-reporting (raw + app-level) and lets you reinterpret severity.

**Warmup** (`warmup` tag only — `WarmupHealthCheck.cs`) — gates readiness during cold start (see next section).

**External HTTP endpoints** (`external` — `EndpointsHealthCheck.cs`) — only in `/health/deep`. Fans out parallel `GET`s over a configured list, each with per-endpoint timeout (20s) and a slow threshold (5s → `Degraded`). Each entry carries a `HardDependency` flag:
- 2xx fast → Healthy; 2xx slow → `Degraded` (regardless of hard/soft)
- non-2xx / exception / timeout → `Unhealthy` if `HardDependency`, else `Degraded`

It emits rich diagnostic `data` (`checkedEndpoints`, `totalCount`, `hardFailureCount`, `softFailureCount`, `slowCount`) that shows up in the JSON response. WebApi and GraphQL also auto-append their JWT bearer `WellKnown` metadata URLs as **soft** dependencies (`Program.cs:140-148` in each).

## The warmup subsystem (the most novel piece)

This solves cold-start latency: a fresh pod shouldn't take production traffic until its connection pool and EF model are primed. Three collaborating pieces (`WarmupService.cs`, `InfrastructureExtensions.cs:463-477`):

1. **`WarmupState`** — a thread-safe singleton holding `Pending | Healthy | Failed` plus the current/failed phase.
2. **`WarmupService : IHostedService`** — on startup runs phases on a background task: `db-pool` (opens N pooled connections in parallel, runs `SELECT 1`), `ef-model` (forces EF model compilation via a trivial query), and optionally `end-user-search` (a real `SearchDialogQuery` under a synthetic principal). It marks state Healthy/Failed, with a configurable timeout. If warmup is disabled, it immediately marks Healthy.
3. **`WarmupHealthCheck`** (tag `warmup`) — `Pending`→`Unhealthy`, `Failed`→`Unhealthy`, `Healthy`→`Healthy`.

Because readiness routes `critical` **OR** `warmup`, a booting pod reports **503 on `/health/readiness`** until warmup finishes — so the platform withholds traffic until the pod is actually warm — while `/health/liveness` stays 200 the whole time so it isn't killed. This is exactly the warmup detail the doc omits.

Note the probe ordering this creates: Startup probe (`dependencies`) effectively waits on Postgres (Redis/Service Bus only ever degrade); once startup passes, Readiness adds the warmup gate.

## Cross-cutting details

- **Response format**: all endpoints use `UIResponseWriter.WriteHealthCheckUIResponse` (from `AspNetCore.HealthChecks.UI.Client`) for structured JSON instead of the bare `Healthy` string.
- **Telemetry noise suppression**: `HealthCheckFilter` (`HealthCheckFilter.cs`) is an OpenTelemetry `BaseProcessor<Activity>` that drops spans for `/health` and `/health/deep` routes so probe traffic doesn't flood traces.
- **Per-service config binding**: WebApi/GraphQL bind external endpoints from their own settings section (`WebApi:HealthCheckSettings` etc.) and append well-known auth URLs; the Service binds from a top-level `HealthCheckSettings`. `ResolveHttpGetEndpointsToCheck` (`AspNetUtilitiesExtensions.cs:45-70`) normalizes each entry — either an absolute `Url` or an `AltinnPlatformRelativePath` resolved against the Altinn base URI.

## What to carry into the other product

The transferable skeleton, independent of Dialogporten's specific dependencies:

1. **Register checks once with tags; define endpoints as tag predicates.** Decouples "what you probe" from "what you expose."
2. **Map the three k8s/Container Apps probe types to three tag sets**: liveness = a `self` stub (no dependencies, ever); readiness = only what should pull you from traffic; startup = dependency visibility.
3. **Decide severity by consequence**: `Unhealthy` only when restarting/depooling the pod *helps*. If the app has a fallback (outbox, cache-miss), the dependency is `Degraded` and **not** `critical`. This single rule is most of the design.
4. **Wrap third-party health checks** (like the MassTransit example) when you need to rename, retag, or reinterpret their severity, and hide the raw one from public endpoints via tags.
5. **Gate readiness on a warmup state object** if cold-start latency matters: `IHostedService` does the warming, a singleton holds the state, a health check tagged into readiness exposes it.
6. Add a **deep** endpoint for outbound dependency visibility that probes/dashboards can hit but liveness/readiness never do, and **filter probe spans** out of telemetry.

The two files to read first if you want to replicate this are `src/Digdir.Library.Utils.AspNet/AspNetUtilitiesExtensions.cs` (the whole endpoint/tag mechanism) and `docs/HealthCheck.md` (the rationale tables) — just remember the doc understates that readiness also includes the `warmup` tag.