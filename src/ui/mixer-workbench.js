import {
  addMixerTrack,
  appendMixerLane,
  createMixerState,
  duplicateMixerTrack,
  moveMixerTrack,
  moveMixerTrackToNewLane,
  removeMixerLane,
  removeMixerTrack,
  selectMixerLane,
  selectMixerTrack,
  setMixerLaneVolume,
  setMixerTrackFadeStyle,
  setMixerTrackVolume,
  toggleMixerLaneMute,
  toggleMixerLaneSolo,
  toggleMixerTrackMute,
  toggleMixerTrackSolo,
  trimMixerTrackEnd,
  trimMixerTrackStart
} from '../core/mixer-session.js';
import { createMixerComponent } from './mixer-components.js';

function normalizeState(options = {}) {
  return createMixerState({
    lanes: options.lanes,
    assets: options.assets,
    tracks: options.tracks,
    laneCount: options.laneCount,
    selectedLaneIndex: options.selectedLaneIndex,
    selectedTrackId: options.selectedTrackId
  });
}

export function createMixerWorkbench(options = {}) {
  const mount = options.mount;
  if (!mount) throw new Error('Mixer workbench mount is required.');

  let state = normalizeState(options);
  let component = null;
  const onStateChange = typeof options.onStateChange === 'function' ? options.onStateChange : null;
  const getAsset = (assetId) => state.assets.find((asset) => asset.id === assetId) || null;
  const commitState = (nextState) => {
    state = nextState;
    component?.updateState(state);
    onStateChange?.(state);
    return state;
  };

  component = createMixerComponent({
    mount,
    state,
    timelineScale: options.timelineScale || 100,
    onLaneAdd() {
      commitState(appendMixerLane(state));
    },
    onLaneSelect(laneIndex) {
      commitState(selectMixerLane(state, laneIndex));
    },
    onLaneMuteToggle(laneIndex) {
      commitState(toggleMixerLaneMute(state, laneIndex));
    },
    onLaneSoloToggle(laneIndex) {
      commitState(toggleMixerLaneSolo(state, laneIndex));
    },
    onLaneRemove(laneIndex) {
      commitState(removeMixerLane(state, laneIndex));
    },
    onLaneVolumeChange(laneIndex, volume) {
      commitState(setMixerLaneVolume(state, laneIndex, volume));
    },
    onTrackSelect(trackId) {
      commitState(selectMixerTrack(state, trackId));
    },
    onTrackMove(trackId, offset, laneIndex) {
      commitState(moveMixerTrack(state, { trackId, offset, laneIndex }));
    },
    onTrackMoveToNewLane(trackId, offset) {
      commitState(moveMixerTrackToNewLane(state, { trackId, offset }));
    },
    onTrackTrimStart(trackId, trimStart) {
      commitState(trimMixerTrackStart(state, { trackId, trimStart }));
    },
    onTrackTrimEnd(trackId, trimEnd) {
      commitState(trimMixerTrackEnd(state, { trackId, trimEnd }));
    },
    onTrackDuplicate(trackId) {
      const sourceTrack = state.tracks.find((track) => track.id === trackId);
      commitState(duplicateMixerTrack(state, {
        trackId,
        asset: sourceTrack ? getAsset(sourceTrack.assetId) : null
      }));
    },
    onTrackRemove(trackId) {
      commitState(removeMixerTrack(state, trackId));
    },
    onTrackMuteToggle(trackId) {
      commitState(toggleMixerTrackMute(state, trackId));
    },
    onTrackSoloToggle(trackId) {
      commitState(toggleMixerTrackSolo(state, trackId));
    },
    onTrackVolumeChange(trackId, volume) {
      commitState(setMixerTrackVolume(state, trackId, volume));
    },
    onTrackFadeStyleChange(trackId, fadeStyle) {
      commitState(setMixerTrackFadeStyle(state, trackId, fadeStyle));
    }
  });

  return {
    addAssetToLane(assetId, laneIndex = state.selectedLaneIndex, trackOptions = {}) {
      const asset = getAsset(assetId);
      if (!asset) throw new Error(`Unknown mixer asset: ${assetId}`);
      return commitState(addMixerTrack(state, {
        asset,
        laneIndex,
        offset: trackOptions.offset,
        id: trackOptions.id,
        fadeIn: trackOptions.fadeIn,
        fadeOut: trackOptions.fadeOut,
        fadeStyle: trackOptions.fadeStyle
      }));
    },
    destroy() {
      component?.destroy?.();
      component = null;
    },
    getState() {
      return state;
    },
    setState(nextState) {
      return commitState(normalizeState(nextState));
    },
    updateScale(scale) {
      component?.updateScale?.(scale);
    }
  };
}
