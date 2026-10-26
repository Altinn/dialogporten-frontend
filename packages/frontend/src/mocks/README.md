# Mock data

MSW handlers and mock data for `?mock=true`, used by the Playwright tests. `data/base/` is the default data set, and `data/stories/<playwrightId>/` overrides it per scenario. Each dialog is complete where it is defined: build it with `mockDialog()` from `data/base/mockDialog.ts`, and never branch on dialog ids in `helper.ts` or `handlers.ts`.

The intent, how the pieces fit together, and how to add a scenario are described in [Mock data](../../../docs/src/content/docs/development/mock-data.md) (`packages/docs/src/content/docs/development/mock-data.md`).
