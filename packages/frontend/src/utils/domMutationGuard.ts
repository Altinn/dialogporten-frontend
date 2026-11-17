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

interface RecordScan {
  added: Set<Node>;
  removed: Set<Node>;
  claimed: Set<Node>;
  merged: Map<Text, Text[]>;
}

const scanRecords = (records: MutationRecord[]): RecordScan => {
  const added = new Set<Node>();
  const removed = new Set<Node>();
  for (const record of records) {
    for (const node of record.addedNodes) added.add(node);
    for (const node of record.removedNodes) removed.add(node);
  }
  return { added, removed, claimed: new Set<Node>(), merged: new Map<Text, Text[]>() };
};

const isWrapper = ({ added, removed, claimed }: RecordScan, node: Node | null, parent: Node): node is Node =>
  !!node && added.has(node) && !removed.has(node) && !claimed.has(node) && node.parentNode === parent;

const collectWrappers = (scan: RecordScan, record: MutationRecord): Node[] => {
  const { previousSibling, nextSibling, target: parent } = record;
  const wrappers: Node[] = [];
  for (let sibling = previousSibling; isWrapper(scan, sibling, parent); sibling = sibling.previousSibling) {
    wrappers.unshift(sibling);
  }
  for (const addedNode of record.addedNodes) {
    if (isWrapper(scan, addedNode, parent) && !wrappers.includes(addedNode)) wrappers.push(addedNode);
  }
  for (let sibling = nextSibling; isWrapper(scan, sibling, parent); sibling = sibling.nextSibling) {
    wrappers.push(sibling);
  }
  return wrappers;
};

const rememberPageValue = (pageValues: WeakMap<Text, string>, { target, oldValue }: MutationRecord) => {
  if (isText(target) && !pageValues.has(target)) {
    pageValues.set(target, oldValue ?? '');
  }
};

const trackRemovedText = (
  scan: RecordScan,
  displaced: WeakMap<Text, Displacement>,
  record: MutationRecord,
  node: Node,
) => {
  if (!isText(node) || node.parentNode) return;
  const { previousSibling } = record;
  if (isText(previousSibling) && !previousSibling.parentNode) {
    scan.merged.set(previousSibling, [...(scan.merged.get(previousSibling) ?? []), node]);
    return;
  }
  const wrappers = collectWrappers(scan, record);
  if (!wrappers.some((wrapper) => wrapper.nodeName === 'FONT')) return;
  const displacement = { parent: record.target, originals: [node, ...(scan.merged.get(node) ?? [])], wrappers };
  for (const wrapper of wrappers) scan.claimed.add(wrapper);
  for (const original of displacement.originals) displaced.set(original, displacement);
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
    const scan = scanRecords(records);
    for (const record of records) {
      if (record.type === 'characterData') {
        rememberPageValue(pageValues, record);
        continue;
      }
      for (const node of record.removedNodes) trackRemovedText(scan, displaced, record, node);
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
