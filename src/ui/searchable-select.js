function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function renderOptions(options, selected, query = '') {
  const needle = String(query || '').trim().toLowerCase();
  const filtered = options.filter((option) => !needle || option.toLowerCase().includes(needle));
  const visible = filtered.some((option) => option === selected) ? filtered : [selected, ...filtered].filter(Boolean);
  return visible.map((option) => `<option value="${escapeHtml(option)}"${option === selected ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('');
}

export function renderSearchableSelect({ id, label, options, selected, placeholder = 'Filter options' }) {
  return `
    <label class="studio-field searchable-select-field" data-searchable-select="${escapeHtml(id)}">
      <span>${escapeHtml(label)}</span>
      <input id="${escapeHtml(id)}-search" class="searchable-select-input" type="search" placeholder="${escapeHtml(placeholder)}">
      <select id="${escapeHtml(id)}" data-searchable-select-menu>
        ${renderOptions(options, selected)}
      </select>
    </label>
  `;
}

export function bindSearchableSelect(root, id, options) {
  const field = root?.querySelector?.(`[data-searchable-select="${id}"]`);
  const input = field?.querySelector?.(`#${id}-search`);
  const select = field?.querySelector?.(`#${id}`);
  if (!field || !input || !select) return () => {};

  const sync = () => {
    const selected = select.value;
    select.innerHTML = renderOptions(options, selected, input.value);
  };
  const clearOnEscape = (event) => {
    if (event.key !== 'Escape' || !input.value) return;
    input.value = '';
    sync();
  };

  input.addEventListener('input', sync);
  input.addEventListener('keydown', clearOnEscape);
  return () => {
    input.removeEventListener('input', sync);
    input.removeEventListener('keydown', clearOnEscape);
  };
}
