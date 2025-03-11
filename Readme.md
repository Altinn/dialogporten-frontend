# Dialogporten frontend

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
Ensure that `./.env` (in root) is created with following keys and appropriate values (**Note**: replace the examples)
```
CLIENT_ID=<my_example_service>
CLIENT_SECRET=<secret_password_keep_this_private>
```

## Docker

Running Docker in watch mode:

```bash
make pull (optional)
make dev
```

## Documentation

Our project documentation is built using [Docusaurus](https://docusaurus.io/), a modern static website generator. The documentation is located in the `packages/docs/` directory.

### Documentation Structure

```
packages/docs/docs/
├── architecture/    # System architecture documentation
├── deployment/      # Deployment processes and configurations
├── development/     # Development guidelines and setup
└── notes/          # Additional project notes and business rules
```

### Contributing to Documentation

1. **Location**: All documentation files are in the `packages/docs/docs/` directory
2. **Format**: Documentation is written in MDX format (`.mdx` files), which supports Markdown with React components
3. **Diagrams**: We use [tldraw](https://www.tldraw.com/) for creating diagrams
   - Save diagram source files as `.tldr` format
   - Export diagrams as `.svg` files
   - Always keep both `.tldr` and `.svg` files together in the same directory

### Running Documentation Locally

```bash
# Using pnpm
pnpm --filter docs run dev

# Using Docker
pnpm --filter docs run build:docker
pnpm --filter docs run run:docker
```

The documentation will be available at:
- Local development: http://localhost:3000
- Docker: http://localhost:8080

### Documentation Guidelines

1. **File Organization**:
   - Place new documentation in the appropriate subdirectory
   - Use clear, descriptive filenames
   - Include a frontmatter section in MDX files with title and sidebar position

2. **Diagrams**:
   - Create diagrams using tldraw
   - Save both `.tldr` and `.svg` versions
   - Place diagrams in the same directory as the documentation they support

3. **Content Structure**:
   - Use clear headings and subheadings
   - Include code examples where relevant
   - Add links to related documentation
   - Keep content up to date with code changes

4. **Search Optimization**:
   - Use descriptive titles and headings
   - Include relevant keywords naturally in the content
   - Add appropriate tags in frontmatter when applicable
