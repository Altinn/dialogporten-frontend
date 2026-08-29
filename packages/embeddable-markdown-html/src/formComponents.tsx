import {
  Children,
  type ComponentPropsWithoutRef,
  createContext,
  type FormEvent,
  isValidElement,
  type ReactNode,
  useContext,
} from 'react';
import { type FormPolicy, resolveFormAction } from './formPolicy.ts';
import { allowedButtonTypes, allowedFormMethods, allowedInputTypes } from './tags.ts';

export type FormMethod = 'get' | 'post';

export interface FormSubmission {
  action: string;
  method: FormMethod;
  encType: string;
  formData: FormData;
  values: Record<string, FormDataEntryValue | FormDataEntryValue[]>;
  submitter: HTMLElement | null;
  form: HTMLFormElement;
}

export type FormSubmitHandler = (submission: FormSubmission) => void;

export interface FormContextValue {
  onSubmit?: FormSubmitHandler;
  policy?: FormPolicy;
}

const FormContext = createContext<FormContextValue>({});

export const FormContextProvider = ({ value, children }: { value: FormContextValue; children: ReactNode }) => (
  <FormContext.Provider value={value}>{children}</FormContext.Provider>
);

const warn = (message: string) => {
  console.warn(`[embeddable-markdown-html] ${message}`);
};

const toText = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('');

const toValues = (formData: FormData): FormSubmission['values'] => {
  const values: FormSubmission['values'] = {};
  for (const [key, value] of formData.entries()) {
    const existing = values[key];
    if (existing === undefined) {
      values[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      values[key] = [existing, value];
    }
  }
  return values;
};

const buildFormData = (form: HTMLFormElement, submitter: HTMLElement | null): FormData => {
  try {
    return new FormData(form, submitter);
  } catch {
    return new FormData(form);
  }
};

const normalizeMethod = (method: unknown): FormMethod => {
  const value = typeof method === 'string' ? method.toLowerCase() : '';
  return allowedFormMethods.includes(value) ? (value as FormMethod) : 'get';
};

const Form = ({ children, action, method, encType, ...rest }: ComponentPropsWithoutRef<'form'>) => {
  const { onSubmit, policy } = useContext(FormContext);
  const resolved = resolveFormAction(action, policy);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (resolved.url === undefined) {
      warn(`form submission blocked: ${resolved.error}`);
      return;
    }
    if (!onSubmit) {
      warn('form submission blocked: no onSubmit handler was provided to the renderer');
      return;
    }

    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter ?? null;
    const formData = buildFormData(form, submitter);

    onSubmit({
      action: resolved.url,
      method: normalizeMethod(method),
      encType: typeof encType === 'string' ? encType : 'application/x-www-form-urlencoded',
      formData,
      values: toValues(formData),
      submitter,
      form,
    });
  };

  return (
    <form {...rest} action={resolved.url} method={normalizeMethod(method)} encType={encType} onSubmit={handleSubmit}>
      {children}
    </form>
  );
};

const readOnlyValueTypes = ['checkbox', 'radio', 'submit', 'reset', 'button'];

const Input = ({ type, value, checked, ...rest }: ComponentPropsWithoutRef<'input'>) => {
  const requestedType = typeof type === 'string' ? type.toLowerCase() : '';
  const safeType = allowedInputTypes.includes(requestedType) ? requestedType : 'text';
  const valueProp = readOnlyValueTypes.includes(safeType) ? { value } : { defaultValue: value };

  return (
    <input
      {...rest}
      type={safeType}
      {...(value === undefined ? {} : valueProp)}
      {...(checked === undefined ? {} : { defaultChecked: checked })}
    />
  );
};

const Textarea = ({ children, value, ...rest }: ComponentPropsWithoutRef<'textarea'>) => (
  <textarea {...rest} defaultValue={typeof value === 'string' ? value : toText(children)} />
);

const optionValue = (props: ComponentPropsWithoutRef<'option'>): string =>
  props.value === undefined ? toText(props.children) : String(props.value);

const collectSelectedValues = (children: ReactNode): string[] =>
  Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) {
      return [];
    }
    if (child.type === Option) {
      const props = child.props as ComponentPropsWithoutRef<'option'>;
      return props.selected ? [optionValue(props)] : [];
    }
    if (child.type === 'optgroup') {
      return collectSelectedValues((child.props as ComponentPropsWithoutRef<'optgroup'>).children);
    }
    return [];
  });

const Select = ({ children, multiple, ...rest }: ComponentPropsWithoutRef<'select'>) => {
  const selected = collectSelectedValues(children);
  const defaultValue = multiple ? selected : selected[0];

  return (
    <select {...rest} multiple={multiple} {...(defaultValue === undefined ? {} : { defaultValue })}>
      {children}
    </select>
  );
};

const Option = ({ selected, ...rest }: ComponentPropsWithoutRef<'option'>) => <option {...rest} />;

const Button = ({ type, ...rest }: ComponentPropsWithoutRef<'button'>) => {
  const requestedType = typeof type === 'string' ? type.toLowerCase() : '';
  const safeType = allowedButtonTypes.includes(requestedType)
    ? (requestedType as 'submit' | 'reset' | 'button')
    : 'submit';

  return <button {...rest} type={safeType} />;
};

export const formComponents = {
  form: Form,
  input: Input,
  textarea: Textarea,
  select: Select,
  option: Option,
  button: Button,
};
