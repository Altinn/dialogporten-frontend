export const toTitleCase = (str: string | undefined | null) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => (word !== 'as' ? word.charAt(0).toUpperCase() + word.slice(1) : word.toUpperCase()))
    .join(' ');
};
