export function computeDashboardSummary({ tools, entryTools, studios, categories }) {
  const totalTools = tools.filter((tool) => tool.id !== 'home').length;
  const entryRouteCount = entryTools.filter((tool) => tool.id !== 'home').length;
  const compatibilityRouteCount = Math.max(0, totalTools - entryRouteCount);
  const categoryBreakdown = categories
    .filter((category) => category.tools?.length)
    .map((category) => ({
      id: category.id,
      title: category.title,
      count: category.tools.length
    }));

  return {
    totalTools,
    entryRouteCount,
    compatibilityRouteCount,
    studioCount: studios.length,
    categoryBreakdown
  };
}
