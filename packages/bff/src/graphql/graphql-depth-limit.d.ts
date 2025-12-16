declare module 'graphql-depth-limit' {
  import type { ValidationRule } from 'graphql';

  function depthLimit(
    maxDepth: number,
    options?: {
      ignore?: string[];
    },
  ): ValidationRule;

  export default depthLimit;
}
