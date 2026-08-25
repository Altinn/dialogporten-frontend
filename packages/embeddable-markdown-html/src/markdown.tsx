import type { Options as RemarkRehypeOptions } from 'mdast-util-to-hast';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import * as prod from 'react/jsx-runtime';
import addClasses from 'rehype-class-names';
import rehypeRaw from 'rehype-raw';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse, { type Options as RemarkParseOptions } from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import { unified } from 'unified';
import { defaultClassMap } from './classMap.ts';
import { FormContextProvider, formComponents } from './formComponents.tsx';
import { sanitizeSchema } from './schema.ts';
import type { EmbeddableContentProps } from './types.ts';

import './styles.css';

const production = { Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs, components: formComponents };

/**
 * Renders markdown as React elements in common mark: https://spec.commonmark.org/0.31.2/spec.json,
 * extended with GitHub flavoured tables and inline html limited to the sanitized allow list.
 */
export const Markdown = ({ children, onError, onSubmit, formPolicy }: EmbeddableContentProps): ReactElement | null => {
  const [reactContent, setReactContent] = useState<ReactElement | null>(null);
  const formContext = useMemo(() => ({ onSubmit, policy: formPolicy }), [onSubmit, formPolicy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    unified()
      .use(remarkParse, {} as RemarkParseOptions)
      .use(remarkGfm)
      .use(remarkToRehype, { allowDangerousHtml: true } as RemarkRehypeOptions)
      .use(rehypeRaw)
      .use(rehypeSanitize, sanitizeSchema)
      .use(addClasses, defaultClassMap)
      .use(rehypeReact, production)
      .process(children)
      .then((vfile: { result: ReactElement }) => setReactContent(vfile.result as ReactElement))
      .catch(onError);
  }, [children]);

  if (reactContent === null) {
    return null;
  }

  return <FormContextProvider value={formContext}>{reactContent}</FormContextProvider>;
};
