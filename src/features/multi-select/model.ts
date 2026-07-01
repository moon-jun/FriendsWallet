export function toggleSelected(selectedIds: string[], id: string) {
  return selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id];
}

export function allSelected(sourceIds: string[], selectedIds: string[]) {
  return sourceIds.length > 0 && sourceIds.every((id) => selectedIds.includes(id));
}
