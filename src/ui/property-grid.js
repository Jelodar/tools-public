import { div, el, span } from './dom.js';

function normalizeValue(field, node) {
  if (field.type === 'checkbox' || field.type === 'toggle') return Boolean(node.checked);
  if (['number', 'range'].includes(field.type)) {
    const number = Number(node.value);
    return Number.isFinite(number) ? number : 0;
  }
  return node.value;
}

function normalizeOption(option) {
  if (option && typeof option === 'object') {
    const value = String(option.value ?? option.label ?? '');
    return { value, label: String(option.label ?? value) };
  }
  const value = String(option ?? '');
  return { value, label: value };
}

function appendAttrs(node, attrs = {}) {
  Object.entries(attrs || {}).forEach(([name, value]) => {
    if (value === null || value === undefined || value === false) return;
    node.setAttribute(name, value === true ? '' : String(value));
  });
}

function createToggleField(field = {}, document) {
  const key = String(field.key || '');
  const input = el('input', {
    document,
    className: 'ui-toggle-input',
    attrs: {
      id: field.id || undefined,
      type: 'checkbox',
      checked: field.value ? true : null,
      'data-property-key': key
    }
  });
  appendAttrs(input, field.attrs);
  return el('label', {
    document,
    className: `ui-toggle shared-property-toggle${field.className ? ` ${field.className}` : ''}`
  }, [
    input,
    span({ document, className: 'ui-toggle-track' }, [
      span({ document, className: 'ui-toggle-knob' })
    ]),
    span({ document, className: 'ui-toggle-label', text: field.label || key })
  ]);
}

function createField(field = {}, document) {
  const key = String(field.key || '');
  const label = String(field.label || key);
  if (field.type === 'toggle') return createToggleField(field, document);
  if (field.type === 'select') {
    const options = Array.isArray(field.options) ? field.options : [];
    const select = el('select', {
      document,
      dataset: { propertyKey: key }
    }, options.map((option) => {
      const normalized = normalizeOption(option);
      return el('option', {
        document,
        text: normalized.label,
        attrs: {
          value: normalized.value,
          selected: normalized.value === field.value ? true : null
        }
      });
    }));
    appendAttrs(select, field.attrs);
    return el('label', { document, className: `shared-property-field${field.className ? ` ${field.className}` : ''}` }, [
      span({ document, text: label }),
      select
    ]);
  }
  if (field.type === 'checkbox') {
    const input = el('input', {
      document,
      attrs: {
        type: 'checkbox',
        checked: field.value ? true : null,
        'data-property-key': key
      }
    });
    appendAttrs(input, field.attrs);
    return el('label', { document, className: `shared-property-field shared-property-field-checkbox${field.className ? ` ${field.className}` : ''}` }, [
      span({ document, text: label }),
      input
    ]);
  }
  const type = field.type === 'range' ? 'range' : field.type === 'color' ? 'color' : field.type === 'text' ? 'text' : 'number';
  const input = el('input', {
    document,
    attrs: {
      type,
      'data-property-key': key,
      value: field.value ?? '',
      min: field.min,
      max: field.max,
      step: field.step
    }
  });
  appendAttrs(input, field.attrs);
  return el('label', { document, className: `shared-property-field${field.className ? ` ${field.className}` : ''}` }, [
    span({ document, text: label }),
    input
  ]);
}

function createSection(section = {}, document) {
  const node = el('section', {
    document,
    className: `shared-property-section${section.className ? ` ${section.className}` : ''}`,
    dataset: section.dataset
  });
  const title = section.title || 'Properties';
  node.appendChild(section.titleClassName
    ? div({ document, className: section.titleClassName, text: title })
    : el('h3', { document, text: title }));
  (Array.isArray(section.fields) ? section.fields : []).forEach((field) => {
    node.appendChild(createField(field, document));
  });
  return node;
}

export function createPropertyGrid(parent, {
  sections = [],
  onChange = () => {},
  rootClassName = 'shared-property-grid',
  useParent = false
} = {}) {
  const document = parent.ownerDocument || globalThis.document;
  const root = useParent ? parent : document.createElement('div');
  if (rootClassName) root.classList.add(...String(rootClassName).split(/\s+/).filter(Boolean));
  if (!useParent) parent.appendChild(root);
  let currentSections = Array.isArray(sections) ? sections : [];

  const render = () => {
    root.innerHTML = '';
    currentSections.forEach((section) => {
      root.appendChild(createSection(section, document));
    });
  };

  const findField = (key) => {
    for (const section of currentSections) {
      const field = section.fields?.find((entry) => entry.key === key);
      if (field) return field;
    }
    return null;
  };

  const handleInput = (event) => {
    const node = event.target.closest('[data-property-key]');
    if (!node) return;
    const field = findField(node.dataset.propertyKey);
    if (!field) return;
    onChange({
      key: field.key,
      value: normalizeValue(field, node),
      field
    });
  };

  render();
  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleInput);

  return {
    root,
    update(nextSections = []) {
      currentSections = Array.isArray(nextSections) ? nextSections : [];
      render();
    },
    destroy() {
      root.removeEventListener('input', handleInput);
      root.removeEventListener('change', handleInput);
      if (useParent) root.innerHTML = '';
      else root.remove();
    }
  };
}
