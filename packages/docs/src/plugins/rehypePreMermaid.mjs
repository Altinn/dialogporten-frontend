const hasClass = (node, name) => {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.includes(name);
  return typeof className === 'string' && className.split(/\s+/).includes(name);
};

const toText = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(toText).join(''));

const mermaidCode = (node) => {
  if (node.type !== 'element' || node.tagName !== 'pre') return undefined;
  const content = node.children.filter((child) => child.type !== 'text' || /\S/.test(child.value));
  const [code] = content;
  if (content.length !== 1 || code.type !== 'element' || code.tagName !== 'code') return undefined;
  return hasClass(code, 'language-mermaid') ? code : undefined;
};

const transform = (node) => {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    const code = mermaidCode(child);
    if (!code) return child;
    return {
      type: 'element',
      tagName: 'pre',
      properties: { className: ['mermaid'] },
      children: [{ type: 'text', value: toText(code) }],
    };
  });
  node.children.forEach(transform);
};

export default function rehypePreMermaid() {
  return transform;
}
