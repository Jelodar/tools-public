export const AUDIO_PRODUCT_SECTIONS = [
  {
    id: 'record-mix',
    toolId: 'sound-studio',
    route: '/sound-studio',
    label: 'Record & Mix',
    summary: 'Capture, trim, arrange, and render multitrack audio.'
  },
  {
    id: 'ambient',
    toolId: 'ambient-engine',
    route: '/ambient-engine',
    label: 'Ambient Engine',
    summary: 'Generate procedural focus, nature, and cinematic beds.'
  },
  {
    id: 'tone-test',
    toolId: 'audio-tools',
    route: '/audio-tools',
    label: 'Tone Test',
    summary: 'Generate calibrated tones for checks and tuning.'
  }
];

export const AUDIO_ROUTE_ALIASES = {
  'sound-studio': {
    sectionId: 'record-mix',
    canonicalToolId: 'sound-studio'
  },
  'audio-lab': {
    sectionId: 'ambient',
    canonicalToolId: 'ambient-engine'
  },
  'ambient-engine': {
    sectionId: 'ambient',
    canonicalToolId: 'ambient-engine'
  },
  'audio-tools': {
    sectionId: 'tone-test',
    canonicalToolId: 'audio-tools'
  }
};

export function getAudioProductSection(toolId) {
  const alias = AUDIO_ROUTE_ALIASES[toolId] || AUDIO_ROUTE_ALIASES['sound-studio'];
  const section = AUDIO_PRODUCT_SECTIONS.find((item) => item.id === alias.sectionId) || AUDIO_PRODUCT_SECTIONS[0];
  return {
    ...section,
    sectionId: section.id,
    canonicalToolId: alias.canonicalToolId
  };
}

export function getAudioProductLinks(currentToolId) {
  const current = getAudioProductSection(currentToolId);
  return AUDIO_PRODUCT_SECTIONS.map((section) => ({
    ...section,
    current: section.id === current.sectionId,
    id: section.toolId
  }));
}
