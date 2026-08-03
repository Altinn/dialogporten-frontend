# Docs

This website is built using [Starlight](https://starlight.astro.build/), a documentation theme for [Astro](https://astro.build/).

## Local development

```bash
pnpm --filter docs dev
```

Documentation pages live in `src/content/docs/`. The sidebar is generated from the folder structure, so adding a Markdown file is enough to publish a page. Every page needs a `title` in its frontmatter.

Diagrams are authored in [Excalidraw](https://excalidraw.com/) and committed as both `.excalidraw` and `.svg` next to the page that references them. Mermaid diagrams are written as ` ```mermaid ` code fences and rendered in the browser.

## Build

```bash
pnpm --filter docs build
```

Output is written to `dist/`. The site is deployed to GitHub Pages by `.github/workflows/workflow-deploy-docs.yml`, which sets `URL` and `BASEURL` for the subpath deployment.
