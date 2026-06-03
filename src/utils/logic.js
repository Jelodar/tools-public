/**
 * Shared Tool Logic
 * Extracted for 100% Test Coverage.
 */

// JWT Logic
export function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const header = JSON.parse(atob(parts[0]));
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  return { header, payload };
}

// Subnet Logic
export function calculateSubnet(ip, mask) {
  const ipInt = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  const maskInt = (0xffffffff << (32 - mask)) >>> 0;
  const netInt = (ipInt & maskInt) >>> 0;
  const broadInt = (netInt | ~maskInt) >>> 0;

  const toIP = (int) => [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff
  ].join('.');

  return {
    network: toIP(netInt),
    broadcast: toIP(broadInt),
    mask: toIP(maskInt)
  };
}

// Unit Logic
export function convertUnits(val, fromFactor, toFactor) {
  return (val * fromFactor) / toFactor;
}

export function convertTemp(val, from, to) {
  let c = val;
  if (from === 'F') c = (val - 32) * 5/9;
  if (from === 'K') c = val - 273.15;

  let res = c;
  if (to === 'F') res = (c * 9/5) + 32;
  if (to === 'K') res = c + 273.15;
  return res;
}

// DevOps Logic
export function calculateChmod(owner, group, other) {
  // owner/group/other are objects {r, w, x}
  const calc = (o) => (o.r ? 4 : 0) + (o.w ? 2 : 0) + (o.x ? 1 : 0);
  return `${calc(owner)}${calc(group)}${calc(other)}`;
}

export function calculateLoanPayment(principal, annualInterestRate, years) {
  const p = Number(principal) || 0;
  const monthlyRate = (Number(annualInterestRate) || 0) / 100 / 12;
  const payments = (Number(years) || 0) * 12;

  if (p <= 0 || payments <= 0) return 0;
  if (monthlyRate === 0) return p / payments;

  return p * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
}

export function calculateCompoundGrowth(principal, monthlyContribution, years, annualReturnRate) {
  const startingPrincipal = Number(principal) || 0;
  const contribution = Number(monthlyContribution) || 0;
  const months = (Number(years) || 0) * 12;
  const monthlyRate = (Number(annualReturnRate) || 0) / 100 / 12;

  if (months <= 0) return startingPrincipal;
  if (monthlyRate === 0) return startingPrincipal + (contribution * months);

  let total = startingPrincipal * Math.pow(1 + monthlyRate, months);
  for (let month = 1; month <= months; month += 1) {
    total += contribution * Math.pow(1 + monthlyRate, months - month);
  }
  return total;
}

export function calculateTaxBreakdown(netAmount, ratePercent) {
  const net = Number(netAmount) || 0;
  const rate = Number(ratePercent) || 0;
  const tax = net * (rate / 100);

  return {
    net,
    rate,
    tax,
    gross: net + tax
  };
}
