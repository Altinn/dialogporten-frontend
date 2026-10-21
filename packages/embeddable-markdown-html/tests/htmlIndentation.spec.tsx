import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { flattenHtmlIndentation, Markdown } from '../src';

describe('flattenHtmlIndentation', () => {
  test('flattens indentation of a body that starts with a tag', () => {
    const value = '<div>\n    <p>one</p>\n\n    <p>two</p>\n</div>';
    expect(flattenHtmlIndentation(value)).toBe('<div>\n<p>one</p>\n\n<p>two</p>\n</div>');
  });

  test('leaves a markdown body alone, indented code blocks included', () => {
    const value = 'Some prose\n\n    <p>this is a code sample</p>\n';
    expect(flattenHtmlIndentation(value)).toBe(value);
  });

  test('keeps whitespace inside pre and textarea, where it is content', () => {
    const value = '<div>\n    <pre>\n      indented line\n    </pre>\n    <p>after</p>\n</div>';
    expect(flattenHtmlIndentation(value)).toBe('<div>\n<pre>\n      indented line\n    </pre>\n<p>after</p>\n</div>');
  });
});

describe('Markdown with a pretty-printed html body', () => {
  // A body split by blank lines and indented four spaces or more used to be parsed as indented
  // code blocks from the first blank line on, so the markup showed up as literal text.
  const body = `<div>
  <h2>Contact us</h2>

  <form method="post" action="https://example.com/submit">
    <p>
      <label for="name">Your name</label>
      <input id="name" name="name" type="text"
             value="">
    </p>

    <p>
      <textarea id="message" name="message" rows="5"></textarea>
    </p>

    <button type="submit">Send enquiry</button>
  </form>
</div>`;

  test('renders the form, its paragraphs and its submit button as elements', async () => {
    const { container } = render(<Markdown onError={() => {}}>{body}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('form')).toHaveAttribute('action', 'https://example.com/submit');
      expect(container.querySelectorAll('p').length).toBeGreaterThanOrEqual(2);
      expect(container.querySelector('input')).toHaveAttribute('name', 'name');
      expect(container.querySelector('textarea')).toHaveAttribute('rows', '5');
      expect(container.querySelector('button')).toHaveAttribute('type', 'submit');
      expect(container.querySelectorAll('pre code').length).toBe(0);
    });
  });

  test('still renders a real indented code block in a markdown body', async () => {
    const markdownBody = 'Prose first, so this is markdown.\n\n    <p>code sample</p>\n';
    const { container } = render(<Markdown onError={() => {}}>{markdownBody}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('pre code')).toHaveTextContent('<p>code sample</p>');
    });
  });
});
