import { type ReactElement, useEffect, useState } from 'react';
import * as prod from 'react/jsx-runtime';
import addClasses from 'rehype-class-names';
import rehypeParse, { type Options as RehypeParseOptions } from 'rehype-parse';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import { unified } from 'unified';
import { defaultClassMap } from './classMap.ts';

import './styles.css';

const production = { Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs };
import type { Schema } from 'hast-util-sanitize';
import { defaultSchema } from 'rehype-sanitize';
import { allowedTags } from './tags.ts';

const customSchema: Schema = {
  ...defaultSchema,
  tagNames: allowedTags,
  attributes: {
    a: ['href', 'title'],
    code: [['className', /^language-/]],
    span: [['className', /^hljs-/]],
    '*': ['className'],
  },
  strip: ['script', 'style', 'iframe', 'video', 'audio'],
};

export const Html: ({
  children,
  onError,
}: { children: string; onError: (error: unknown) => void }) => ReactElement | null = ({ children, onError }) => {
  const [reactContent, setReactContent] = useState<ReactElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    unified()
      .use(rehypeParse, {} as RehypeParseOptions)
      .use(rehypeSanitize, customSchema)
      .use(addClasses, defaultClassMap)
      .use(rehypeReact, production)
      .process(children)
      .then((vfile: { result: ReactElement }) => setReactContent(vfile.result))
      .catch((e: Error) => onError(e));
  }, [children]);

  return reactContent;
};
