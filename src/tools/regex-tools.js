import { mount as mountRegexSuiteAlias, unmount as unmountRegexSuiteAlias } from './regex-suite.js';

export async function mount(container) {
  return mountRegexSuiteAlias(container);
}

export function unmount() {
  return unmountRegexSuiteAlias();
}
