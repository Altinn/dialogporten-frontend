import { type ReactElement, useEffect, useMemo, useState } from 'react';
import * as prod from 'react/jsx-runtime';
import addClasses from 'rehype-class-names';
import rehypeParse, { type Options as RehypeParseOptions } from 'rehype-parse';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import { unified } from 'unified';
import { defaultClassMap } from './classMap.ts';
import { FormContextProvider, formComponents } from './formComponents.tsx';
import { sanitizeSchema } from './schema.ts';
import type { EmbeddableContentProps } from './types.ts';

import './styles.css';

const production = { Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs, components: formComponents };

export const Html = ({ children, onError, onSubmit, formPolicy }: EmbeddableContentProps): ReactElement | null => {
  const [reactContent, setReactContent] = useState<ReactElement | null>(null);
  const formContext = useMemo(() => ({ onSubmit, policy: formPolicy }), [onSubmit, formPolicy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    unified()
      .use(rehypeParse, {} as RehypeParseOptions)
      .use(rehypeSanitize, sanitizeSchema)
      .use(addClasses, defaultClassMap)
      .use(rehypeReact, production)
      .process(children)
      .then((vfile: { result: ReactElement }) => setReactContent(vfile.result))
      .catch((e: ErrorEvent) => onError(e));
  }, [children]);

  if (reactContent === null) {
    return null;
  }

  return <FormContextProvider value={formContext}>{reactContent}</FormContextProvider>;
};
