import { type ReactElement, useEffect, useState } from 'react';
import * as prod from 'react/jsx-runtime';
import addClasses from 'rehype-class-names';
import rehypeParse, { type Options as RehypeParseOptions } from 'rehype-parse';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import { unified } from 'unified';

import './styles.css';
import { defaultClassMap } from './classMap.ts';

const production = { Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs };

export const Html: React.FC<{
  children: string;
  onError: (err: Error) => void;
}> = ({ children, onError }) => {
  const [reactContent, setReactContent] = useState<ReactElement | null>(null);

  useEffect(() => {
    unified()
      .use(rehypeParse, {} as RehypeParseOptions)
      .use(rehypeSanitize)
      .use(addClasses, defaultClassMap)
      .use(rehypeReact, production)
      .process(children)
      .then((vfile: { result: ReactElement }) => setReactContent(vfile.result))
      .catch((e: Error) => onError(e));
  }, [children, onError]);

  return reactContent;
};
