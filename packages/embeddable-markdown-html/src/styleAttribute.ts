const allowedStyleProperties = new Set([
  'accent-color',
  'align-content',
  'align-items',
  'align-self',
  'background',
  'background-color',
  'border',
  'border-block',
  'border-bottom',
  'border-collapse',
  'border-color',
  'border-inline',
  'border-left',
  'border-radius',
  'border-right',
  'border-spacing',
  'border-style',
  'border-top',
  'border-width',
  'box-shadow',
  'box-sizing',
  'caption-side',
  'clear',
  'color',
  'column-gap',
  'cursor',
  'display',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-flow',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'float',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'gap',
  'grid-column',
  'grid-row',
  'grid-template-columns',
  'grid-template-rows',
  'height',
  'inline-size',
  'justify-content',
  'justify-items',
  'justify-self',
  'letter-spacing',
  'line-height',
  'list-style',
  'list-style-position',
  'list-style-type',
  'margin',
  'margin-block',
  'margin-bottom',
  'margin-inline',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-height',
  'max-inline-size',
  'max-width',
  'min-height',
  'min-width',
  'order',
  'overflow',
  'overflow-wrap',
  'overflow-x',
  'overflow-y',
  'padding',
  'padding-block',
  'padding-bottom',
  'padding-inline',
  'padding-left',
  'padding-right',
  'padding-top',
  'resize',
  'row-gap',
  'table-layout',
  'text-align',
  'text-decoration',
  'text-indent',
  'text-overflow',
  'text-transform',
  'text-wrap',
  'vertical-align',
  'white-space',
  'width',
  'word-break',
  'word-spacing',
]);

const unsafeValue = /url\(|expression\(|javascript:|behaviou?r:|@import|-moz-binding|\\/i;

const importantSuffix = /\s*!\s*important\s*$/i;

export const sanitizeStyle = (style: unknown): string | undefined => {
  if (typeof style !== 'string') {
    return undefined;
  }

  const declarations = style
    .split(';')
    .map((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator === -1) {
        return undefined;
      }
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration
        .slice(separator + 1)
        .replace(importantSuffix, '')
        .trim();
      if (property === '' || value === '' || !allowedStyleProperties.has(property) || unsafeValue.test(value)) {
        return undefined;
      }
      return `${property}:${value}`;
    })
    .filter((declaration): declaration is string => declaration !== undefined);

  return declarations.length === 0 ? undefined : declarations.join(';');
};
