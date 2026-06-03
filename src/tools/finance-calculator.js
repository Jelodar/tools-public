import { mount as mountFinancialCalcAlias, unmount as unmountFinancialCalcAlias } from './financial-calc.js';

export async function mount(container) {
  return mountFinancialCalcAlias(container);
}

export function unmount() {
  return unmountFinancialCalcAlias();
}
