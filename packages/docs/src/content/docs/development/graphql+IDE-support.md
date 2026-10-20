---
title: "GraphQL support in IDE"
---
Support for auto-completion (`intelliSense`), error highlighting, jump-to-definition and documentation within the boundary of the GraphQL schema in your IDE.

## Setup

With the current setup of this project, following IDEs and plugins are supported for Schema-aware completion, error highlighting, and documentation thanks to
[introspection](https://graphql.org/learn/introspection/).

| IDE                                | Plugin name                                                  | Config                                            |
|------------------------------------|--------------------------------------------------------------|---------------------------------------------------|
| Intelli J / Webstorm               | GraphQL                                                      | `packages/bff-types-generated/graphql.config.yml` |
| VsCode / extensions (incl. Cursor) | GraphQL: Language Feature Support (`GraphQL.vscode-graphql`) | `packages/bff-types-generated/graphql.config.yml` |

All plugins are available in the IDEs marketplace and free of charge.

### Prerequisites

- Make sure you have installed necessary plugins for `graphql` language support.
- Make sure `*.graphql` (if not already) is associated with `graphql`. 
- Any assumption that you are already familiar with the GraphQL language.

### VS Code

The extension only looks for a config in the workspace root. Add this to `.vscode/settings.json` (gitignored, so each developer adds it locally) and run **GraphQL: Manual Restart**:

```json
"graphql-config.load.rootDir": "packages/bff-types-generated"
```

### Configuration

`bff-types-generated` generates a local copy of the stitched GraphQL schema used and referenced by the configurations above.
The details of the configuration schema is documented [here](https://the-guild.dev/graphql/config/docs).

## Scope

All files matching the pattern `packages/bff-types-generated/queries/**/*.graphql` are supported, the same files codegen uses.

## Alternative?

You can also use https://app.localhost/api/graphiql as an alternative.
