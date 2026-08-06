# Dialogporten-frontend / Arbeidsflate

## Developer setup

Tool | Description
-----|------------
[fnm](https://github.com/Schniz/fnm) | Fnm is used to automatically get the correct version of Node in the project
Docker | We recommend to use OrbStack if you're using Mac for development, on Linux you can install Docker directly.
pnpm | Package manager used in this project
fzf | Fuzzy finder used in some scripts


### macOS

On macOS using [Homebrew](https://brew.sh/) you can install dependencies by running:

```bash
brew install fnm pnpm fzf
brew install --cask OrbStack
corepack enable
corepack prepare -activate
```

### Windows

On Windows using [Chocolatey](https://chocolatey.org/) you can install dependencies by running:

```bash
choco install -y fnm pnpm fzf docker-desktop
```

## Running Docker locally

First you'll need to setup an `.env` file:

### env
Ensure that `./.env` (in root) is created with following keys and appropriate values (**Note**: replace the examples needed for local development)
```
OIDC_CLIENT_ID=<my_example_service>
OIDC_CLIENT_SECRET=<secret_password_keep_this_private>
APP_CONFIG_CONNECTION_STRING=<endpoint_url>
ALTINN2_API_KEY=<key>
ALTINN2_BASE_URL=<URL>
DIALOGPORTEN_URL=<URL>
PLATFORM_BASEURL=<URL>
OIDC_PLATFORM_URL==<URL>
AUTH_CONTEXT_COOKIE_DOMAIN='localhost'
PERSON_URN_ENC_KEYS=<base64_key>
```

`PERSON_URN_ENC_KEYS` is a base64-encoded AES-SIV key (32 or 64 bytes of key material) used by the BFF to encrypt person URNs in GraphQL responses. Generate one with:

```bash
openssl rand -base64 64
```

For key rotation, supply multiple keys comma-separated (`current,previous`); decrypt tries each in order. In local development the config falls back to a built-in dev key — do **not** use the dev default in deployed environments. In Azure the value is wired from the `PersonUrnEncryptionKey` Key Vault secret via [.azure/applications/bff/main.bicep](.azure/applications/bff/main.bicep).

## Docker

Running Docker in watch mode:

```bash
make pull (optional)
make dev
```

## Playwright Testing Guidelines

This describes how to work with Playwright tests in `/packages/frontend`.

## Installation

After installing project dependencies, ensure Playwright browsers are installed:

```bash
pnpm install:browsers
```

## Running Tests

Run all tests:

```bash
pnpm test:playwright && pnpm test:playwright:heavy && pnpm test:playwright:perf
```

The heavy and performance specs run as separate invocations so they don't compete with
the main suite for the single Vite dev server.

Run code test generator (use app.localhost/?mock=true to access mock data):

```bash
pnpm codegen:playwright
```

### Common Flags

| Flag        | Description                                   |
|-------------|-----------------------------------------------|
| `--debug`   | Runs tests in debug mode.                     |
| `--ui`      | Opens Playwright’s test runner UI.            |
| `--headed`  | Runs tests with a visible browser window.     |

Example:

```bash
pnpm test:playwright --debug
```

### Running a Single Test

```bash
pnpm test:playwright -g 'myStory.spec.ts'
```

## Mock Data

Mock data is located under `src/mocks/data`.

- **Base:** Default dataset
- **Stories:** Specific datasets used via `playwrightId`

To run the app with mocks:

```
http://app.localhost/?mock=true
```

To specify a dataset:

```
http://app.localhost/?mock=true&playwrightId=<folder-name>
```

## Accessibility Tests

Run accessibility tests:

```bash
pnpm test:accessibility
```

Accessibility logic resides in `axe.test.ts`. You can reuse `createHtmlReport` for reporting.

## File Structure

- Tests: `packages/frontend/tests`
- Playwright config: `packages/frontend/playwright.config.ts`


## Documentation

Our project documentation is built using [Starlight](https://starlight.astro.build/), a documentation theme for [Astro](https://astro.build/). The documentation is located in the `packages/docs/` directory.

### Documentation Structure

```
packages/docs/src/content/docs/
├── architecture/    # System architecture documentation
├── deployment/      # Deployment processes and configurations
├── development/     # Development guidelines and setup
├── featureFlags/    # Feature flag documentation
└── notes/           # Additional project notes and business rules
```

### Contributing to Documentation

1. **Location**: All documentation files are in the `packages/docs/src/content/docs/` directory
2. **Format**: Pages are written as Markdown (`.md`) or MDX (`.mdx`, which also supports components). Every page needs a `title` in its frontmatter
3. **Diagrams**: We use [Excalidraw](https://excalidraw.com/) for creating diagrams
   - Save diagram source files as `.excalidraw` format
   - Export diagrams as `.svg` files
   - Always keep both `.excalidraw` and `.svg` files together in the same directory
   - Mermaid diagrams are written as ` ```mermaid ` code fences and rendered in the browser

### Running Documentation Locally

```bash
# Using pnpm
pnpm --filter docs run dev

# Using Docker
pnpm --filter docs run build:docker
pnpm --filter docs run run:docker
```

The documentation will be available at:
- Local development: http://localhost:4321
- Docker: http://localhost:8080
- Full docker-compose setup (`make dev`): https://docs.localhost

### Documentation Guidelines

1. **File Organization**:
   - Place new documentation in the appropriate subdirectory
   - Use clear, descriptive filenames
   - The sidebar is generated from the folder structure, so adding a page is enough to publish it
   - Include a frontmatter section with a `title` (use `sidebar.order` to control ordering)

2. **Diagrams**:
   - Create diagrams using https://excalidraw.com/
   - Save both `.excalidraw` and `.svg` versions
   - Place diagrams in the same directory as the documentation they support
   - Note: It used to be .tldr files before, but because of lack of support for maintaining these files.
   
3. **Content Structure**:
   - Use clear headings and subheadings
   - Include code examples where relevant
   - Add links to related documentation
   - Keep content up to date with code changes

4. **Search Optimization**:
   - Use descriptive titles and headings
   - Include relevant keywords naturally in the content
   - Add appropriate tags in frontmatter when applicable
