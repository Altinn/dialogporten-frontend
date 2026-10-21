import type { Schema } from 'hast-util-sanitize';
import { defaultSchema } from 'rehype-sanitize';
import { allowedButtonTypes, allowedEncTypes, allowedFormMethods, allowedInputTypes, allowedTags } from './tags.ts';

const ariaAttributes = ['ariaLabel', 'ariaLabelledBy', 'ariaDescribedBy', 'ariaHidden'];

// Inline styling is what makes a service owner's embed look like their own document,
// so it is allowed on every element that can carry layout.
const styledAttributes = ['className', 'style'];

const oneOf = (values: string[]) => new RegExp(`^(${values.join('|')})$`, 'i');

export const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: allowedTags,
  ancestors: {
    ...defaultSchema.ancestors,
    caption: ['table'],
    colgroup: ['table'],
    col: ['colgroup'],
    legend: ['fieldset'],
    optgroup: ['select'],
    option: ['select', 'optgroup', 'datalist'],
  },
  attributes: {
    a: ['href', 'title'],
    code: [['className', /^language-/]],
    span: [['className', /^hljs-/]],
    table: styledAttributes,
    thead: styledAttributes,
    tbody: styledAttributes,
    tfoot: styledAttributes,
    tr: styledAttributes,
    caption: styledAttributes,
    colgroup: ['span', ...styledAttributes],
    col: ['span', ...styledAttributes],
    th: ['align', 'scope', 'colSpan', 'rowSpan', 'headers', ...styledAttributes],
    td: ['align', 'colSpan', 'rowSpan', 'headers', ...styledAttributes],
    div: styledAttributes,
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'referrerPolicy', ...styledAttributes],
    form: [
      'action',
      ['method', oneOf(allowedFormMethods)],
      ['encType', oneOf(allowedEncTypes)],
      'noValidate',
      'acceptCharset',
    ],
    fieldset: ['disabled', 'name'],
    label: ['htmlFor'],
    input: [
      ['type', oneOf(allowedInputTypes)],
      'name',
      'value',
      'checked',
      'placeholder',
      'required',
      'disabled',
      'readOnly',
      'multiple',
      'accept',
      'min',
      'max',
      'step',
      'minLength',
      'maxLength',
      'pattern',
      'size',
      'list',
      'autoComplete',
      'inputMode',
    ],
    textarea: [
      'name',
      'placeholder',
      'required',
      'disabled',
      'readOnly',
      'minLength',
      'maxLength',
      'rows',
      'cols',
      'wrap',
      'autoComplete',
    ],
    select: ['name', 'required', 'disabled', 'multiple', 'size', 'autoComplete'],
    optgroup: ['label', 'disabled'],
    option: ['value', 'label', 'selected', 'disabled'],
    button: [['type', oneOf(allowedButtonTypes)], 'name', 'value', 'disabled'],
    output: ['htmlFor', 'name'],
    '*': ['className', 'style', 'id', 'lang', 'dir', 'title', 'role', ...ariaAttributes],
  },
  clobber: ['ariaDescribedBy', 'ariaLabelledBy', 'htmlFor', 'id', 'list'],
  clobberPrefix: 'user-content-',
  protocols: {
    ...defaultSchema.protocols,
    action: ['http', 'https'],
    // defaultSchema.protocols.src is http/https only, which drops inline `data:` images.
    // An SVG loaded through <img src="data:..."> cannot run script, so this stays safe
    // while letting an embed be self-contained instead of fetching from another host.
    src: ['http', 'https', 'data'],
  },
  required: {},
  strip: ['script', 'style', 'iframe', 'video', 'audio', 'object', 'embed', 'template', 'noscript', 'svg', 'math'],
};
