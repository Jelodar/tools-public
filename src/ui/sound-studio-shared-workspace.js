import { createMediaLibraryModal } from './media-library-modal.js';
import { createMixerComponent } from './mixer-component.js';

function normalizeLanes(lanes = []) {
  return (Array.isArray(lanes) ? lanes : []).map((lane, index) => ({
    id: lane.id || `lane-${index}`,
    name: lane.name || `Lane ${index + 1}`,
    kind: lane.kind || 'audio',
    muted: Boolean(lane.muted),
    solo: Boolean(lane.soloed || lane.solo)
  }));
}

function normalizeTracks(tracks = [], lanes = []) {
  return (Array.isArray(tracks) ? tracks : []).map((track) => {
    const laneIndex = Math.max(0, Number(track.laneIndex) || 0);
    const lane = lanes[laneIndex] || lanes[0] || { id: 'lane-0' };
    return {
      id: track.id,
      laneId: lane.id,
      name: track.name || 'Clip',
      start: Number(track.offset) || 0,
      duration: Math.max(0.1, (Number(track.trimEnd) || 0) - (Number(track.trimStart) || 0)),
      kind: 'audio'
    };
  });
}

export function createSoundStudioSharedWorkspace(parent, {
  state = {},
  onAction = () => {}
} = {}) {
  const root = document.createElement('section');
  root.className = 'sound-studio-shared-workspace';
  parent.appendChild(root);

  const mixerHost = document.createElement('div');
  mixerHost.className = 'sound-studio-shared-mixer-host';
  root.appendChild(mixerHost);

  const lanes = normalizeLanes(state.lanes);
  const mixer = createMixerComponent(mixerHost, {
    lanes,
    clips: normalizeTracks(state.tracks, lanes),
    onAction(event) {
      onAction({ ...event, type: `mixer:${event.type}` });
    }
  });

  const library = createMediaLibraryModal(root, {
    assets: state.assets || [],
    selectedAssetId: state.assets?.[0]?.id || '',
    onAction(event) {
      onAction({ ...event, type: `library:${event.type}` });
    }
  });

  return {
    root,
    mixer,
    library,
    openLibrary() {
      library.open();
    },
    update(nextState = {}) {
      const nextLanes = normalizeLanes(nextState.lanes || state.lanes);
      mixer.update({
        lanes: nextLanes,
        clips: normalizeTracks(nextState.tracks || state.tracks, nextLanes)
      });
      library.update({
        assets: nextState.assets || state.assets,
        selectedAssetId: nextState.assets?.[0]?.id || ''
      });
    },
    destroy() {
      mixer.destroy();
      library.destroy();
      root.remove();
    }
  };
}
