const SOURCE_ATTR = 'data-mermaid-source';

const diagrams = () => Array.from(document.querySelectorAll<HTMLElement>('pre.mermaid'));

const currentTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default');

const render = async () => {
  const nodes = diagrams();
  if (nodes.length === 0) return;

  const { default: mermaid } = await import('mermaid');

  for (const node of nodes) {
    if (!node.hasAttribute(SOURCE_ATTR)) {
      node.setAttribute(SOURCE_ATTR, node.textContent ?? '');
    }
    node.innerHTML = node.getAttribute(SOURCE_ATTR) ?? '';
    node.removeAttribute('data-processed');
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: currentTheme(),
    securityLevel: 'strict',
  });

  await mermaid.run({ nodes });
};

if (diagrams().length > 0) {
  render();

  new MutationObserver((records) => {
    if (records.some((r) => r.attributeName === 'data-theme')) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
