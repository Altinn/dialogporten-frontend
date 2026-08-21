import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { FormSubmission } from '../src';
import { Markdown } from '../src';

const content = `**Kontakt-e-post:** *ikke utfylt* · **Samtykke:** ☐ ikke gitt


<form method="post" action="{formAction:innsending-sjekk}" style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:38rem">
<input type="hidden" name="__token" value="{formToken}">
<p style="margin:0 0 .35rem;font-weight:600">Kontakt-e-post</p>
<input type="email" name="epost" value="" placeholder="navn@example.no" required style="width:100%;box-sizing:border-box;padding:.55rem .7rem;font-size:1rem;border:1px solid #767676;border-radius:4px">
<p style="margin:.3rem 0 1.1rem;color:#555;font-size:.9rem">Vi varsler deg her når saken er ferdig behandlet.</p>
<input type="hidden" name="samtykke" value="false">
<p style="margin:0 0 1.1rem"><input type="checkbox" id="samtykke" name="samtykke" value="true"  required style="width:1.1rem;height:1.1rem;vertical-align:-2px"> <label for="samtykke">Jeg samtykker til at opplysningene deles med saksbehandler.</label></p>
<button type="submit" style="background:#0062ba;color:#fff;border:0;border-radius:4px;padding:.65rem 1.4rem;font-size:1rem">Send inn</button>
</form>`;

const policy = {
  baseUrl: 'https://serviceowner.example/dialogs/1/content',
  token: 'dialog-token-123',
};

const renderContent = async (
  props: { onSubmit?: (submission: FormSubmission) => void; formPolicy?: typeof policy } = {},
) => {
  const result = render(
    <Markdown onError={() => {}} formPolicy={policy} {...props}>
      {content}
    </Markdown>,
  );
  await waitFor(() => {
    expect(result.container.querySelector('form')).toBeInTheDocument();
  });
  return result;
};

describe('Service owner form content', () => {
  test('should render the markdown intro and the form together', async () => {
    const { container } = await renderContent();

    expect(container.querySelector('strong')).toHaveTextContent('Kontakt-e-post:');
    expect(container.querySelector('em')).toHaveTextContent('ikke utfylt');
    expect(container.querySelector('input[type="email"]')).toHaveAttribute('placeholder', 'navn@example.no');
    expect(screen.getByLabelText('Jeg samtykker til at opplysningene deles med saksbehandler.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send inn' })).toBeInTheDocument();
  });

  test('should keep the inline styling the service owner asked for', async () => {
    const { container } = await renderContent();

    expect(container.querySelector('form')).toHaveStyle({ maxWidth: '38rem' });
    expect(container.querySelector('input[type="email"]')).toHaveStyle({
      width: '100%',
      boxSizing: 'border-box',
      borderRadius: '4px',
    });
    expect(container.querySelector('button')).toHaveStyle({ background: '#0062ba', color: '#fff' });
    expect(container.querySelector('form p')).toHaveStyle({ fontWeight: '600' });
  });

  test('should resolve the action placeholder against the content url', async () => {
    const { container } = await renderContent();

    expect(container.querySelector('form')).toHaveAttribute(
      'action',
      'https://serviceowner.example/dialogs/1/innsending-sjekk',
    );
  });

  test('should fill the token placeholder with the token from the host', async () => {
    const { container } = await renderContent();

    expect(container.querySelector('input[name="__token"]')).toHaveValue('dialog-token-123');
  });

  test('should submit the fields the service owner expects', async () => {
    const onSubmit = vi.fn<(submission: FormSubmission) => void>();
    const { container } = await renderContent({ onSubmit });

    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'ada@example.no' } });
    fireEvent.click(screen.getByLabelText('Jeg samtykker til at opplysningene deles med saksbehandler.'));
    fireEvent.click(screen.getByRole('button', { name: 'Send inn' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const { action, method, values } = onSubmit.mock.calls[0][0];
    expect(action).toBe('https://serviceowner.example/dialogs/1/innsending-sjekk');
    expect(method).toBe('post');
    expect(values.__token).toBe('dialog-token-123');
    expect(values.epost).toBe('ada@example.no');
    expect(values.samtykke).toEqual(['false', 'true']);
  });

  test('should submit consent as false when the box is left unchecked', async () => {
    const onSubmit = vi.fn<(submission: FormSubmission) => void>();
    const { container } = await renderContent({ onSubmit });

    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'ada@example.no' } });
    fireEvent.submit(container.querySelector('form')!);

    expect(onSubmit.mock.calls[0][0].values.samtykke).toBe('false');
  });

  test('should not hand the token to a form that posts somewhere else', async () => {
    const { container } = render(
      <Markdown onError={() => {}} formPolicy={policy}>
        {
          '<form action="https://elsewhere.example/collect" method="post"><input type="hidden" name="__token" value="{formToken}"></form>'
        }
      </Markdown>,
    );

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
    expect(container.querySelector('input[name="__token"]')).toHaveValue('');
  });
});

describe('Inline styles', () => {
  const renderStyled = async (html: string) => {
    const result = render(<Markdown onError={() => {}}>{html}</Markdown>);
    await waitFor(() => {
      expect(result.container.firstChild).not.toBeNull();
    });
    return result;
  };

  test('should drop declarations that could break out of the content area', async () => {
    const { container } = await renderStyled(
      '<p style="position:fixed;top:0;left:0;z-index:9999;color:#555">Overlay</p>',
    );

    const paragraph = container.querySelector('p')!;
    expect(paragraph.style.position).toBe('');
    expect(paragraph.style.zIndex).toBe('');
    expect(paragraph).toHaveStyle({ color: '#555' });
  });

  test('should drop declarations that load remote resources', async () => {
    const { container } = await renderStyled(
      '<p style="background:url(https://tracker.example/pixel.png);font-weight:600">Tracked</p>',
    );

    expect(container.innerHTML).not.toContain('tracker.example');
    expect(container.querySelector('p')).toHaveStyle({ fontWeight: '600' });
  });

  test('should drop escaped and legacy script values', async () => {
    const { container } = await renderStyled(
      '<p style="width:expression(alert(1));behavior:url(#default#time2);color:red">Legacy</p>',
    );

    const paragraph = container.querySelector('p')!;
    expect(paragraph.style.width).toBe('');
    expect(container.innerHTML).not.toContain('expression');
    expect(paragraph).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });
});
