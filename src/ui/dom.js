function isElementLike(value) {
  return value && typeof value === 'object' && typeof value.appendChild === 'function';
}

function isOptionsLike(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && !isElementLike(value);
}

function appendChild(parent, child) {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) {
    child.forEach((entry) => appendChild(parent, entry));
    return;
  }
  if (isElementLike(child)) {
    parent.appendChild(child);
    return;
  }
  if (typeof parent.ownerDocument?.createTextNode === 'function') {
    parent.appendChild(parent.ownerDocument.createTextNode(String(child)));
  } else {
    parent.textContent += String(child);
  }
}

function addClassNames(node, value) {
  String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .forEach((token) => node.classList.add(token));
}

function applyOptions(node, options = {}) {
  if (options.className) addClassNames(node, options.className);
  if (options.text !== undefined) node.textContent = String(options.text);
  if (options.html !== undefined) node.innerHTML = String(options.html);
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([name, value]) => {
      if (value === null || value === undefined || value === false) return;
      node.setAttribute(name, value === true ? '' : String(value));
    });
  }
  if (options.dataset) {
    Object.entries(options.dataset).forEach(([name, value]) => {
      if (value === null || value === undefined) return;
      node.dataset[name] = String(value);
      node.setAttribute(`data-${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`, String(value));
    });
  }
  if (options.style) {
    Object.entries(options.style).forEach(([name, value]) => {
      if (name.startsWith('--')) node.style.setProperty(name, value);
      else node.style[name] = value;
    });
  }
  if (options.props) {
    Object.entries(options.props).forEach(([name, value]) => {
      node[name] = value;
    });
  }
  if (options.on) {
    Object.entries(options.on).forEach(([name, handler]) => {
      node.addEventListener(name, handler);
    });
  }
  const special = new Set(['document', 'className', 'text', 'html', 'attrs', 'dataset', 'style', 'props', 'on', 'parent']);
  Object.entries(options).forEach(([name, value]) => {
    if (special.has(name)) return;
    node[name] = value;
  });
}

export function el(tagName, ...args) {
  const ownerDocument = args.find((arg) => isOptionsLike(arg) && arg.document)?.document || globalThis.document;
  const node = ownerDocument.createElement(tagName);
  const children = [];
  let parent = null;
  args.forEach((arg) => {
    if (arg === null || arg === undefined || arg === false) return;
    if (typeof arg === 'string') {
      addClassNames(node, arg);
      return;
    }
    if (typeof arg === 'function') {
      arg(node);
      return;
    }
    if (Array.isArray(arg) || isElementLike(arg) || typeof arg !== 'object') {
      children.push(arg);
      return;
    }
    applyOptions(node, arg);
    if (arg.parent) parent = arg.parent;
  });
  children.forEach((child) => appendChild(node, child));
  if (parent) parent.appendChild(node);
  return node;
}

export function div(...args) {
  return el('div', ...args);
}

export function span(...args) {
  return el('span', ...args);
}

export function button(...args) {
  return el('button', ...args);
}
