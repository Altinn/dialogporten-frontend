const MAX_FOCUS_FRAMES = 60;

const findField = (path: string): HTMLElement | undefined => {
  const fields = [...document.querySelectorAll<HTMLElement>('[data-path]')];
  const segments = path.split('.');

  for (let length = segments.length; length > 0; length--) {
    const prefix = segments.slice(0, length).join('.');
    const field = fields.find(({ dataset }) => dataset.path === prefix || dataset.path?.startsWith(`${prefix}.`));
    if (field) {
      return field;
    }
  }

  return undefined;
};

const openParents = (element: HTMLElement) => {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) {
      parent.open = true;
    }
  }
};

const focusWhenVisible = (field: HTMLElement, framesLeft: number) => {
  requestAnimationFrame(() => {
    field.focus({ preventScroll: true });
    if (document.activeElement === field) {
      field.scrollIntoView({ block: 'center' });
    } else if (framesLeft > 0) {
      focusWhenVisible(field, framesLeft - 1);
    }
  });
};

export const focusField = (path: string) => {
  const field = findField(path);
  if (field) {
    openParents(field);
    focusWhenVisible(field, MAX_FOCUS_FRAMES);
  }
};
