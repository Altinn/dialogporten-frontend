const HTML_OPENING_LINE = /^[ \t]*<[a-zA-Z!/]/;
const PRESERVED_OPEN = /<(pre|textarea)\b/gi;
const PRESERVED_CLOSE = /<\/(pre|textarea)\s*>/gi;

const countMatches = (line: string, pattern: RegExp): number => {
  pattern.lastIndex = 0;
  let count = 0;
  while (pattern.exec(line) !== null) {
    count += 1;
  }
  return count;
};

/**
 * Removes the leading indentation from an HTML body so that markdown parsing does not turn it
 * into code blocks.
 *
 * CommonMark ends a raw HTML block at the first blank line, and treats any following line that
 * is indented four spaces or more as an indented code block. A service owner who pretty-prints
 * their embed - nested elements indented, blank lines between sections - therefore gets their
 * markup rendered as literal text from the first blank line onwards. Indentation carries no
 * meaning in HTML, so dropping it costs nothing and makes such a body parse as the markup it is.
 *
 * Only bodies that begin with a tag are touched, so ordinary markdown that happens to contain
 * some inline HTML keeps its own indentation - and with it any indented code blocks it relies on.
 * Text inside `pre` and `textarea` is left alone in either case, since whitespace is content there.
 */
export const flattenHtmlIndentation = (value: string): string => {
  const lines = value.split('\n');
  const firstContentLine = lines.find((line) => line.trim() !== '');

  if (firstContentLine === undefined || !HTML_OPENING_LINE.test(firstContentLine)) {
    return value;
  }

  let preservedDepth = 0;

  return lines
    .map((line) => {
      const flattened = preservedDepth > 0 ? line : line.replace(/^[ \t]+/, '');
      preservedDepth = Math.max(
        0,
        preservedDepth + countMatches(line, PRESERVED_OPEN) - countMatches(line, PRESERVED_CLOSE),
      );
      return flattened;
    })
    .join('\n');
};
