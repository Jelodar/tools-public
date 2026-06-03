import { createMixerLaneState, createMixerTrackPointer } from '../utils/audio-mixer.js';

function cloneTracks(tracks = []) {
  return tracks.map((track) => ({ ...track }));
}

function cloneAssets(assets = []) {
  return assets.map((asset) => ({ ...asset }));
}

function getValidTrackIds(tracks = []) {
  return new Set(tracks.map((track) => track.id).filter(Boolean));
}

function uniqueTrackIds(trackIds = [], validTrackIds = null) {
  const ids = [];
  for (const id of Array.isArray(trackIds) ? trackIds : []) {
    if (!id || ids.includes(id)) continue;
    if (validTrackIds && !validTrackIds.has(id)) continue;
    ids.push(id);
  }
  return ids;
}

function normalizeSelectedTrackIds(tracks = [], selectedTrackId = null, selectedTrackIds = []) {
  const validTrackIds = getValidTrackIds(tracks);
  const ids = uniqueTrackIds(selectedTrackIds, validTrackIds);
  if (!ids.length && selectedTrackId && validTrackIds.has(selectedTrackId)) ids.push(selectedTrackId);
  return ids;
}

function normalizeStateSelection(state, tracks = state.tracks, selectedTrackIds = state.selectedTrackIds, selectedTrackId = state.selectedTrackId) {
  const ids = normalizeSelectedTrackIds(tracks, selectedTrackId, selectedTrackIds);
  const primary = ids.includes(selectedTrackId) ? selectedTrackId : ids.at(-1) ?? null;
  return {
    ...state,
    tracks,
    selectedTrackIds: ids,
    selectedTrackId: primary
  };
}

function normalizeMixerVolume(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(2, numeric));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTime(value) {
  return Math.round((Number(value) || 0) * 10000) / 10000;
}

function getTrackDuration(track = {}) {
  return Math.max(0.1, (Number(track.trimEnd) || 0) - (Number(track.trimStart) || 0));
}

function isDurationEditableTrack(track = {}) {
  return String(track.kind || track.mixerMeta?.kind || '').toLowerCase() === 'color';
}

function applyDurationEditableTrackBounds(track = {}, trimEnd) {
  const trimStart = Math.max(0, Number(track.trimStart) || 0);
  const duration = roundTime(Math.max(0.1, trimEnd - trimStart));
  return {
    duration,
    buffer: {
      ...(track.buffer || {}),
      duration: roundTime(Math.max(trimEnd, duration))
    },
    mixerMeta: {
      ...(track.mixerMeta || {}),
      duration
    }
  };
}

function sortTracksByLaneStart(left, right) {
  return (Number(left.laneIndex) || 0) - (Number(right.laneIndex) || 0)
    || (Number(left.offset) || 0) - (Number(right.offset) || 0)
    || String(left.id).localeCompare(String(right.id));
}

function sortTracksByTimeline(left, right) {
  return (Number(left.offset) || 0) - (Number(right.offset) || 0)
    || (Number(left.laneIndex) || 0) - (Number(right.laneIndex) || 0)
    || String(left.id).localeCompare(String(right.id));
}

function getCopyBaseName(value, fallback = 'Lane') {
  return String(value || fallback).replace(/\s+\bCopy(?:\s+\d+)?$/u, '');
}

function getCopyName(value, existingValues = [], fallback = 'Lane') {
  const base = getCopyBaseName(value, fallback);
  let candidate = `${base} Copy`;
  let counter = 2;
  while (existingValues.includes(candidate)) {
    candidate = `${base} Copy ${counter}`;
    counter += 1;
  }
  return candidate;
}

const VISUAL_MIXER_KINDS = new Set(['video', 'image', 'color', 'text', 'overlay']);
const SUBTITLE_MIXER_KINDS = new Set(['subtitle', 'captions']);

function normalizeMixerKind(track = {}, lane = {}, asset = {}) {
  const value = track.kind || track.mixerMeta?.kind || asset.kind || asset.mixerMeta?.kind || lane.kind || 'audio';
  return String(value || 'audio').toLowerCase();
}

function getMixerRole(kind) {
  if (SUBTITLE_MIXER_KINDS.has(kind)) return 'subtitle';
  return VISUAL_MIXER_KINDS.has(kind) ? 'visual' : 'audio';
}

function getTrackClipTiming(track = {}) {
  const trimStart = Math.max(0, Number(track.trimStart) || 0);
  const trimEnd = Math.max(trimStart, Number(track.trimEnd) || trimStart);
  const duration = roundTime(Math.max(0, trimEnd - trimStart));
  const start = roundTime(Math.max(0, Number(track.offset) || 0));
  const end = roundTime(start + duration);
  return {
    start,
    end,
    duration,
    trimStart: roundTime(trimStart),
    trimEnd: roundTime(trimEnd)
  };
}

function isTrackSuppressed(track = {}) {
  return track.hidden || track.disabled || track.visible === false;
}

function getSoloEligibility(track, lane, hasSoloTracks, hasSoloLanes) {
  if (hasSoloTracks) return !!track.soloed;
  if (hasSoloLanes) return !!lane.soloed;
  return true;
}

function defaultSnapshotClipMapper() {
  return {};
}

export function createMixerCompositionSnapshot(state = {}, options = {}) {
  const normalized = createMixerState({
    laneCount: state.lanes?.length || state.laneCount || 1,
    lanes: state.lanes,
    tracks: state.tracks,
    assets: state.assets,
    selectedLaneIndex: state.selectedLaneIndex,
    selectedTrackId: state.selectedTrackId,
    selectedTrackIds: state.selectedTrackIds
  });
  const selectedTrackIds = normalizeSelectedTrackIds(normalized.tracks, normalized.selectedTrackId, normalized.selectedTrackIds);
  const selectedSet = new Set(selectedTrackIds);
  const assetById = new Map(normalized.assets.map((asset) => [asset.id, asset]));
  const hasSoloTracks = normalized.tracks.some((track) => track.soloed);
  const hasSoloLanes = !hasSoloTracks && normalized.lanes.some((lane) => lane.soloed);
  const mapClip = typeof options.mapClip === 'function' ? options.mapClip : defaultSnapshotClipMapper;
  const lanes = normalized.lanes.map((lane, index) => ({
    index,
    id: lane.id || `lane-${index}`,
    name: lane.name || `Lane ${index + 1}`,
    kind: String(lane.kind || 'audio').toLowerCase(),
    muted: !!lane.muted,
    soloed: !!lane.soloed,
    visible: lane.visible !== false,
    volume: normalizeMixerVolume(lane.volume),
    opacity: lane.opacity === undefined ? 1 : clamp(Number(lane.opacity) || 0, 0, 1),
    clipIds: []
  }));
  const clips = normalized.tracks.map((track) => {
    const laneIndex = clamp(Number(track.laneIndex) || 0, 0, Math.max(0, lanes.length - 1));
    const lane = lanes[laneIndex] || lanes[0];
    const asset = assetById.get(track.assetId) || {};
    const kind = normalizeMixerKind(track, lane, asset);
    const role = getMixerRole(kind);
    const timing = getTrackClipTiming(track);
    const selected = selectedSet.has(track.id);
    const soloEligible = getSoloEligibility(track, lane, hasSoloTracks, hasSoloLanes);
    const suppressed = isTrackSuppressed(track);
    const laneVisible = lane.visible;
    const laneAudible = !lane.muted;
    const trackAudible = !track.muted;
    const hasEmbeddedAudio = role === 'visual' && (kind === 'video' || kind === 'image') && track.hasAudio !== false;
    const visualActive = role === 'visual' && soloEligible && !suppressed && laneVisible;
    const audioActive = (role === 'audio' || hasEmbeddedAudio) && soloEligible && !suppressed && laneAudible && trackAudible;
    const subtitleActive = role === 'subtitle' && soloEligible && !suppressed;
    const baseClip = {
      id: track.id,
      assetId: track.assetId,
      laneIndex,
      laneId: lane.id,
      laneName: lane.name,
      name: track.name || asset.name || 'Clip',
      kind,
      role,
      selected,
      muted: !!track.muted,
      soloed: !!track.soloed,
      visible: track.visible !== false,
      volume: normalizeMixerVolume(track.volume),
      laneVolume: lane.volume,
      opacity: track.opacity === undefined ? lane.opacity : clamp((Number(track.opacity) || 0) * lane.opacity, 0, 1),
      audioActive,
      visualActive,
      subtitleActive,
      renderable: visualActive || audioActive || subtitleActive,
      track,
      lane,
      asset,
      ...timing
    };
    return {
      ...baseClip,
      ...mapClip({ track, lane, asset, baseClip })
    };
  });
  clips.forEach((clip) => {
    lanes[clip.laneIndex]?.clipIds.push(clip.id);
  });
  const visualClips = clips
    .filter((clip) => clip.role === 'visual')
    .sort((left, right) => right.laneIndex - left.laneIndex || left.start - right.start || String(left.id).localeCompare(String(right.id)));
  const audioClips = clips
    .filter((clip) => clip.role === 'audio' || clip.audioActive)
    .sort((left, right) => left.start - right.start || left.laneIndex - right.laneIndex || String(left.id).localeCompare(String(right.id)));
  return {
    lanes,
    clips,
    visualClips,
    audioClips,
    selectedClips: clips.filter((clip) => clip.selected),
    duration: roundTime(Math.max(0, ...clips.map((clip) => clip.end))),
    selection: {
      trackId: selectedTrackIds.includes(normalized.selectedTrackId) ? normalized.selectedTrackId : selectedTrackIds.at(-1) ?? null,
      trackIds: selectedTrackIds,
      laneIndex: normalized.selectedLaneIndex
    },
    solo: {
      tracks: hasSoloTracks,
      lanes: hasSoloLanes
    }
  };
}

export function getMixerActiveClipsAtTime(snapshotOrState = {}, time = 0, options = {}) {
  const snapshot = Array.isArray(snapshotOrState.clips)
    ? snapshotOrState
    : createMixerCompositionSnapshot(snapshotOrState);
  const roles = Array.isArray(options.roles) && options.roles.length ? new Set(options.roles) : null;
  const currentTime = roundTime(Math.max(0, Number(time) || 0));
  const sourceClips = options.order === 'visual'
    ? snapshot.visualClips
    : options.order === 'audio'
      ? snapshot.audioClips
      : snapshot.clips;
  return sourceClips.filter((clip) => {
    if (roles && !roles.has(clip.role)) return false;
    if (!options.includeInactive && !clip.renderable) return false;
    return currentTime >= clip.start && currentTime <= clip.end;
  });
}

function updateLane(state, laneIndex, updater) {
  if (!state.lanes[laneIndex]) return state;
  const lanes = state.lanes.map((lane, index) => (
    index === laneIndex ? updater({ ...lane }, index) : { ...lane }
  ));
  return {
    ...state,
    lanes
  };
}

function updateTrack(state, trackId, updater) {
  const hasTrack = state.tracks.some((track) => track.id === trackId);
  if (!hasTrack) return state;
  const tracks = state.tracks.map((track) => (
    track.id === trackId ? updater({ ...track }) : { ...track }
  ));
  return {
    ...state,
    tracks
  };
}

export function createMixerState(options = {}) {
  const laneCount = Math.max(1, Number(options.laneCount) || options.lanes?.length || 1);
  const tracks = cloneTracks(options.tracks || []);
  const selectedTrackIds = normalizeSelectedTrackIds(tracks, options.selectedTrackId, options.selectedTrackIds);
  return {
    lanes: Array.from({ length: laneCount }, (_, index) => createMixerLaneState(index + 1, options.lanes?.[index])),
    assets: cloneAssets(options.assets || []),
    tracks,
    selectedLaneIndex: Math.max(0, Math.min(laneCount - 1, Number(options.selectedLaneIndex) || 0)),
    selectedTrackId: selectedTrackIds.includes(options.selectedTrackId) ? options.selectedTrackId : selectedTrackIds.at(-1) ?? null,
    selectedTrackIds
  };
}

export function appendMixerLane(state, overrides = {}) {
  const lanes = state.lanes.concat(createMixerLaneState(state.lanes.length + 1, overrides));
  return {
    ...state,
    lanes
  };
}

export function duplicateMixerLane(state, options = {}) {
  const laneIndex = clamp(Number(options.laneIndex), 0, Math.max(0, state.lanes.length - 1));
  const sourceLane = state.lanes[laneIndex];
  if (!sourceLane) return state;
  const nextLaneIndex = laneIndex + 1;
  const existingNames = state.lanes.map((lane) => lane.name);
  const duplicatedLane = createMixerLaneState(nextLaneIndex + 1, {
    ...sourceLane,
    name: getCopyName(sourceLane.name, existingNames),
    soloed: false
  });
  const lanes = [
    ...state.lanes.slice(0, nextLaneIndex),
    duplicatedLane,
    ...state.lanes.slice(nextLaneIndex).map((lane) => ({ ...lane }))
  ];
  const idFactory = typeof options.idFactory === 'function' ? options.idFactory : () => `${Date.now()}-${Math.random()}`;
  const duplicatedTracks = state.tracks
    .filter((track) => track.laneIndex === laneIndex)
    .map((track) => createMixerTrackPointer({
      asset: {
        id: track.assetId,
        name: track.name,
        buffer: track.buffer,
        waveform: track.waveform
      },
      sourceTrack: track,
      laneIndex: nextLaneIndex,
      offset: track.offset,
      id: idFactory(track)
    }));
  const tracks = state.tracks
    .map((track) => (
      track.laneIndex >= nextLaneIndex
        ? { ...track, laneIndex: track.laneIndex + 1 }
        : { ...track }
    ))
    .concat(duplicatedTracks);
  return {
    ...state,
    lanes,
    tracks,
    selectedLaneIndex: nextLaneIndex,
    selectedTrackId: duplicatedTracks.at(-1)?.id ?? state.selectedTrackId,
    selectedTrackIds: duplicatedTracks.length ? duplicatedTracks.map((track) => track.id) : normalizeSelectedTrackIds(tracks, state.selectedTrackId, state.selectedTrackIds)
  };
}

export function selectMixerLane(state, laneIndex) {
  return {
    ...state,
    selectedLaneIndex: Math.max(0, Math.min(state.lanes.length - 1, Number(laneIndex) || 0))
  };
}

export function renameMixerLane(state, laneIndex, value) {
  return updateLane(state, laneIndex, (lane) => ({
    ...lane,
    name: String(value || '').trim() || createMixerLaneState(laneIndex + 1).name
  }));
}

export function setMixerLaneVolume(state, laneIndex, volume) {
  return updateLane(state, laneIndex, (lane) => ({
    ...lane,
    volume: normalizeMixerVolume(volume, normalizeMixerVolume(lane.volume))
  }));
}

export function toggleMixerLaneMute(state, laneIndex) {
  return updateLane(state, laneIndex, (lane) => ({
    ...lane,
    muted: !lane.muted
  }));
}

export function toggleMixerLaneSolo(state, laneIndex) {
  if (!state.lanes[laneIndex]) return state;
  const nextSoloed = !state.lanes[laneIndex].soloed;
  const lanes = state.lanes.map((lane, index) => ({
    ...lane,
    soloed: index === laneIndex ? nextSoloed : false
  }));
  return {
    ...state,
    lanes
  };
}

export function removeMixerLane(state, laneIndex) {
  if (state.lanes.length <= 1) return state;
  const nextLanes = state.lanes.filter((_, index) => index !== laneIndex);
  const nextTracks = state.tracks
    .filter((track) => track.laneIndex !== laneIndex)
    .map((track) => (
      track.laneIndex > laneIndex
        ? { ...track, laneIndex: track.laneIndex - 1 }
        : { ...track }
    ));
  return normalizeStateSelection({
    ...state,
    lanes: nextLanes,
    tracks: nextTracks,
    selectedLaneIndex: Math.max(0, Math.min(nextLanes.length - 1, state.selectedLaneIndex))
  }, nextTracks);
}

export function clearMixerLaneTracks(state, laneIndex) {
  const nextTracks = state.tracks.filter((track) => track.laneIndex !== laneIndex);
  return normalizeStateSelection({
    ...state,
    tracks: nextTracks
  }, nextTracks);
}

export function addMixerTrack(state, options = {}) {
  let offset = options.offset;
  if (typeof offset !== 'number' || offset < 0) {
    const laneIndex = Math.max(0, Number(options.laneIndex) || 0);
    const laneTracks = state.tracks.filter((t) => t.laneIndex === laneIndex);
    offset = laneTracks.reduce((max, t) => (
      Math.max(max, (Number(t.offset) || 0) + ((Number(t.trimEnd) || 0) - (Number(t.trimStart) || 0)))
    ), 0);
  }

  const track = createMixerTrackPointer({
    asset: options.asset,
    laneIndex: options.laneIndex,
    offset: roundTime(offset),
    id: options.id,
    trimStart: options.trimStart,
    trimEnd: options.trimEnd,
    fadeIn: options.fadeIn,
    fadeOut: options.fadeOut,
    fadeStyle: options.fadeStyle,
    volumeAutomation: options.volumeAutomation
  });
  return {
    ...state,
    tracks: state.tracks.concat(track),
    selectedTrackId: track.id,
    selectedTrackIds: [track.id]
  };
}

export function addMixerAsset(state, asset) {
  if (!asset) return state;
  return {
    ...state,
    assets: [{ ...asset }, ...state.assets]
  };
}

export function renameMixerAsset(state, assetId, name) {
  return {
    ...state,
    assets: state.assets.map((asset) => (
      asset.id === assetId
        ? { ...asset, name }
        : { ...asset }
    ))
  };
}

export function selectMixerTracks(state, trackIds = [], primaryTrackId = null) {
  const selectedTrackIds = normalizeSelectedTrackIds(state.tracks, primaryTrackId, trackIds);
  return {
    ...state,
    selectedTrackIds,
    selectedTrackId: selectedTrackIds.includes(primaryTrackId) ? primaryTrackId : selectedTrackIds.at(-1) ?? null
  };
}

export function selectMixerTrack(state, trackId, options = {}) {
  const hasTrack = state.tracks.some((track) => track.id === trackId);
  if (!hasTrack) return state;
  const currentIds = normalizeSelectedTrackIds(state.tracks, state.selectedTrackId, state.selectedTrackIds);
  if (options.range) {
    const ordered = state.tracks.slice().sort(sortTracksByLaneStart);
    const selectedSet = new Set(currentIds);
    const anchor = ordered.find((track) => selectedSet.has(track.id)) || ordered.find((track) => track.id === state.selectedTrackId);
    const anchorIndex = ordered.findIndex((track) => track.id === anchor?.id);
    const targetIndex = ordered.findIndex((track) => track.id === trackId);
    if (anchorIndex >= 0 && targetIndex >= 0) {
      const start = Math.min(anchorIndex, targetIndex);
      const end = Math.max(anchorIndex, targetIndex);
      return selectMixerTracks(state, ordered.slice(start, end + 1).map((track) => track.id), trackId);
    }
  }
  if (options.additive) {
    const selectedTrackIds = currentIds.includes(trackId)
      ? currentIds.filter((id) => id !== trackId)
      : currentIds.concat(trackId);
    return selectMixerTracks(state, selectedTrackIds, selectedTrackIds.includes(trackId) ? trackId : selectedTrackIds.at(-1) ?? null);
  }
  return {
    ...state,
    selectedTrackId: trackId,
    selectedTrackIds: [trackId]
  };
}

export function renameMixerAssetReferences(state, assetId, name) {
  const tracks = state.tracks.map((track) => (
    track.assetId === assetId
      ? { ...track, name }
      : { ...track }
  ));
  return {
    ...state,
    tracks
  };
}

export function setMixerTrackVolume(state, trackId, volume) {
  return updateTrack(state, trackId, (track) => ({
    ...track,
    volume: normalizeMixerVolume(volume, normalizeMixerVolume(track.volume))
  }));
}

export function setMixerTrackFadeStyle(state, trackId, fadeStyle) {
  return updateTrack(state, trackId, (track) => ({
    ...track,
    fadeStyle
  }));
}

export function trimMixerTrackStart(state, options = {}) {
  const sourceTrack = state.tracks.find((track) => track.id === options.trackId);
  if (!sourceTrack) return state;
  const minDuration = Math.max(0.01, Number(options.minDuration) || 0.1);
  const currentTrimStart = Math.max(0, Number(sourceTrack.trimStart) || 0);
  const currentTrimEnd = Math.max(currentTrimStart, Number(sourceTrack.trimEnd) || currentTrimStart);
  const nextTrimStart = clamp(Number(options.trimStart), 0, Math.max(0, currentTrimEnd - minDuration));
  const trimDelta = nextTrimStart - currentTrimStart;
  return updateTrack(state, options.trackId, (track) => ({
    ...track,
    trimStart: roundTime(nextTrimStart),
    offset: roundTime(Math.max(0, (Number(track.offset) || 0) + trimDelta))
  }));
}

export function trimMixerTrackEnd(state, options = {}) {
  const sourceTrack = state.tracks.find((track) => track.id === options.trackId);
  if (!sourceTrack) return state;
  const minDuration = Math.max(0.01, Number(options.minDuration) || 0.1);
  const currentTrimStart = Math.max(0, Number(sourceTrack.trimStart) || 0);
  const requestedTrimEnd = Number(options.trimEnd);
  const canEditDuration = isDurationEditableTrack(sourceTrack);
  const maxTrimEnd = Math.max(
    currentTrimStart + minDuration,
    Number(sourceTrack.buffer?.duration) || 0,
    Number(sourceTrack.trimEnd) || 0,
    canEditDuration && Number.isFinite(requestedTrimEnd) ? requestedTrimEnd : 0
  );
  const nextTrimEnd = clamp(requestedTrimEnd, currentTrimStart + minDuration, maxTrimEnd);
  return updateTrack(state, options.trackId, (track) => ({
    ...track,
    trimEnd: roundTime(nextTrimEnd),
    ...(canEditDuration ? applyDurationEditableTrackBounds(track, nextTrimEnd) : {})
  }));
}

export function moveMixerTrack(state, options = {}) {
  const sourceTrack = state.tracks.find((track) => track.id === options.trackId);
  if (!sourceTrack) return state;
  const laneIndex = clamp(
    Number.isFinite(Number(options.laneIndex)) ? Number(options.laneIndex) : sourceTrack.laneIndex,
    0,
    Math.max(0, state.lanes.length - 1)
  );
  const offset = Math.max(0, Number.isFinite(Number(options.offset)) ? Number(options.offset) : Number(sourceTrack.offset) || 0);
  return updateTrack(state, options.trackId, (track) => ({
    ...track,
    laneIndex,
    offset: roundTime(offset)
  }));
}

export function moveMixerTrackToNewLane(state, options = {}) {
  const sourceTrack = state.tracks.find((track) => track.id === options.trackId);
  if (!sourceTrack) return state;
  const nextState = appendMixerLane(state, options.laneOverrides);
  return moveMixerTrack(nextState, {
    trackId: options.trackId,
    laneIndex: nextState.lanes.length - 1,
    offset: Number.isFinite(Number(options.offset)) ? Number(options.offset) : sourceTrack.offset
  });
}

export function toggleMixerTrackMute(state, trackId) {
  return updateTrack(state, trackId, (track) => ({
    ...track,
    muted: !track.muted
  }));
}

export function toggleMixerTrackSolo(state, trackId) {
  const sourceTrack = state.tracks.find((track) => track.id === trackId);
  if (!sourceTrack) return state;
  const nextSoloed = !sourceTrack.soloed;
  const tracks = state.tracks.map((track) => ({
    ...track,
    soloed: track.id === trackId ? nextSoloed : false
  }));
  return {
    ...state,
    tracks
  };
}

export function duplicateMixerTrack(state, options = {}) {
  const sourceTrack = state.tracks.find((track) => track.id === options.trackId);
  if (!sourceTrack) return state;
  const asset = options.asset || {
    id: sourceTrack.assetId,
    name: sourceTrack.name,
    buffer: sourceTrack.buffer
  };
  const clipDur = sourceTrack.trimEnd - sourceTrack.trimStart;
  const offset = options.offset ?? (sourceTrack.offset + Math.max(0.25, Math.min(1.5, clipDur * 0.15)));
  const track = createMixerTrackPointer({
    asset,
    sourceTrack,
    laneIndex: options.laneIndex ?? sourceTrack.laneIndex,
    offset: roundTime(offset),
    id: options.id
  });
  return {
    ...state,
    tracks: state.tracks.concat(track),
    selectedTrackId: track.id,
    selectedTrackIds: [track.id]
  };
}

export function splitMixerTrack(state, options = {}) {
  const sourceTrack = state.tracks.find((track) => track.id === options.trackId);
  if (!sourceTrack) return state;
  const clipStart = Number(sourceTrack.offset) || 0;
  const trimStart = Number(sourceTrack.trimStart) || 0;
  const trimEnd = Math.max(trimStart, Number(sourceTrack.trimEnd) || trimStart);
  const clipEnd = clipStart + (trimEnd - trimStart);
  const splitTime = roundTime(options.time);
  const minSpan = Math.max(0.01, Number(options.minSpan) || 0.05);
  if (splitTime <= (clipStart + minSpan) || splitTime >= (clipEnd - minSpan)) return state;
  const splitTrim = roundTime(trimStart + (splitTime - clipStart));
  const idFactory = typeof options.idFactory === 'function' ? options.idFactory : () => `${Date.now()}-${Math.random()}`;
  const rightTrack = {
    ...sourceTrack,
    id: options.id || idFactory(sourceTrack),
    offset: splitTime,
    trimStart: splitTrim,
    trimEnd,
    muted: false,
    soloed: false
  };
  const tracks = state.tracks.flatMap((track) => {
    if (track.id !== options.trackId) return { ...track };
    return [
      {
        ...track,
        trimEnd: splitTrim
      },
      rightTrack
    ];
  });
  return {
    ...state,
    tracks,
    selectedTrackId: rightTrack.id,
    selectedTrackIds: [rightTrack.id]
  };
}

export function removeMixerTrack(state, trackId) {
  const tracks = state.tracks.filter((track) => track.id !== trackId);
  return normalizeStateSelection({
    ...state,
    tracks
  }, tracks);
}

export function removeMixerTracks(state, trackIds = []) {
  const removeIds = new Set(Array.isArray(trackIds) ? trackIds : []);
  if (!removeIds.size) return state;
  const tracks = state.tracks.filter((track) => !removeIds.has(track.id));
  return normalizeStateSelection({
    ...state,
    tracks
  }, tracks, [], null);
}

export function sequenceMixerTracks(state, trackIds = [], options = {}) {
  const selectedIds = new Set(Array.isArray(trackIds) ? trackIds : []);
  const selectedTracks = state.tracks.filter((track) => selectedIds.has(track.id)).sort(sortTracksByTimeline);
  if (selectedTracks.length < 2) return state;
  const firstTrack = selectedTracks[0];
  const laneIndex = Number(firstTrack.laneIndex) || 0;
  const baseOffset = Math.max(0, Number(firstTrack.offset) || 0);
  const requestedCrossfade = Math.max(0, Number(options.crossfadeDuration) || 0);
  const updates = new Map();
  let offset = baseOffset;
  selectedTracks.forEach((track, index) => {
    const duration = getTrackDuration(track);
    const previousTrack = selectedTracks[index - 1];
    const nextTrack = selectedTracks[index + 1];
    const fadeIn = previousTrack ? Math.min(requestedCrossfade, duration - 0.01, getTrackDuration(previousTrack) - 0.01) : 0;
    const fadeOut = nextTrack ? Math.min(requestedCrossfade, duration - 0.01, getTrackDuration(nextTrack) - 0.01) : 0;
    updates.set(track.id, {
      laneIndex,
      offset: roundTime(offset),
      fadeIn: roundTime(Math.max(0, fadeIn)),
      fadeOut: roundTime(Math.max(0, fadeOut))
    });
    offset += Math.max(0.01, duration - fadeOut);
  });
  const tracks = state.tracks.map((track) => (
    updates.has(track.id)
      ? { ...track, ...updates.get(track.id) }
      : { ...track }
  ));
  return normalizeStateSelection({
    ...state,
    tracks
  }, tracks, selectedTracks.map((track) => track.id), selectedTracks.at(-1)?.id ?? null);
}

export function removeMixerAsset(state, assetId) {
  const nextTracks = state.tracks.filter((track) => track.assetId !== assetId);
  return normalizeStateSelection({
    ...state,
    assets: state.assets.filter((asset) => asset.id !== assetId),
    tracks: nextTracks
  }, nextTracks);
}

export function setMixerTrackWaveform(state, trackId, waveform) {
  return updateTrack(state, trackId, (track) => ({
    ...track,
    waveform
  }));
}

export function setMixerAssetWaveform(state, assetId, waveform) {
  const nextAssets = state.assets.map((asset) => {
    if (asset.id !== assetId) return { ...asset };
    return {
      ...asset,
      waveform
    };
  });
  const nextTracks = state.tracks.map((track) => {
    if (track.assetId !== assetId) return { ...track };
    return {
      ...track,
      waveform
    };
  });
  return {
    ...state,
    assets: nextAssets,
    tracks: nextTracks
  };
}

export function replaceMixerAsset(state, options = {}) {
  const assetId = options.assetId;
  const nextAssets = state.assets.map((asset) => {
    if (asset.id !== assetId) return { ...asset };
    return {
      ...asset,
      name: options.name ?? asset.name,
      buffer: options.buffer ?? asset.buffer,
      originalBuffer: options.originalBuffer ?? asset.originalBuffer,
      isEdited: options.isEdited ?? asset.isEdited,
      fadeIn: options.fadeIn ?? asset.fadeIn,
      fadeOut: options.fadeOut ?? asset.fadeOut,
      waveform: options.waveform ?? asset.waveform ?? null
    };
  });
  const nextTracks = state.tracks.map((track) => {
    if (track.assetId !== assetId) return { ...track };
    return {
      ...track,
      name: options.name ?? track.name,
      buffer: options.buffer ?? track.buffer,
      trimStart: 0,
      trimEnd: Math.max(0, Number(options.buffer?.duration) || 0),
      fadeIn: options.fadeIn ?? track.fadeIn,
      fadeOut: options.fadeOut ?? track.fadeOut,
      waveform: options.waveform ?? track.waveform ?? null
    };
  });
  return {
    ...state,
    assets: nextAssets,
    tracks: nextTracks
  };
}

export function setMixerTrackAutomation(state, trackId, automation) {
  return updateTrack(state, trackId, (track) => ({
    ...track,
    volumeAutomation: Array.isArray(automation) ? automation.sort((a, b) => a.time - b.time) : []
  }));
}

export function addMixerTrackKeyframe(state, trackId, { time, value }) {
  return updateTrack(state, trackId, (track) => {
    const automation = [...(track.volumeAutomation || [])];
    automation.push({ time: roundTime(time), value: clamp(value, 0, 2) });
    return {
      ...track,
      volumeAutomation: automation.sort((a, b) => a.time - b.time)
    };
  });
}

export function removeMixerTrackKeyframe(state, trackId, index) {
  return updateTrack(state, trackId, (track) => {
    const automation = [...(track.volumeAutomation || [])];
    automation.splice(index, 1);
    return {
      ...track,
      volumeAutomation: automation
    };
  });
}
