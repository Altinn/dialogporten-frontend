---
title: "Automated testing"
---
Read this first:

- Avoid duplicate coverage and prefer integration tests over unit tests. Preferably run in browser.
- Focus on use case coverage. Quality over quantity.
- Separate business logic into pure functions rather than React components
- For more technical note of running and configuring tests, consult `README` per package.

### React Component Testing

- **Use**: React Testing Library + Vitest.
- **Aim**: Tests are designed to be maintainable and to reflect real user interactions, avoiding the pitfalls of testing implementation details. Think: Tests are useful, not pain points.
- **Avoid**:
    - Complicated tests that are difficult to maintain or understand.
    - Testing all edge cases (it's more important to have 80 % working all the time than 100 % working 80 % av the time).
- **Examples**: 
  - For a custom button component, verify the button's visibility and simulate a click event, rather than checking if a specific function was called. 

We use [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and [Vitest](https://vitest.dev/) as runner.

### Integration Testing and E2E

- **Use**: Playwright and Vitest.
- **Aim**: Cover happy path scenarios, focusing on the flow and necessary actions in order to complete the flow.
- **Categories**:
    - **Integration tests**: Is to run on code before it's merged to `main`. Automates testing within Pull Requests to provide immediate feedback. 
      This setup ensures that each PR is tested against an instance of the application with mocked endpoints using `msw`. Both Playwright and necessary webserver (cf. `./packages/{frontend_package}/playwright.config.ts`) are executed in executed in the CI environment.
    - **End to end**: Cron based. Tests run against a deployed site to ensure authentication and integration processes work as expected. Only Playwright is run the CI environment against an instance of the app in a stable and idempotent environment. These tests are separate from the tests above, and more time consuming and more focused on 3rd parties (including `id-porten`).

### Unit Testing

- **Use**: Vitest.
- **Strategy**: Each test case focuses on a single functionality (SRP). Use Mock Service Worker (MSW) for handling external calls, making tests independent.
- **Example**: If testing a fetch operation within a component, use MSW to return preset data, ensuring the test's behavior remains predictable and isolated from external changes.

### BFF integration tests

`pnpm --filter bff test:integration` runs regression tests against real Redis and PostgreSQL. It starts them in Docker,
or uses `TEST_REDIS_URL` / `TEST_DATABASE_URL` when set.

### Mock data for Playwright

Playwright runs against mock data in `packages/frontend/src/mocks`, one story per scenario. [Mock data](../mock-data/) explains the intent, how the pieces fit together, and how to add a scenario.

### Playwright pitfalls

- **Mock data needs the Vite dev server.** `?mock=true` and `playwrightId` only work under `pnpm dev` (`webServer` in `playwright.config.ts`).
  They do not survive a production build, because the story fixtures are loaded with dynamic imports and the MSW worker is dev-only.
- **The dev server is the bottleneck.** Locally the suite runs with 3 workers. On CI it is split into 3 shards with 1 worker each, so every shard has its own runner and dev server.
  More workers starve the dev server, and unrelated specs start to time out.
- **Heavy and perf specs run on their own.** `savedSearchParties.spec.ts` (`pnpm test:playwright:heavy`) and `partiesExtreme.spec.ts` (`pnpm test:playwright:perf`) run as separate invocations with one worker. Do not fold them into the main run.
- **Flake or regression?** Timeouts on varying specs mean contention. The same assertion failing every run means a real bug.
  A quick check is to run the suite at 5 workers with and without your change and compare the failure counts.
- **Do not use `page.reload()` on mock pages.** In Firefox the MSW worker does not survive a reload and the page stays blank. Open the URL with the state you need using a fresh `page.goto` instead.
- **Dialog byline text.** The byline from `@altinn/altinn-components` has no space text nodes and includes avatar initials, so `getByText` needs a regex that tolerates extra characters (e.g. `.*`).
- **`Accept-Language` on embedded content.** Real browsers send the header the app sets when fetching embedded content, but Playwright's Firefox overrides it. Assert on the localized URL instead of the header.

