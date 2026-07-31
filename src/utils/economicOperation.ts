export function requestEconomicReason(action: string): string | null {
  const value = window.prompt(
    `Escribe el motivo para ${action}. Debe tener al menos 10 caracteres.`,
  );

  if (value === null) return null;

  const reason = value.trim();
  if (reason.length < 10) {
    window.alert('El motivo debe tener al menos 10 caracteres.');
    return null;
  }

  if (reason.length > 500) {
    window.alert('El motivo no puede superar 500 caracteres.');
    return null;
  }

  return reason;
}

export function requestInventoryQuantityChange(): number | null {
  const value = window.prompt(
    'Ingresa el ajuste de stock. Usa un número positivo para aumentar o negativo para disminuir.',
  );

  if (value === null) return null;

  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity === 0) {
    window.alert('El ajuste debe ser un número diferente de cero.');
    return null;
  }

  return quantity;
}
