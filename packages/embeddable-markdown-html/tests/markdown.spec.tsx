import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Markdown } from '../src';

describe('Markdown: common mark + table support', () => {
  /* Tests for supported tags */
  test('should render paragraph', async () => {
    const markdownString = 'This is a paragraph.';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container).toHaveTextContent('This is a paragraph.');
    });
    expect(container.innerHTML).toEqual('<p class="__fce-paragraph">This is a paragraph.</p>');
  });
  test('should render italic text', async () => {
    const markdownString = '*italic*';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<em>italic</em>');
    });
  });
  test('should render bold text', async () => {
    const markdownString = '**bold**';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<strong class="__fce-strong">bold</strong>');
    });
  });
  test('should render unordered list', async () => {
    const markdownString = '- Item 1\n- Item 2';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelectorAll('ul > li').length).toBe(2);
    });
  });
  test('should render ordered list', async () => {
    const markdownString = '1. First\n2. Second';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelectorAll('ol > li').length).toBe(2);
    });
  });
  test('should render link', async () => {
    const markdownString = '[Altinn](https://altinn.no)';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', 'https://altinn.no');
      expect(link).toHaveTextContent('Altinn');
    });
  });
  test('should render inline code', async () => {
    const markdownString = 'Here is `inline code`.';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<code>inline code</code>');
    });
  });
  test('should render code block', async () => {
    const markdownString = '```\nconst x = 1;\n```';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('pre > code')).toHaveTextContent('const x = 1;');
    });
  });
  test('should render blockquote', async () => {
    const markdownString = '> This is a quote.';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('blockquote')).toHaveTextContent('This is a quote.');
    });
  });
  test('should render horizontal rule', async () => {
    const markdownString = '---';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('hr')).toBeInTheDocument();
    });
  });
  test('should render headings', async () => {
    const markdownString = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      for (let i = 1; i <= 6; i++) {
        expect(container.querySelector(`h${i}`)).toBeInTheDocument();
      }
    });
  });
  test('should render line break', async () => {
    const markdownString = 'Line one.  \nLine two.';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.innerHTML).toContain('<br>');
    });
  });
  test('should render paragraph', async () => {
    const markdownString = 'This is a paragraph.';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container).toHaveTextContent('This is a paragraph.');
    });
    expect(container.innerHTML).toEqual('<p class="__fce-paragraph">This is a paragraph.</p>');
  });

  /* Tests for unsupported tags */
  test('should not render image', async () => {
    const markdownString = '![image example](./example.png) *something else*';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('em')).toBeInTheDocument();
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });
  });

  test('should sanitize <script> tag but render supported content', async () => {
    const markdownString = '# Heading\n<script>alert("xss")</script>';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('h1')).toHaveTextContent('Heading');
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).not.toContain('alert("xss")');
    });
  });

  test('should sanitize <iframe> tag but render list', async () => {
    const markdownString = '- Item\n<iframe src="https://x.com"></iframe>';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('li')).toHaveTextContent('Item');
      expect(container.innerHTML).not.toContain('<iframe>');
      expect(container.innerHTML).not.toContain('x.com');
    });
  });

  test('should sanitize <video> tag but render bold text', async () => {
    const markdownString = '**Bold**\n<video src="foo.mp4"></video>';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('strong')).toHaveTextContent('Bold');
      expect(container.innerHTML).not.toContain('<video>');
      expect(container.innerHTML).not.toContain('foo.mp4');
    });
  });

  test('should sanitize raw <div> HTML but render emphasized text', async () => {
    const markdownString = '*emphasis* <div>raw html</div>';
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('em')).toHaveTextContent('emphasis');
      expect(container.innerHTML).not.toContain('<div>');
    });
  });

  test('should render table', async () => {
    const markdownString = `| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |`;
    const { container } = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(container.querySelector('table')).toHaveTextContent('Syntax');
      expect(container.querySelector('table')).toHaveTextContent('Description');
      expect(container.querySelectorAll('td')[0]).toHaveTextContent('Header');
      expect(container.querySelectorAll('td')[1]).toHaveTextContent('Title');
      expect(container.querySelectorAll('td')[2]).toHaveTextContent('Paragraph');
      expect(container.querySelectorAll('td')[3]).toHaveTextContent('Text');
    });
  });
});

describe('Markdown: definition lists', () => {
  const renderMarkdown = async (markdownString: string) => {
    const result = render(<Markdown onError={() => {}}>{markdownString}</Markdown>);
    await waitFor(() => {
      expect(result.container.firstChild).toBeInTheDocument();
    });
    return result.container;
  };

  const describeChildren = (element: Element) =>
    Array.from(element.children, (child) => [child.tagName, child.textContent?.trim()]);

  test('should render label/value pairs as dt/dd pairs in a dl', async () => {
    const container = await renderMarkdown('Date sent\n: 06.10.2026 / 14:09\n\nSender\n: 029147*****-Ola Nordmann');
    const dl = container.querySelector('dl');
    expect(dl).toHaveClass('__fce-description-list');
    expect(describeChildren(dl!)).toEqual([
      ['DT', 'Date sent'],
      ['DD', '06.10.2026 / 14:09'],
      ['DT', 'Sender'],
      ['DD', '029147*****-Ola Nordmann'],
    ]);
    expect(container.querySelectorAll('dt.__fce-description-term').length).toBe(2);
    expect(container.querySelectorAll('dd.__fce-description-details').length).toBe(2);
    expect(container.querySelector('table')).not.toBeInTheDocument();
    expect(container.querySelector('dd > p')).not.toBeInTheDocument();
  });

  test('should render inline markdown inside terms and details', async () => {
    const container = await renderMarkdown('*Status*\n: **Sent** to [Altinn](https://altinn.no)');
    expect(container.querySelector('dt > em')).toHaveTextContent('Status');
    expect(container.querySelector('dd > strong')).toHaveTextContent('Sent');
    expect(container.querySelector('dd > a')).toHaveAttribute('href', 'https://altinn.no');
  });

  test('should render several details for one term', async () => {
    const container = await renderMarkdown('Attachments\n: receipt.pdf\n: form.pdf');
    expect(describeChildren(container.querySelector('dl')!)).toEqual([
      ['DT', 'Attachments'],
      ['DD', 'receipt.pdf'],
      ['DD', 'form.pdf'],
    ]);
  });

  test('should wrap details in paragraphs when a blank line precedes the colon', async () => {
    const container = await renderMarkdown('Comment\n\n: First paragraph.\n\n  Second paragraph.');
    const paragraphs = container.querySelectorAll('dd > p.__fce-paragraph');
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0]).toHaveTextContent('First paragraph.');
    expect(paragraphs[1]).toHaveTextContent('Second paragraph.');
  });

  test('should keep colons that do not start a definition as text', async () => {
    const container = await renderMarkdown('Note: something here\n\nTime\n:10:00');
    expect(container.querySelector('dl')).not.toBeInTheDocument();
    expect(container.innerHTML).toEqual(
      '<p class="__fce-paragraph">Note: something here</p>\n<p class="__fce-paragraph">Time\n:10:00</p>',
    );
  });

  test('should render surrounding content as before', async () => {
    const container = await renderMarkdown(
      'Intro paragraph.\n\nLabel\n: Value\n\n| Syntax | Description |\n| - | - |\n| Header | Title |\n\n- Item',
    );
    expect(describeChildren(container)).toEqual([
      ['P', 'Intro paragraph.'],
      ['DL', 'Label\nValue'],
      ['TABLE', 'SyntaxDescriptionHeaderTitle'],
      ['UL', 'Item'],
    ]);
    expect(container.querySelectorAll('thead th').length).toBe(2);
    expect(container.querySelectorAll('tbody td').length).toBe(2);
  });
});
