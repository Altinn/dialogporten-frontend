import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { FormSubmission } from '../src';
import { Html, Markdown } from '../src';

const renderHtml = async (html: string, props: Partial<Parameters<typeof Html>[0]> = {}) => {
  const result = render(
    <Html onError={() => {}} {...props}>
      {html}
    </Html>,
  );
  await waitFor(() => {
    expect(result.container.firstChild).not.toBeNull();
  });
  return result;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Form elements: rendering', () => {
  test('should render a form with the fields needed to collect input', async () => {
    const { container } = await renderHtml(`
      <form action="https://example.com/submit" method="post">
        <fieldset>
          <legend>Contact</legend>
          <label for="name">Name</label>
          <input id="name" name="name" type="text" placeholder="Your name" required />
          <label for="comment">Comment</label>
          <textarea id="comment" name="comment" rows="3">Prefilled</textarea>
        </fieldset>
        <button type="submit">Send</button>
      </form>
    `);

    expect(container.querySelector('form')).toBeInTheDocument();
    expect(container.querySelector('fieldset > legend')).toHaveTextContent('Contact');
    expect(screen.getByLabelText('Name')).toHaveAttribute('placeholder', 'Your name');
    expect(screen.getByLabelText('Name')).toBeRequired();
    expect(screen.getByLabelText('Comment')).toHaveValue('Prefilled');
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  test('should keep label associations intact when ids are prefixed', async () => {
    const { container } = await renderHtml(
      '<label for="email">E-post</label><input id="email" name="email" type="email" />',
    );

    const label = container.querySelector('label')!;
    const input = container.querySelector('input')!;
    expect(input.id).toBe('user-content-email');
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input).toHaveAttribute('name', 'email');
  });

  test('should render a preselected option without turning the select read only', async () => {
    const { container } = await renderHtml(`
      <select name="county">
        <option value="03">Oslo</option>
        <option value="11" selected>Rogaland</option>
      </select>
    `);

    const select = container.querySelector('select')!;
    expect(select).toHaveValue('11');
    fireEvent.change(select, { target: { value: '03' } });
    expect(select).toHaveValue('03');
  });

  test('should render a multi select with several preselected options', async () => {
    const { container } = await renderHtml(`
      <select name="topics" multiple>
        <optgroup label="Tax">
          <option value="a" selected>A</option>
          <option value="b">B</option>
        </optgroup>
        <option value="c" selected>C</option>
      </select>
    `);

    const selected = [...container.querySelectorAll('option')].filter((option) => option.selected);
    expect(selected.map((option) => option.value)).toEqual(['a', 'c']);
  });

  test('should render a checked checkbox that the user can toggle', async () => {
    const { container } = await renderHtml('<input type="checkbox" name="consent" value="yes" checked />');

    const checkbox = container.querySelector('input')!;
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('should render radio buttons, datalist and output', async () => {
    const { container } = await renderHtml(`
      <input type="radio" name="choice" value="one" checked />
      <input type="radio" name="choice" value="two" />
      <input name="city" list="cities" />
      <datalist id="cities"><option value="Oslo"></option></datalist>
      <output name="result">42</output>
    `);

    expect(container.querySelectorAll('input[type="radio"]').length).toBe(2);
    expect(container.querySelector('input[list]')!.getAttribute('list')).toBe(container.querySelector('datalist')!.id);
    expect(container.querySelector('output')).toHaveTextContent('42');
  });

  test('should render a form written as html inside markdown', async () => {
    const markdown = [
      '## Søknad',
      '',
      '<form action="https://example.com/submit" method="post">',
      '<label for="org">Organisasjonsnummer</label>',
      '<input id="org" name="org" type="text" />',
      '<button type="submit">Send inn</button>',
      '</form>',
    ].join('\n');

    const { container } = render(<Markdown onError={() => {}}>{markdown}</Markdown>);

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
    expect(container.querySelector('h2')).toHaveTextContent('Søknad');
    expect(screen.getByLabelText('Organisasjonsnummer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send inn' })).toBeInTheDocument();
  });

  test('should keep attribute casing differences working', async () => {
    const { container } = await renderHtml(
      '<input TYPE="Email" name="email" /><input type="NUMBER" name="age" min="0" max="120" step="1" />',
    );

    const [email, age] = [...container.querySelectorAll('input')];
    expect(email).toHaveAttribute('type', 'email');
    expect(age).toHaveAttribute('type', 'number');
    expect(age).toHaveAttribute('min', '0');
    expect(age).toHaveAttribute('max', '120');
    expect(age).toHaveAttribute('step', '1');
  });

  test('should render prefilled fields without React controlled-input warnings', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await renderHtml(`
      <form action="https://example.com/submit">
        <input name="name" value="Ada" />
        <input type="checkbox" name="consent" checked />
        <select name="county"><option value="11" selected>Rogaland</option></select>
        <textarea name="comment">Hei</textarea>
      </form>
    `);

    expect(error).not.toHaveBeenCalled();
  });

  test('should render a disabled fieldset and submit inputs', async () => {
    const { container } = await renderHtml(`
      <form action="https://example.com/submit">
        <fieldset disabled><input name="a" /></fieldset>
        <input type="submit" value="Send inn" />
      </form>
    `);

    expect(container.querySelector('fieldset')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send inn' })).toHaveAttribute('type', 'submit');
  });

  test('should render markdown task lists as disabled checkboxes', async () => {
    const { container } = render(<Markdown onError={() => {}}>{'- [x] Sendt\n- [ ] Mottatt'}</Markdown>);

    await waitFor(() => {
      expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(2);
    });
    const [done, pending] = [...container.querySelectorAll('input')];
    expect(done).toBeChecked();
    expect(done).toBeDisabled();
    expect(pending).not.toBeChecked();
  });
});

describe('Form elements: submitting', () => {
  const submitForm = (container: HTMLElement, buttonName = 'Send') => {
    fireEvent.click(screen.getByRole('button', { name: buttonName }));
    return container.querySelector('form')!;
  };

  test('should hand the submission to the host instead of navigating', async () => {
    const onSubmit = vi.fn<(submission: FormSubmission) => void>();
    const { container } = await renderHtml(
      `<form action="https://example.com/submit" method="POST">
        <input name="name" value="Ada" />
        <input type="checkbox" name="consent" value="yes" checked />
        <select name="county"><option value="11" selected>Rogaland</option></select>
        <button type="submit" name="action" value="send">Send</button>
      </form>`,
      { onSubmit },
    );

    submitForm(container);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submission = onSubmit.mock.calls[0][0];
    expect(submission.action).toBe('https://example.com/submit');
    expect(submission.method).toBe('post');
    expect(submission.values).toMatchObject({ name: 'Ada', consent: 'yes', county: '11' });
    expect(submission.formData.get('name')).toBe('Ada');
  });

  test('should include the value of the button used to submit', async () => {
    const onSubmit = vi.fn<(submission: FormSubmission) => void>();
    const { container } = await renderHtml(
      `<form action="https://example.com/submit" method="post">
        <input name="name" value="Ada" />
        <button type="submit" name="intent" value="save">Lagre</button>
        <button type="submit" name="intent" value="submit">Send</button>
      </form>`,
      { onSubmit },
    );

    submitForm(container, 'Lagre');

    expect(onSubmit.mock.calls[0][0].values.intent).toBe('save');
  });

  test('should resolve a relative action against the configured base url', async () => {
    const onSubmit = vi.fn<(submission: FormSubmission) => void>();
    const { container } = await renderHtml(
      `<form action="./answers" method="post"><button type="submit">Send</button></form>`,
      { onSubmit, formPolicy: { baseUrl: 'https://example.com/dialogs/1/content' } },
    );

    submitForm(container);

    expect(onSubmit.mock.calls[0][0].action).toBe('https://example.com/dialogs/1/answers');
  });

  test('should fall back to the base url when the form has no action', async () => {
    const onSubmit = vi.fn<(submission: FormSubmission) => void>();
    const { container } = await renderHtml(`<form method="post"><button type="submit">Send</button></form>`, {
      onSubmit,
      formPolicy: { baseUrl: 'https://example.com/dialogs/1/content' },
    });

    submitForm(container);

    expect(onSubmit.mock.calls[0][0].action).toBe('https://example.com/dialogs/1/content');
  });

  test('should not submit when no handler is provided', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = await renderHtml(
      `<form action="https://example.com/submit"><button type="submit">Send</button></form>`,
    );

    submitForm(container);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no onSubmit handler'));
  });
});

describe('Form elements: safety', () => {
  const expectBlocked = async (html: string, reason: string) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSubmit = vi.fn();
    const { container } = await renderHtml(html, { onSubmit });

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(reason));
    return container;
  };

  test('should refuse to submit to the hosting application itself', async () => {
    const container = await expectBlocked(
      `<form action="${window.location.origin}/api/graphql" method="post"><button type="submit">Send</button></form>`,
      'targets the hosting application itself',
    );
    expect(container.querySelector('form')).not.toHaveAttribute('action');
  });

  test('should refuse to submit over plain http', async () => {
    await expectBlocked(
      '<form action="http://example.com/submit" method="post"><button type="submit">Send</button></form>',
      'must use https',
    );
  });

  test('should strip a javascript: action', async () => {
    const container = await expectBlocked(
      '<form action="javascript:alert(1)"><button type="submit">Send</button></form>',
      'no action',
    );
    expect(container.innerHTML).not.toContain('javascript:');
  });

  test('should strip event handler attributes', async () => {
    const { container } = await renderHtml(
      '<form action="https://example.com/submit"><input name="a" onfocus="alert(1)" /><button type="submit" onclick="alert(2)">Send</button></form>',
    );

    expect(container.innerHTML).not.toContain('alert');
    expect(container.querySelector('input')).not.toHaveAttribute('onfocus');
  });

  test('should strip formaction, formmethod and target overrides', async () => {
    const { container } = await renderHtml(
      `<form action="https://example.com/submit" target="_blank" method="post">
        <button type="submit" formaction="https://evil.example/steal" formmethod="get" formtarget="_blank">Send</button>
      </form>`,
    );

    expect(container.querySelector('form')).not.toHaveAttribute('target');
    expect(container.querySelector('button')).not.toHaveAttribute('formaction');
    expect(container.querySelector('button')).not.toHaveAttribute('formtarget');
    expect(container.innerHTML).not.toContain('evil.example');
  });

  test('should not render password inputs', async () => {
    const { container } = await renderHtml('<input type="password" name="secret" />');

    expect(container.querySelector('input[type="password"]')).not.toBeInTheDocument();
    expect(container.querySelector('input')).toHaveAttribute('type', 'text');
  });

  test('should not render image inputs', async () => {
    const { container } = await renderHtml('<input type="image" src="https://evil.example/pixel.png" name="go" />');

    expect(container.querySelector('input[type="image"]')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain('evil.example');
  });

  test('should drop an unsupported form method', async () => {
    const onSubmit = vi.fn<(submission: FormSubmission) => void>();
    const { container } = await renderHtml(
      '<form action="https://example.com/submit" method="dialog"><button type="submit">Send</button></form>',
      { onSubmit },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(container.querySelector('form')).toHaveAttribute('method', 'get');
    expect(onSubmit.mock.calls[0][0].method).toBe('get');
  });

  test('should strip scripts and iframes inside a form', async () => {
    const { container } = await renderHtml(
      '<form action="https://example.com/submit"><script>alert(1)</script><iframe src="https://evil.example"></iframe><input name="a" /></form>',
    );

    expect(container.querySelector('input')).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('evil.example');
    expect(container.innerHTML).not.toContain('alert(1)');
  });
});
