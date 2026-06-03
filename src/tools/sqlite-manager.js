import { mount as mountSqliteExplorerAlias, unmount as unmountSqliteExplorerAlias } from './sqlite-explorer.js';

export async function mount(container) {
  return mountSqliteExplorerAlias(container);
}

export function unmount() {
  return unmountSqliteExplorerAlias();
}
