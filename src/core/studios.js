export const STUDIOS = [
  {
    id: 'json-studio',
    title: 'JSON Studio',
    entryToolId: 'json-studio',
    toolIds: ['json-studio', 'json-suite', 'json-quick-format', 'json-formatter'],
    description: 'Formatting, validation, query work, patching, and large-document memory mode live in one JSON surface.'
  },
  {
    id: 'time-studio',
    title: 'Time Studio',
    entryToolId: 'time-studio',
    toolIds: ['time-studio', 'time-tools', 'epoch-and-date', 'time-converter', 'timezone-converter', 'calendar-converter', 'calendar-tool'],
    description: 'Timing, epoch conversion, timezone planning, and calendar views now share one time workspace.'
  },
  {
    id: 'code-studio',
    title: 'Code Studio',
    entryToolId: 'code-studio',
    toolIds: ['code-studio', 'code-editor', 'web-formatter', 'web-formatters', 'sql-format', 'sql-formatter', 'js-minify', 'minifier', 'js-obfuscation', 'js-obfuscator', 'radix-converter', 'base-calc'],
    description: 'Advanced code editing, multi-language formatting, JavaScript optimization, and AI synthesis live in one unified workspace.'
  },

  {
    id: 'design-studio',
    title: 'SVG Studio',
    entryToolId: 'svg-studio',
    toolIds: ['svg-studio', 'svg-editor', 'visual-generators', 'color-tools', 'css-generators'],
    description: 'SVG editing, palettes, contrast checks, and CSS shadows share one visual workspace while legacy routes remain available.'
  },
  {
    id: 'video-studio-suite',
    title: 'Video Studio',
    entryToolId: 'video-studio',
    toolIds: ['video-studio', 'media-transcoder'],
    description: 'Editing, subtitles, mixer composition, and FFmpeg render planning live in Video Studio while the legacy media-transcoder route remains available.'
  },
  {
    id: 'device-lab',
    title: 'Device Lab',
    entryToolId: 'client-inspector',
    toolIds: ['client-inspector', 'client-inspect', 'input-tester', 'display-tester'],
    description: 'Environment signals, input diagnostics, and display tests now share one device-focused workspace.'
  },
  {
    id: 'text-workbench',
    title: 'Text Workbench',
    entryToolId: 'data-encoders',
    toolIds: ['data-encoders', 'encoders', 'case-converter', 'url-parser'],
    description: 'Deterministic text transforms, casing, and URL inspection now share one focused workspace.'
  }
];

const studioByToolId = new Map();

for (const studio of STUDIOS) {
  for (const toolId of studio.toolIds) {
    studioByToolId.set(toolId, studio);
  }
}

export function getStudioByToolId(toolId) {
  return studioByToolId.get(toolId) || null;
}

export function getStudioEntryIds() {
  return STUDIOS.map((studio) => studio.entryToolId);
}
