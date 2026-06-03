import { mount as mountIpSubnetAlias, unmount as unmountIpSubnetAlias } from './ip-subnet.js';

export async function mount(container) {
  return mountIpSubnetAlias(container);
}

export function unmount() {
  return unmountIpSubnetAlias();
}
