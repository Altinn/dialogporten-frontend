import type { Schema } from 'hast-util-sanitize';
import { defaultSchema } from 'rehype-sanitize';
import { allowedButtonTypes, allowedEncTypes, allowedFormMethods, allowedInputTypes, allowedTags } from './tags.ts';

const ariaAttributes = ['ariaLabel', 'ariaLabelledBy', 'ariaDescribedBy', 'ariaHidden'];

const tableAttributes = ['className', 'style'];

const oneOf = (values: string[]) => new RegExp(`^(${values.join('|')})$`, 'i');

export const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: allowedTags,
  ancestors: {
    ...defaultSchema.ancestors,
    legend: ['fieldset'],
    optgroup: ['select'],
    option: ['select', 'optgroup', 'datalist'],
  },
  attributes: {
    a: ['href', 'title'],
    code: [['className', /^language-/]],
    span: [['className', /^hljs-/]],
    table: tableAttributes,
    thead: tableAttributes,
    tbody: tableAttributes,
    tr: tableAttributes,
    th: ['align', ...tableAttributes],
    td: ['align', ...tableAttributes],
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
    '*': ['className', 'id', 'lang', 'dir', 'title', ...ariaAttributes],
  },
  clobber: ['ariaDescribedBy', 'ariaLabelledBy', 'htmlFor', 'id', 'list'],
  clobberPrefix: 'user-content-',
  protocols: {
    ...defaultSchema.protocols,
    action: ['http', 'https'],
  },
  required: {},
  strip: ['script', 'style', 'iframe', 'video', 'audio', 'object', 'embed', 'template', 'noscript', 'svg', 'math'],
};
