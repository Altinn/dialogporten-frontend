import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

type Options = {
  url: string;
  graphqlURL: string;
};

const plugin: FastifyPluginAsync<Options> = async (fastify: FastifyInstance, opts) => {
  const { url, graphqlURL } = opts;
  fastify.get(url, (request, reply) => {
    reply.type('text/html');
    reply.send(
      `
<!--
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
-->
<!doctype html>
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }

      #graphiql {
        height: 100vh;
      }
    </style>
    <!--
      This GraphiQL example depends on Promise and fetch, which are available in
      modern browsers, but can be "polyfilled" for older browsers.
      GraphiQL itself depends on React DOM.
      If you do not want to rely on a CDN, you can host these files locally or
      include them directly in your favored resource bundler.
    -->
    <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>

    <!--
      These two files can be found in the npm module, however you may wish to
      copy them directly into your environment, or perhaps include them in your
      favored resource bundler.
     -->
    <script src="https://unpkg.com/graphiql@4.0.0/graphiql.min.js" type="application/javascript"></script>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@4.0.0/graphiql.min.css" />

    <!--
      These are imports for the GraphIQL Explorer plugin.
     -->
    <script src="https://unpkg.com/@graphiql/plugin-explorer@4.0.0/dist/index.umd.js" crossorigin></script>
    <link rel="stylesheet" href="https://unpkg.com/@graphiql/plugin-explorer@4.0.0/dist/style.css" />
  </head>
  <body>
    <div id="graphiql">Loading...</div>
    <script>
      const root = ReactDOM.createRoot(document.getElementById('graphiql'));
      const fetcher = GraphiQL.createFetcher({
        url: '${graphqlURL}',
        subscriptionUrl: '${graphqlURL}',
      });
      const explorerPlugin = GraphiQLPluginExplorer.explorerPlugin();
      root.render(
        React.createElement(GraphiQL, {
          fetcher,
          defaultEditorToolsVisibility: true,
          plugins: [explorerPlugin],
        }),
      );
    </script>
  </body>
</html>
`,
    );
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'fastify-graphiql',
});
