import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Html } from '../src';

describe('Html', () => {
  test('should render paragraph', async () => {
    const html = '<p>This is a paragraph.</p>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container).toHaveTextContent('This is a paragraph.');
    });
    expect(container.innerHTML).toEqual('<p class="__fce-paragraph">This is a paragraph.</p>');
  });

  test('should render italic text', async () => {
    const html = '<em>italic</em>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<em>italic</em>');
    });
  });

  test('should render bold text', async () => {
    const html = '<strong>bold</strong>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<strong class="__fce-strong">bold</strong>');
    });
  });

  test('should render unordered list', async () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelectorAll('ul > li').length).toBe(2);
    });
  });

  test('should render ordered list', async () => {
    const html = '<ol><li>First</li><li>Second</li></ol>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelectorAll('ol > li').length).toBe(2);
    });
  });

  test('should render link', async () => {
    const html = '<a href="https://openai.com">OpenAI</a>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', 'https://openai.com');
      expect(link).toHaveTextContent('OpenAI');
    });
  });

  test('should render inline code', async () => {
    const html = '<code>inline code</code>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<code>inline code</code>');
    });
  });

  test('should render code block', async () => {
    const html = '<pre><code>const x = 1;</code></pre>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelector('pre > code')).toHaveTextContent('const x = 1;');
    });
  });

  test('should render blockquote', async () => {
    const html = '<blockquote>This is a quote.</blockquote>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelector('blockquote')).toHaveTextContent('This is a quote.');
    });
  });

  test('should render horizontal rule', async () => {
    const html = '<hr>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelector('hr')).toBeInTheDocument();
    });
  });

  test('should render headings', async () => {
    const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      for (let i = 1; i <= 6; i++) {
        expect(container.querySelector(`h${i}`)).toBeInTheDocument();
      }
    });
  });

  test('should render line break', async () => {
    const html = 'Line one.<br>Line two.';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<br>');
    });
  });

  test('should render table', async () => {
    const html =
      '<table><thead><tr><th>Syntax</th><th>Description</th></tr></thead><tbody><tr><td>Header</td><td>Title</td></tr><tr><td>Paragraph</td><td>Text</td></tr></tbody></table>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<table>');
    });
  });

  /* Unsupported / sanitized tags */
  test('should render image', async () => {
    const html = '<img src="https://example.com/example.png" alt="example" /><em>something else</em>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelector('em')).toBeInTheDocument();
      expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/example.png');
    });
  });

  test('should render image with an inline data: source', async () => {
    const src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4K';
    const html = `<img alt="logo" width="48" height="48" src="${src}">`;
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', src);
      expect(img).toHaveAttribute('width', '48');
      expect(img).toHaveAttribute('alt', 'logo');
    });
  });

  test('should keep a full table structure so rows stay inside a section', async () => {
    // caption/tfoot used to be dropped, which hoisted the tfoot row to a direct child
    // of <table> and tripped React's DOM nesting validation.
    const html = `<table>
      <caption>Order lines</caption>
      <thead><tr><th scope="col">Article</th><th scope="col">Qty</th></tr></thead>
      <tbody><tr><td>Pump</td><td>2</td></tr></tbody>
      <tfoot><tr><td colspan="2">Total</td></tr></tfoot>
    </table>`;
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      expect(Array.from(table!.children).map((child) => child.tagName)).toEqual(['CAPTION', 'THEAD', 'TBODY', 'TFOOT']);
      expect(container.querySelector('tfoot td')).toHaveAttribute('colspan', '2');
    });
  });

  test('should keep div wrappers and their inline styles', async () => {
    const html = '<div style="padding: 8px"><div>inner</div></div>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelectorAll('div').length).toBe(2);
      expect(container.querySelector('div')).toHaveStyle({ padding: '8px' });
    });
  });

  test('should sanitize <script> tag but render supported content', async () => {
    const html = '<h1>Heading</h1><script>alert("xss")</script>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelector('h1')).toHaveTextContent('Heading');
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).not.toContain('alert("xss")');
    });
  });

  test('should sanitize <iframe> tag but render list', async () => {
    const html = '<ul><li>Item</li></ul><iframe src="https://x.com"></iframe>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelector('li')).toHaveTextContent('Item');
      expect(container.innerHTML).not.toContain('<iframe>');
      expect(container.innerHTML).not.toContain('x.com');
    });
  });

  test('should sanitize <video> tag but render bold text', async () => {
    const html = '<strong>Bold</strong><video src="foo.mp4"></video>';
    const { container } = render(<Html onError={() => {}}>{html}</Html>);
    await waitFor(() => {
      expect(container.querySelector('strong')).toHaveTextContent('Bold');
      expect(container.innerHTML).not.toContain('<video>');
      expect(container.innerHTML).not.toContain('foo.mp4');
    });
  });
});
