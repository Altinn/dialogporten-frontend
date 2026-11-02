export type DomRepairTrigger = 'insertBefore' | 'removeChild' | 'textUpdate';

interface DomMutationGuardOptions {
  pageLanguage?: () => string;
  onRepair?: (trigger: DomRepairTrigger) => void;
}

interface Displacement {
  parent: Node;
  originals: Text[];
  wrappers: Node[];
}

const translatorMarkup = 'font[style*="vertical-align"], font[_msttexthash]';

const isText = (node: Node | null): node is Text => node?.nodeType === Node.TEXT_NODE;

const closestChildOf = (parent: Node, node: Node): Node | null => {
  let current: Node | null = node;
  while (current && current.parentNode !== parent) {
    current = current.parentNode;
  }
  return current;
};

export const installDomMutationGuard = ({ pageLanguage, onRepair }: DomMutationGuardOptions = {}): (() => void) => {
  const { insertBefore, removeChild } = Node.prototype;
  const nodeValue = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue')!;
  const data = Object.getOwnPropertyDescriptor(CharacterData.prototype, 'data')!;
  const html = document.documentElement;
  const displaced = new WeakMap<Text, Displacement>();
  const pageValues = new WeakMap<Text, string>();
  let isTracking = false;

  const hasTranslationSignal = () =>
    html.classList.contains('translated-ltr') ||
    html.classList.contains('translated-rtl') ||
    (!!pageLanguage && html.lang !== pageLanguage());

  const isPageTranslated = () => hasTranslationSignal() || document.querySelector(translatorMarkup) !== null;

  const trackDisplacements = (records: MutationRecord[]) => {
    const added = new Set<Node>();
    const removed = new Set<Node>();
    const claimed = new Set<Node>();
    const merged = new Map<Text, Text[]>();
    for (const record of records) {
      for (const node of record.addedNodes) added.add(node);
      for (const node of record.removedNodes) removed.add(node);
    }
    const isWrapper = (node: Node | null, parent: Node): node is Node =>
      !!node && added.has(node) && !removed.has(node) && !claimed.has(node) && node.parentNode === parent;

    for (const record of records) {
      if (record.type === 'characterData') {
        if (isText(record.target) && !pageValues.has(record.target)) {
          pageValues.set(record.target, record.oldValue ?? '');
        }
        continue;
      }
      for (const node of record.removedNodes) {
        if (!isText(node) || node.parentNode) continue;
        const { previousSibling, nextSibling, target: parent } = record;
        if (isText(previousSibling) && !previousSibling.parentNode) {
          merged.set(previousSibling, [...(merged.get(previousSibling) ?? []), node]);
          continue;
        }
        const wrappers: Node[] = [];
        for (let sibling = previousSibling; isWrapper(sibling, parent); sibling = sibling.previousSibling) {
          wrappers.unshift(sibling);
        }
        for (const addedNode of record.addedNodes) {
          if (isWrapper(addedNode, parent) && !wrappers.includes(addedNode)) wrappers.push(addedNode);
        }
        for (let sibling = nextSibling; isWrapper(sibling, parent); sibling = sibling.nextSibling) {
          wrappers.push(sibling);
        }
        if (!wrappers.some((wrapper) => wrapper.nodeName === 'FONT')) continue;
        const displacement = { parent, originals: [node, ...(merged.get(node) ?? [])], wrappers };
        for (const wrapper of wrappers) claimed.add(wrapper);
        for (const original of displacement.originals) displaced.set(original, displacement);
      }
    }
  };

  const observer = new MutationObserver(trackDisplacements);

  const signalObserver = new MutationObserver(() => {
    if (hasTranslationSignal()) startTracking();
  });

  const startTracking = () => {
    if (isTracking) return;
    isTracking = true;
    signalObserver.disconnect();
    observer.observe(html, { childList: true, subtree: true, characterData: true, characterDataOldValue: true });
  };

  const restore = ({ parent, originals, wrappers }: Displacement) => {
    for (const original of originals) displaced.delete(original);
    const anchor = wrappers.find((wrapper) => wrapper.parentNode === parent);
    if (!anchor) return false;
    for (const original of originals) {
      data.set!.call(original, pageValues.get(original) ?? original.data);
      insertBefore.call(parent, original, anchor);
    }
    for (const wrapper of wrappers) {
      if (wrapper.parentNode === parent) removeChild.call(parent, wrapper);
    }
    observer.takeRecords();
    return true;
  };

  const restoreDisplaced = (node: Node, trigger: DomRepairTrigger) => {
    if (!isTracking || !isText(node)) return false;
    trackDisplacements(observer.takeRecords());
    const displacement = displaced.get(node);
    if (!displacement || !restore(displacement)) return false;
    onRepair?.(trigger);
    return true;
  };

  const repairWithoutRestore = (trigger: DomRepairTrigger) => {
    if (!isPageTranslated()) return false;
    startTracking();
    onRepair?.(trigger);
    return true;
  };

  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null): T {
    if (!child || child.parentNode === this || restoreDisplaced(child, 'insertBefore')) {
      return insertBefore.call(this, node, child) as T;
    }
    if (!repairWithoutRestore('insertBefore')) {
      return insertBefore.call(this, node, child) as T;
    }
    return insertBefore.call(this, node, closestChildOf(this, child)) as T;
  };

  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode === this || restoreDisplaced(child, 'removeChild') || !repairWithoutRestore('removeChild')) {
      return removeChild.call(this, child) as T;
    }
    if (child.parentNode && this.contains(child)) {
      removeChild.call(child.parentNode, child);
    }
    return child;
  };

  const patchTextSetter = (prototype: object, key: string, descriptor: PropertyDescriptor) => {
    Object.defineProperty(prototype, key, {
      ...descriptor,
      set(this: Node, value: string) {
        descriptor.set!.call(this, value);
        if (isTracking && isText(this)) {
          pageValues.set(this, this.data);
          restoreDisplaced(this, 'textUpdate');
        }
      },
    });
  };
  patchTextSetter(Node.prototype, 'nodeValue', nodeValue);
  patchTextSetter(CharacterData.prototype, 'data', data);

  if (hasTranslationSignal()) {
    startTracking();
  } else {
    signalObserver.observe(html, { attributes: true, attributeFilter: ['class', 'lang'] });
  }

  return () => {
    observer.disconnect();
    signalObserver.disconnect();
    Node.prototype.insertBefore = insertBefore;
    Node.prototype.removeChild = removeChild;
    Object.defineProperty(Node.prototype, 'nodeValue', nodeValue);
    Object.defineProperty(CharacterData.prototype, 'data', data);
  };
};
