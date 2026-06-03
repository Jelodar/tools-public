export const UNIT_CATEGORIES = {
  length: {
    m: 1,
    mm: 0.001,
    cm: 0.01,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.34
  },
  weight: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.453592,
    oz: 0.0283495
  },
  storage: {
    B: 1,
    KB: 1000,
    MB: 1000000,
    GB: 1000000000,
    TB: 1000000000000,
    KiB: 1024,
    MiB: 1048576,
    GiB: 1073741824,
    TiB: 1099511627776
  },
  typography: {
    px: 1,
    pt: 1.33333,
    em: 16,
    rem: 16
  }
};

export function getUnitCategoryUnits(categoryId) {
  const units = UNIT_CATEGORIES[categoryId];
  if (!units) throw new Error(`Unknown unit category: ${categoryId}`);
  return units;
}
