const MODE_KEY = 'dialog-anatomy-mode';

type Mode = 'content' | 'fields';

const wrapFields = (figure: HTMLElement) => {
  for (const el of figure.querySelectorAll<HTMLElement>('[data-f]')) {
    const content = document.createElement('span');
    content.className = 'a-c';
    content.append(...el.childNodes);

    const field = document.createElement('code');
    field.className = `a-f a-s-${el.dataset.s ?? 'dp'}`;
    field.textContent = el.dataset.f ?? '';

    el.append(content, field);
  }
};

const linkPins = (figure: HTMLElement) => {
  const highlight = (id: string, on: boolean) => {
    for (const node of figure.querySelectorAll(`[data-pin="${id}"], [data-zone="${id}"]`)) {
      node.classList.toggle('a-hl', on);
    }
  };

  for (const el of figure.querySelectorAll<HTMLElement>('[data-pin]')) {
    const id = el.dataset.pin ?? '';
    el.addEventListener('mouseenter', () => highlight(id, true));
    el.addEventListener('mouseleave', () => highlight(id, false));
    el.addEventListener('focusin', () => highlight(id, true));
    el.addEventListener('focusout', () => highlight(id, false));
  }
};

const setMode = (mode: Mode) => {
  for (const figure of document.querySelectorAll('[data-anatomy]')) {
    figure.classList.toggle('a-fields', mode === 'fields');
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-anatomy-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.anatomyMode === mode));
  }
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
};

for (const figure of document.querySelectorAll<HTMLElement>('[data-anatomy]')) {
  wrapFields(figure);
  linkPins(figure);
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-anatomy-mode]')) {
  button.addEventListener('click', () => setMode(button.dataset.anatomyMode === 'fields' ? 'fields' : 'content'));
}

try {
  if (localStorage.getItem(MODE_KEY) === 'fields') setMode('fields');
} catch {}
