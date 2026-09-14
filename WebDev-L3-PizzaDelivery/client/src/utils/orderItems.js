export function describeOrderItem(item) {
  if (item.type === 'ready-made') {
    return `${item.name} × ${item.quantity}`;
  }
  const parts = [item.base?.name, item.sauce?.name, item.cheese?.name, ...(item.vegetables || []).map((v) => v.name)].filter(
    Boolean,
  );
  return `Custom Pizza (${parts.join(', ')}) × ${item.quantity}`;
}

export function summarizeOrderItems(items) {
  return (items || []).map(describeOrderItem).join('; ');
}
