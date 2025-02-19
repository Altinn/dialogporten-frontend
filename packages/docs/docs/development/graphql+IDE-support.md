# GraphQL support in IDE

Support for auto-completion (`intelliSense`), error highlighting, jump-to-definition and documentation within the boundary of the GraphQL schema in your IDE.

## Setup

With the current setup of this project, following IDEs and plugins are supported for Schema-aware completion, error highlighting, and documentation thanks to
(https://graphql.org/learn/introspection/)[introspection].

| IDE                                | Plugin name    | Config                                            |
|------------------------------------|----------------|---------------------------------------------------|
| Intelli J / Webstorm               | GraphQL        | `packages/bff-types-generated/graphql.config.yml` |
| VsCode / extensions (incl. Cursor) | vscode-graphql | `.graphql`                                        |

All plugins are available in the IDEs marketplace and free of charge.

### Prerequisites

- Make sure you have installed necessary plugins for `graphql` language support.
- Make sure `*.graphql` (if not already) is associated with `graphql`. 
- Any assumption that you are already familiar with the GraphQL language.

### Configuration

`bff-types-generated` generates a local copy of the stitched GraphQL schema used and referenced by the configurations above.
The details of the configuration schema is documented (https://the-guild.dev/graphql/config/docs)[here].

## Scope

All files matching the pattern `packages/bff-types-generated/**/*.{gql,js,ts}` are supported.
Graphql and gql tagged template literals in JavaScript and TypeScript are automatically recognized as GraphQL.

## Alternative?

You can also use https://app.localhost/api/graphiql as an alternative.
