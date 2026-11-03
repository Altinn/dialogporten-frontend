import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDomMutationGuard } from './domMutationGuard.ts';

const native = {
  insertBefore: Node.prototype.insertBefore,
  removeChild: Node.prototype.removeChild,
  setNodeValue: Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue')!.set!,
};

const translatedTextNodes = new WeakSet<Node>();
const isText = (node: Node | null): node is Text => node?.nodeType === Node.TEXT_NODE;
const isInsideFont = (node: Node) => !!node.parentElement?.closest('font');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const createFontWrapper = (text: string) => {
  const outer = document.createElement('font');
  outer.setAttribute('style', 'vertical-align: inherit;');
  const inner = outer.appendChild(document.createElement('font'));
  inner.setAttribute('style', 'vertical-align: inherit;');
  translatedTextNodes.add(inner.appendChild(document.createTextNode(`[${text}]`)));
  return outer;
};

const mergeAdjacentText = (parent: Node) => {
  for (let child = parent.firstChild; child; child = child.nextSibling) {
    while (isText(child) && isText(child.nextSibling)) {
      const next = child.nextSibling;
      native.setNodeValue.call(child, child.data + next.data);
      native.removeChild.call(parent, next);
    }
  }
};

const translateSubtree = (root: Element) => {
  for (const parent of [root, ...root.querySelectorAll('*')]) {
    mergeAdjacentText(parent);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }
  for (const text of textNodes) {
    if (translatedTextNodes.has(text) || isInsideFont(text) || !text.data.trim()) continue;
    for (const segment of text.data.split(/(\d+)/).filter(Boolean)) {
      native.insertBefore.call(text.parentNode!, createFontWrapper(segment), text);
    }
    native.removeChild.call(text.parentNode!, text);
  }
};

const startTranslator = async (root: HTMLElement) => {
  document.documentElement.classList.add('translated-ltr');
  await settle();
  translateSubtree(root);
  const observer = new MutationObserver((records) => {
    const parents = new Set<Element>();
    for (const record of records) {
      for (const added of record.addedNodes) {
        if (isText(added) && !translatedTextNodes.has(added) && !isInsideFont(added) && added.parentElement) {
          parents.add(added.parentElement);
        }
      }
    }
    for (const parent of parents) {
      if (parent.isConnected) translateSubtree(parent);
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  await settle();
  return () => observer.disconnect();
};

const BusyLabel = ({ busy, label }: { busy: boolean; label: string }) => (
  <span>
    {busy && <i />}
    {label}
  </span>
);

const Status = ({ status }: { status: string }) => (
  <p>
    {status}
    <b>!</b>
  </p>
);

const Counter = ({ count }: { count: number }) => (
  <p>
    Unread: {count}
    <b>!</b>
  </p>
);

const OptionalText = ({ show }: { show: boolean }) => (
  <p>
    Label {show && 'extra'}
    <b>!</b>
  </p>
);

const Paragraph = ({ note = false }: { note?: boolean }) => (
  <p>
    {note && <em />}
    <a href="/help">help</a>
  </p>
);

describe('installDomMutationGuard', () => {
  let container: HTMLDivElement;
  let root: Root;
  let uninstall: () => void;
  let stopTranslator: (() => void) | undefined;
  const onRepair = vi.fn();

  const render = async (element: React.ReactNode) => {
    await act(async () => {
      root.render(element);
    });
    await settle();
  };

  beforeEach(() => {
    uninstall = installDomMutationGuard({ pageLanguage: () => 'nb', onRepair });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    stopTranslator?.();
    stopTranslator = undefined;
    uninstall();
    document.documentElement.classList.remove('translated-ltr');
    document.documentElement.lang = 'nb';
    onRepair.mockReset();
  });

  it('still throws on an untranslated page so real DOM bugs stay visible', async () => {
    await render(<BusyLabel busy={false} label="Send" />);
    const span = container.querySelector('span')!;
    span.replaceChild(document.createElement('span'), span.firstChild!);

    await expect(render(<BusyLabel busy label="Send" />)).rejects.toMatchObject({ name: 'NotFoundError' });
    expect(onRepair).not.toHaveBeenCalled();
  });

  it('inserts before translated text in the original order', async () => {
    await render(<BusyLabel busy={false} label="Send" />);
    stopTranslator = await startTranslator(container);

    await render(<BusyLabel busy label="Send" />);

    const span = container.querySelector('span')!;
    expect(span.firstElementChild?.tagName).toBe('I');
    expect(span.textContent).toBe('[Send]');
    expect(onRepair).toHaveBeenCalledWith('insertBefore');
  });

  it('shows text updates on a translated page', async () => {
    await render(<Status status="Open" />);
    stopTranslator = await startTranslator(container);
    expect(container.textContent).toBe('[Open][!]');

    await render(<Status status="Closed" />);

    expect(container.textContent).toBe('[Closed][!]');
    expect(onRepair).toHaveBeenCalledWith('textUpdate');
  });

  it('restores text nodes the translator merged without duplicating them', async () => {
    await render(<Counter count={1} />);
    stopTranslator = await startTranslator(container);
    expect(container.textContent).toBe('[Unread: ][1][!]');

    await render(<Counter count={2} />);

    expect(container.textContent).toBe('[Unread: ][2][!]');
  });

  it('removes translated text that is unmounted', async () => {
    await render(<OptionalText show />);
    stopTranslator = await startTranslator(container);
    expect(container.textContent).toBe('[Label extra][!]');

    await render(<OptionalText show={false} />);

    expect(container.textContent).toBe('[Label ][!]');
    expect(onRepair).toHaveBeenCalledWith('removeChild');
  });

  it('inserts before the wrapper when the translator moved the reference node into it', async () => {
    await render(<Paragraph />);
    document.documentElement.classList.add('translated-ltr');
    const link = container.querySelector('a')!;
    const font = document.createElement('font');
    link.replaceWith(font);
    font.appendChild(link);

    await render(<Paragraph note />);

    expect(container.querySelector('p')!.innerHTML).toBe('<em></em><font><a href="/help">help</a></font>');
  });

  it('treats a changed <html lang> as a translated page', async () => {
    await render(<BusyLabel busy={false} label="Send" />);
    document.documentElement.lang = 'en';
    const span = container.querySelector('span')!;
    span.replaceChild(document.createElement('span'), span.firstChild!);

    await render(<BusyLabel busy label="Send" />);

    expect(span.querySelector('i')).not.toBeNull();
  });

  it('treats translator markup as a translated page when <html> is not marked', async () => {
    await render(<BusyLabel busy={false} label="Send" />);
    const span = container.querySelector('span')!;
    span.replaceChild(createFontWrapper('Send'), span.firstChild!);

    await render(<BusyLabel busy label="Send" />);

    expect(span.querySelector('i')).not.toBeNull();
  });

  it('leaves DOM operations on an untouched tree alone', async () => {
    await render(<BusyLabel busy={false} label="Send" />);
    await render(<BusyLabel busy label="Send" />);
    await render(<BusyLabel busy={false} label="Send" />);

    expect(container.querySelector('span')!.innerHTML).toBe('Send');
    expect(onRepair).not.toHaveBeenCalled();
  });
});
