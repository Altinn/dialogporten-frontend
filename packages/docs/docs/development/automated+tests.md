# Automated tests for Team Arbeidsflate

Read this first:

- Avoid duplicate coverage and prefer integration tests over unit tests. Preferably run in browser.
- For React components: Use `pnpm test:storybook` to test components in the Storybook project (`/packages/storybook/`).
- Focus on use case coverage. Quality over quantity.
- Separate business logic into pure functions rather than React components
- For more technical note of running and configuring tests, consult `README` per package.

### React Component Testing

- **Use**: [@storybook/test-runner](https://storybook.js.org/addons/@storybook/test-runner) and React Testing Library + Vitest.
- **Aim**: Tests are designed to be maintainable and to reflect real user interactions, avoiding the pitfalls of testing implementation details. Think: Tests are useful, not pain points.
- **Avoid**:
    - Complicated tests that are difficult to maintain or understand.
    - Testing all edge cases (it's more important to have 80 % working all the time than 100 % working 80 % av the time).
- **Examples**: 
  - For a custom button component, verify the button's visibility and simulate a click event, rather than checking if a specific function was called. 

Smoke test (i.e. `check if they render OK`) for our custom React components with stories are auto-generated and can be run with `pnpm test:storybook` in the Storybook project (`/packages/storybook/`).
More functional tests of the component can be added with [the following recipe](https://storybook.js.org/docs/writing-stories). Check out [Header.stories.tsx](..%2F..%2F..%2Fstorybook%2Fsrc%2Fstories%2FHeader%2FHeader.stories.tsx) for a minimalistic example of a `play function`.

For all other uses cases, e.g. components not fit for Storybook, we use [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and [Vitest](https://vitest.dev/) as runner.

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

