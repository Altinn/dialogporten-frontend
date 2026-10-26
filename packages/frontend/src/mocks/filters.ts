import type { SearchDialogFieldsFragment } from 'bff-types-generated';

export const naiveSearchFilter = (dialog: Pick<SearchDialogFieldsFragment, 'content'>, search?: string) => {
  if (!search) {
    return true;
  }

  const searchLower = search.toLowerCase();
  return (
    dialog.content?.title?.value?.some((title) => title.value.toLowerCase().includes(searchLower)) ||
    dialog.content?.summary?.value?.some((summary) => summary.value.toLowerCase().includes(searchLower)) ||
    dialog.content?.senderName?.value?.some((senderName) => senderName.value.toLowerCase().includes(searchLower))
  );
};
