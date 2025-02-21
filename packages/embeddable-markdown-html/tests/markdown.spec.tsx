import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Markdown } from '../src';

describe('Markdown', () => {
  test('should render content', async () => {
    const { container, getByText } = render(<Markdown onError={() => {}}># header</Markdown>);
    await waitFor(() => {
      expect(getByText('header')).toBeInTheDocument();
    });
    expect(container.innerHTML).toEqual('<h1 class="__fce-header-1">header</h1>');
  });

  test('should render hard line breaks, 1', async () => {
    const markdownString = `foo  \rbaz`;
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);

    await waitFor(() => {
      expect(container).toHaveTextContent('foo');
      expect(container).toHaveTextContent('baz');
    });
    expect(container.innerHTML).toEqual(`<p class="__fce-paragraph">foo<br>
baz</p>`);
  });

  test('should render hard line breaks, 2', async () => {
    const markdownString = `This is the first line.  
This is the second line.`;
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);

    await waitFor(() => {
      expect(container).toHaveTextContent('This is the first line');
      expect(container).toHaveTextContent('This is the second line');
    });
    expect(container.innerHTML).toEqual(`<p class="__fce-paragraph">This is the first line.<br>
This is the second line.</p>`);
  });

  test('list items', async () => {
    const markdownString = '1.  A paragraph\n    with two lines.\n\n        indented code\n\n    > A block quote.\n';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container).toHaveTextContent('A paragraph with two lines.');
      expect(container).toHaveTextContent('indented code');
      expect(container).toHaveTextContent('A block quote.');
    });
    expect(container.innerHTML).toEqual(`<ol>
<li class="__fce-list-item">
<p class="__fce-paragraph">A paragraph
with two lines.</p>
<pre><code>indented code
</code></pre>
<blockquote>
<p class="__fce-paragraph">A block quote.</p>
</blockquote>
</li>
</ol>`);
  });

  test('should render link', async () => {
    const markdownString = '[foo]: /url "title"\n\n[foo]\n';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container).toHaveTextContent('foo');
    });
    expect(container.innerHTML).toEqual(`<p class="__fce-paragraph"><a href="/url" title="title">foo</a></p>`);
  });

  test('should render emphasis and strong emphasis', async () => {
    const markdownString = '**foo**  *bar*';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container).toHaveTextContent('foo');
    });
    expect(container.innerHTML).toEqual(
      `<p class="__fce-paragraph"><strong class="__fce-strong">foo</strong>  <em>bar</em></p>`,
    );
  });
});
