---
title: "Environment variables"
---
## Frontend

The frontend is a static build, so runtime values are injected into `index.html` when the container starts.

### Adding New Environment Variables

To add a new environment variable to the frontend, follow these steps:

1. **Define the Variable in `config.ts`:**
   ```typescript:packages/frontend/src/config.ts
   interface Window {
     applicationInsightsInstrumentationKey: string | undefined;
     dialogportenStreamUrl: string | undefined;
     // Add your new environment variable here
     newEnvVariable: string | undefined;
   }

   declare const window: Window;

   export const config = {
     // Existing environment variables
     applicationInsightsInstrumentationKey: window.applicationInsightsInstrumentationKey,
     dialogportenStreamUrl: window.dialogportenStreamUrl,
     // Add your new environment variable here
     newEnvVariable: window.newEnvVariable,
   };
   ```

2. **Update `index.html` with the New Variable:**
   ```html:packages/frontend/index.html
   <script>
     window.applicationInsightsInstrumentationKey = '$APPLICATION_INSIGHTS_INSTRUMENTATION_KEY';
     window.dialogportenStreamUrl = '$DIALOGPORTEN_STREAM_URL';
     window.newEnvVariable = '$NEW_ENV_VARIABLE';
   </script>
   ```

3. **Modify the `start.sh` Script to Substitute the New Variable:**
   ```shell:packages/frontend/start.sh
   # Replace the placeholders in index.html and create a temporary file
   envsubst '$APPLICATION_INSIGHTS_INSTRUMENTATION_KEY $DIALOGPORTEN_STREAM_URL $NEW_ENV_VARIABLE' < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index_temp.html
   ```

4. **Restart the Application:**
   After making these changes, rebuild and restart your Docker containers to apply the new environment variables.

## BFF

All BFF variables are declared and validated with zod in `packages/bff/src/config.ts`. Most have defaults that point to AT23, so the BFF starts locally with only a few values in `.env`.

In Azure the values are set in `.azure/applications/bff/main.bicep`: plain values come from the `<env>.bicepparam` files, and secrets come from the environment's Key Vault.
To add a variable, add it to the zod schema and the `config` object in `config.ts`, and to `main.bicep` (plus a Key Vault secret if it is sensitive).

### Server

| Variable | Purpose |
| --- | --- |
| `PORT`, `HOST` | Listen address (`3000`, `0.0.0.0`) |
| `HOSTNAME` | Public base URL of the app. Used for the OIDC redirect URI `<HOSTNAME>/api/cb` |
| `GIT_SHA` | Version shown in logs and health endpoints. Not set in `main.bicep`, so deployed environments show the default |
| `ENVIRONMENT` | `dev`, `test`, `staging`, `yt01` or `prod` (default `test`). Only used to hide some organizations in prod (`graphql/organizations/service.ts`). Not set in `main.bicep` |
| `CONTAINER_APP_REPLICA_NAME` | Set by Azure Container Apps. Used as the instance id in telemetry |
| `MIGRATION_RUN` | `true` runs the database migrations and exits instead of starting the server. Used by the migration job |

### Login and session

| Variable | Purpose |
| --- | --- |
| `OIDC_PLATFORM_URL` | Altinn's OIDC issuer, without `https://`. `/.well-known/openid-configuration` is appended |
| `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` | OIDC client |
| `SESSION_SECRET` | Signs the `arbeidsflate` session cookie. At least 32 characters |
| `REDIS_CONNECTION_STRING` | Sessions and caches |
| `AUTH_CONTEXT_COOKIE_DOMAIN` | Domain for the `altinnPersistentContext` cookie (language), which is shared with the rest of Altinn |
| `ENABLE_INIT_SESSION_ENDPOINT` | Enables the test-only `/api/init-session`. Must be `false` in prod (see [ID Porten](../../notes/id-porten/id-porten/)) |
| `PERSON_URN_ENC_KEYS` | Keys for encrypting person URNs (see [Person URN encryption](../../notes/person-urn-encryption/person-urn-encryption/)) |

### External APIs

| Variable | Purpose |
| --- | --- |
| `DIALOGPORTEN_URL` | Base URL. The BFF uses `/graphql` and `/health` |
| `PLATFORM_BASEURL` | Altinn platform APIs (Profile, Register, Correspondence, Notifications, Resource Registry, token exchange) |
| `MASKINPORTEN_CLIENT_ID`, `MASKINPORTEN_JWK`, `MASKINPORTEN_ISSUER`, `MASKINPORTEN_SCOPE`, `REGISTER_SUBSCRIPTION_KEY` | See [Maskinporten](../../notes/maskinporten/maskinporten/) |
| `OCP_APIM_SUBSCRIPTION_KEY` | Fallback for `REGISTER_SUBSCRIPTION_KEY` |
| `ALTINN2_BASE_URL`, `ALTINN2_API_KEY` | Read into the config, but not used in the code |

### Database

| Variable | Purpose |
| --- | --- |
| `DB_CONNECTION_STRING` | Postgres connection string, used unless `DB_USE_AAD_AUTH` is `true` |
| `DB_USE_AAD_AUTH`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` | Connect with Entra ID instead of a connection string |
| `ENABLE_HTTPS` | Despite the name, it only turns on SSL for the Postgres connection-string connection |

### Features and telemetry

| Variable | Purpose |
| --- | --- |
| `APP_CONFIG_CONNECTION_STRING` | Azure App Configuration for feature flags and the alert banner. Empty means defaults are used |
| `ENABLE_GRAPHIQL` | Enables GraphiQL at `/api/graphiql` (default `true`, `false` in prod) |
| `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, `OTEL_TRACES_SAMPLER_ARG` | OpenTelemetry. Enabled when the endpoint is set (see [Instrumentation](../instrumentation/)) |

