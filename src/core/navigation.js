import { CATEGORIES, TOOLS } from './config.js';
import { STUDIOS, getStudioByToolId } from './studios.js';

const toolById = new Map(TOOLS.map((tool) => [tool.id, tool]));
const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));
const studioByEntryToolId = new Map(STUDIOS.map((studio) => [studio.entryToolId, studio]));
const aliasTargetByToolId = new Map(TOOLS.filter((tool) => tool.aliasFor).map((tool) => [tool.id, tool.aliasFor]));

function collectToolSearchTerms(tool) {
  return [
    tool.title,
    tool.description,
    ...(tool.keywords || [])
  ].filter(Boolean);
}

function collectCategorySearchTerms(tool) {
  const category = categoryById.get(tool?.category);
  if (!category) return [];
  return [
    category.id,
    category.title
  ].filter(Boolean);
}

export function resolveNavigationTool(toolId) {
  const aliasTargetId = aliasTargetByToolId.get(toolId);
  if (aliasTargetId && aliasTargetId !== toolId) {
    const resolved = resolveNavigationTool(aliasTargetId);
    if (resolved) return resolved;
  }
  const tool = toolById.get(toolId);
  if (!tool) return null;
  const studio = getStudioByToolId(tool.id);
  if (!studio) return tool;
  return toolById.get(studio.entryToolId) || tool;
}

export function getNavigationTools() {
  return TOOLS.filter((tool) => {
    if (tool.hidden) return false;
    if (tool.id === 'home') return true;
    const studio = getStudioByToolId(tool.id);
    return !studio || studio.entryToolId === tool.id;
  });
}

export function getNavigationCategories() {
  const navigationToolIds = new Set(getNavigationTools().map((tool) => tool.id));
  return CATEGORIES.map((category) => ({
    ...category,
    tools: TOOLS.filter((tool) => !tool.hidden && tool.category === category.id && navigationToolIds.has(tool.id))
  }));
}

export function getNavigationSearchText(toolId) {
  const tool = toolById.get(toolId);
  if (!tool) return '';

  const terms = new Set([
    ...collectToolSearchTerms(tool),
    ...collectCategorySearchTerms(tool)
  ]);
  const studio = studioByEntryToolId.get(tool.id);

  if (studio) {
    terms.add(studio.title);
    terms.add(studio.description);
    for (const memberToolId of studio.toolIds) {
      const memberTool = toolById.get(memberToolId);
      if (!memberTool) continue;
      for (const value of [...collectToolSearchTerms(memberTool), ...collectCategorySearchTerms(memberTool)]) {
        terms.add(value);
      }
    }
  }

  return Array.from(terms).join(' ').toLowerCase();
}

function normalizeNavigationTools(toolIds = []) {
  const seen = new Set();
  return toolIds
    .map((toolId) => resolveNavigationTool(toolId))
    .filter((tool) => {
      if (!tool || seen.has(tool.id)) return false;
      seen.add(tool.id);
      return true;
    });
}

export function getNavigationCollections(navigation = {}) {
  return {
    favorites: normalizeNavigationTools(navigation.favoriteTools),
    recent: normalizeNavigationTools(navigation.recentTools)
  };
}

export function getToolBreadcrumbs(toolId) {
  const tool = toolById.get(toolId);
  if (!tool || tool.id === 'home') {
    return [{ label: 'Dashboard', path: '/' }];
  }

  const breadcrumbs = [{ label: 'Dashboard', path: '/' }];
  const category = categoryById.get(tool.category);
  if (category) {
    breadcrumbs.push({ label: category.title, path: null });
  }

  const studio = getStudioByToolId(tool.id);
  if (studio && studio.entryToolId !== tool.id) {
    const entryTool = toolById.get(studio.entryToolId);
    if (entryTool) {
      breadcrumbs.push({ label: entryTool.title, path: entryTool.path });
    }
  }

  breadcrumbs.push({ label: tool.title, path: tool.path });
  return breadcrumbs;
}
