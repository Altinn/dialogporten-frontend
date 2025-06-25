import React from 'react';
import ReactDOM from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

import 'graphiql/graphiql.css';

const fetcher = createGraphiQLFetcher({
  // @ts-ignore
  url: window.GRAPHQL_URL,
});

ReactDOM.createRoot(document.getElementById('graphiql')!).render(
  <React.StrictMode>
    <GraphiQL fetcher={fetcher} />
  </React.StrictMode>,
);
