function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderToggleSwitch({
  id,
  label,
  checked = false,
  className = '',
  inputClassName = '',
  inputAttributes = '',
  rootAttributes = ''
} = {}) {
  const safeId = escapeAttribute(id);
  const safeClass = String(className || '').trim();
  const safeInputClass = String(inputClassName || '').trim();
  const inputClass = `ui-toggle-input${safeInputClass ? ` ${escapeAttribute(safeInputClass)}` : ''}`;
  return `
    <label class="ui-toggle${safeClass ? ` ${escapeAttribute(safeClass)}` : ''}" ${rootAttributes}>
      <input id="${safeId}" class="${inputClass}" type="checkbox" ${checked ? 'checked' : ''} ${inputAttributes}>
      <span class="ui-toggle-track"><span class="ui-toggle-knob"></span></span>
      <span class="ui-toggle-label">${escapeText(label)}</span>
    </label>
  `;
}
