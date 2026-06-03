function numberOr(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, value));
}

function cloneKeyframes(keyframes = {}) {
  return Object.fromEntries(Object.entries(keyframes || {}).map(([property, entries]) => [
    property,
    (Array.isArray(entries) ? entries : []).map((entry) => ({ ...entry }))
  ]));
}

function cloneOptionalObject(value) {
  return value && typeof value === 'object' ? { ...value } : null;
}

function cloneTrack(track, index) {
  const kind = ['video', 'audio', 'subtitle', 'overlay'].includes(track?.kind) ? track.kind : 'video';
  return {
    id: track?.id || `${kind}-track-${index + 1}`,
    kind,
    name: track?.name || (kind === 'audio' ? 'Audio' : kind === 'subtitle' ? 'Subtitles' : 'Video'),
    visible: track?.visible !== false,
    muted: Boolean(track?.muted),
    solo: Boolean(track?.solo),
    locked: Boolean(track?.locked),
    collapsed: Boolean(track?.collapsed),
    opacity: clamp(numberOr(track?.opacity, 1), 0, 1),
    volume: clamp(numberOr(track?.volume, 1), 0, 4),
    order: numberOr(track?.order, index)
  };
}

function cloneClip(clip, index) {
  const kind = ['video', 'audio', 'color', 'text', 'image', 'subtitle'].includes(clip?.kind) ? clip.kind : 'video';
  const duration = clamp(numberOr(clip?.duration, Math.max(0.1, numberOr(clip?.trimEnd, 5) - numberOr(clip?.trimStart, 0))), 0.1);
  const trimStart = clamp(numberOr(clip?.trimStart, 0), 0);
  const trimEnd = Math.max(trimStart + 0.1, numberOr(clip?.trimEnd, trimStart + duration));
  const fitMode = ['fit', 'fill', 'exact', 'contain', 'cover', 'copy'].includes(clip?.fitMode) ? clip.fitMode : 'fit';
  return {
    id: clip?.id || `${kind}-clip-${index + 1}`,
    trackId: clip?.trackId || '',
    kind,
    sourceId: clip?.sourceId || clip?.id || `${kind}-source-${index + 1}`,
    fileName: clip?.fileName || '',
    file: clip?.file || null,
    buffer: clip?.buffer || null,
    name: clip?.name || clip?.fileName || (kind === 'color' ? 'Color' : 'Clip'),
    start: clamp(numberOr(clip?.start, 0), 0),
    duration,
    trimStart,
    trimEnd,
    crop: cloneOptionalObject(clip?.crop),
    color: clip?.color || '#111111',
    text: clip?.text || '',
    x: numberOr(clip?.x, 0),
    y: numberOr(clip?.y, 0),
    width: numberOr(clip?.width, 1280),
    height: numberOr(clip?.height, 720),
    scale: typeof clip?.scale === 'object' && clip.scale ? { ...clip.scale } : numberOr(clip?.scale, 1),
    fitMode,
    rotate: numberOr(clip?.rotate, 0),
    opacity: clamp(numberOr(clip?.opacity, 1), 0, 1),
    volume: clamp(numberOr(clip?.volume, 1), 0, 4),
    brightness: clamp(numberOr(clip?.brightness, 0), -1, 1),
    contrast: clamp(numberOr(clip?.contrast, 1), 0, 3),
    saturation: clamp(numberOr(clip?.saturation, 1), 0, 3),
    gamma: clamp(numberOr(clip?.gamma, 1), 0.1, 10),
    sharpen: clamp(numberOr(clip?.sharpen, 0), 0, 2),
    denoise: clamp(numberOr(clip?.denoise, 0), 0, 12),
    blur: clamp(numberOr(clip?.blur, 0), 0, 64),
    speed: clamp(numberOr(clip?.speed, 1), 0.25, 4),
    fadeIn: clamp(numberOr(clip?.fadeIn, 0), 0),
    fadeOut: clamp(numberOr(clip?.fadeOut, 0), 0),
    crossfadeIn: clamp(numberOr(clip?.crossfadeIn, 0), 0),
    crossfadeOut: clamp(numberOr(clip?.crossfadeOut, 0), 0),
    blendMode: clip?.blendMode || 'normal',
    chromaKey: cloneOptionalObject(clip?.chromaKey),
    lut: cloneOptionalObject(clip?.lut),
    mask: cloneOptionalObject(clip?.mask),
    effects: Array.isArray(clip?.effects) ? clip.effects.map((effect) => ({ ...effect })) : [],
    keyframes: cloneKeyframes(clip?.keyframes),
    visible: clip?.visible !== false,
    hidden: Boolean(clip?.hidden),
    disabled: Boolean(clip?.disabled),
    muted: Boolean(clip?.muted),
    solo: Boolean(clip?.solo),
    hasAudio: clip?.hasAudio !== false
  };
}

function cloneState(state = {}) {
  const tracks = Array.isArray(state.tracks) ? state.tracks.map(cloneTrack) : [];
  const clips = Array.isArray(state.clips) ? state.clips.map(cloneClip) : [];
  return {
    tracks,
    clips,
    selectedClipId: state.selectedClipId || clips.at(-1)?.id || null,
    nextTrackIndex: Math.max(numberOr(state.nextTrackIndex, tracks.length + 1), tracks.length + 1),
    nextClipIndex: Math.max(numberOr(state.nextClipIndex, clips.length + 1), clips.length + 1)
  };
}

function withSelection(state, selectedClipId) {
  return { ...state, selectedClipId };
}

export function createMediaTimelineState(overrides = {}) {
  return cloneState(overrides);
}

export function addMediaTimelineTrack(state, track = {}) {
  const next = cloneState(state);
  const entry = cloneTrack({
    ...track,
    id: track.id || `${track.kind || 'video'}-${next.nextTrackIndex}`
  }, next.tracks.length);
  return {
    ...next,
    tracks: [...next.tracks, entry],
    nextTrackIndex: next.nextTrackIndex + 1
  };
}

export function addMediaTimelineClip(state, clip = {}) {
  const next = cloneState(state);
  const entry = cloneClip({
    ...clip,
    id: clip.id || `clip-${next.nextClipIndex}`,
    trackId: clip.trackId || next.tracks.find((track) => track.kind === clip.kind)?.id || next.tracks[0]?.id || ''
  }, next.clips.length);
  return {
    ...next,
    clips: [...next.clips, entry],
    selectedClipId: entry.id,
    nextClipIndex: next.nextClipIndex + 1
  };
}

export function updateMediaTimelineClip(state, clipId, updates = {}) {
  const next = cloneState(state);
  return {
    ...next,
    clips: next.clips.map((clip, index) => clip.id === clipId ? cloneClip({ ...clip, ...updates, id: clip.id }, index) : clip)
  };
}

export function updateMediaTimelineTrack(state, trackId, updates = {}) {
  const next = cloneState(state);
  return {
    ...next,
    tracks: next.tracks.map((track, index) => track.id === trackId ? cloneTrack({ ...track, ...updates, id: track.id }, index) : track)
  };
}

export function moveMediaTimelineClip(state, clipId, updates = {}) {
  return updateMediaTimelineClip(state, clipId, {
    trackId: updates.trackId,
    start: updates.start
  });
}

export function splitMediaTimelineClip(state, clipId, splitTime, options = {}) {
  const next = cloneState(state);
  const index = next.clips.findIndex((clip) => clip.id === clipId);
  const clip = next.clips[index];
  if (!clip) return next;
  const time = clamp(numberOr(splitTime, clip.start), clip.start + 0.1, clip.start + clip.duration - 0.1);
  const leftDuration = time - clip.start;
  const rightDuration = (clip.start + clip.duration) - time;
  const trimSplit = clip.trimStart + leftDuration;
  const left = cloneClip({
    ...clip,
    duration: leftDuration,
    trimEnd: Math.min(clip.trimEnd, trimSplit)
  }, index);
  const right = cloneClip({
    ...clip,
    id: options.rightId || `clip-${next.nextClipIndex}`,
    start: time,
    duration: rightDuration,
    trimStart: Math.min(clip.trimEnd - 0.1, trimSplit),
    trimEnd: clip.trimEnd,
    name: options.name || `${clip.name} copy`
  }, index + 1);
  const clips = [...next.clips];
  clips.splice(index, 1, left, right);
  return {
    ...next,
    clips,
    selectedClipId: right.id,
    nextClipIndex: next.nextClipIndex + 1
  };
}

export function duplicateMediaTimelineClip(state, clipId, options = {}) {
  const next = cloneState(state);
  const source = next.clips.find((clip) => clip.id === clipId);
  if (!source) return next;
  const duplicate = cloneClip({
    ...source,
    id: options.id || `clip-${next.nextClipIndex}`,
    start: source.start + numberOr(options.offset, 0.5),
    name: options.name || `${source.name} copy`
  }, next.clips.length);
  return {
    ...next,
    clips: [...next.clips, duplicate],
    selectedClipId: duplicate.id,
    nextClipIndex: next.nextClipIndex + 1
  };
}

export function removeMediaTimelineClip(state, clipId) {
  const next = cloneState(state);
  const clips = next.clips.filter((clip) => clip.id !== clipId);
  const selectedClipId = next.selectedClipId === clipId ? clips.at(-1)?.id || null : next.selectedClipId;
  return withSelection({ ...next, clips }, selectedClipId);
}

export function reorderMediaTimelineTrack(state, trackId, targetIndex = 0) {
  const next = cloneState(state);
  const index = next.tracks.findIndex((track) => track.id === trackId);
  if (index < 0) return next;
  const tracks = [...next.tracks];
  const [track] = tracks.splice(index, 1);
  tracks.splice(clamp(Math.round(Number(targetIndex) || 0), 0, tracks.length), 0, track);
  return {
    ...next,
    tracks: tracks.map((entry, order) => cloneTrack({ ...entry, order }, order))
  };
}

export function rippleMoveMediaTimelineClip(state, clipId, nextStart = 0) {
  const next = cloneState(state);
  const clip = next.clips.find((entry) => entry.id === clipId);
  if (!clip) return next;
  const delta = (Number(nextStart) || 0) - clip.start;
  const clips = next.clips.map((entry, index) => {
    if (entry.id === clipId) return cloneClip({ ...entry, start: nextStart }, index);
    if (entry.trackId === clip.trackId && entry.start > clip.start) {
      return cloneClip({ ...entry, start: Math.max(0, entry.start + delta) }, index);
    }
    return entry;
  });
  return { ...next, clips };
}

export function slipMediaTimelineClip(state, clipId, delta = 0) {
  const next = cloneState(state);
  const amount = Number(delta) || 0;
  return {
    ...next,
    clips: next.clips.map((clip, index) => {
      if (clip.id !== clipId) return clip;
      const trimStart = Math.max(0, clip.trimStart + amount);
      const trimEnd = Math.max(trimStart + clip.duration, clip.trimEnd + amount);
      return cloneClip({ ...clip, trimStart, trimEnd, duration: clip.duration, start: clip.start }, index);
    })
  };
}

export function slideMediaTimelineClip(state, clipId, delta = 0) {
  const next = cloneState(state);
  const amount = Number(delta) || 0;
  const clip = next.clips.find((entry) => entry.id === clipId);
  if (!clip) return next;
  const laneClips = next.clips
    .filter((entry) => entry.trackId === clip.trackId)
    .sort((a, b) => a.start - b.start);
  const laneIndex = laneClips.findIndex((entry) => entry.id === clipId);
  const previous = laneClips[laneIndex - 1] || null;
  const following = laneClips[laneIndex + 1] || null;
  const start = Math.max(0, clip.start + amount);
  const end = start + clip.duration;
  return {
    ...next,
    clips: next.clips.map((entry, index) => {
      if (entry.id === clipId) return cloneClip({ ...entry, start }, index);
      if (previous && entry.id === previous.id) {
        return cloneClip({ ...entry, duration: Math.max(0.1, start - entry.start), trimEnd: entry.trimStart + Math.max(0.1, start - entry.start) }, index);
      }
      if (following && entry.id === following.id) {
        const originalEnd = following.start + following.duration;
        const duration = Math.max(0.1, originalEnd - end);
        return cloneClip({ ...entry, start: end, duration, trimStart: Math.max(0, entry.trimEnd - duration) }, index);
      }
      return entry;
    })
  };
}

export function setMediaTimelineKeyframe(state, clipId, property, keyframe = {}) {
  const next = cloneState(state);
  return {
    ...next,
    clips: next.clips.map((clip, index) => {
      if (clip.id !== clipId) return clip;
      const entries = [...(clip.keyframes?.[property] || [])]
        .filter((entry) => Number(entry.time) !== Number(keyframe.time))
        .concat({
          time: Math.max(0, Number(keyframe.time) || 0),
          value: Number.isFinite(Number(keyframe.value)) ? Number(keyframe.value) : keyframe.value,
          easing: keyframe.easing || 'linear'
        })
        .sort((a, b) => a.time - b.time);
      return cloneClip({
        ...clip,
        keyframes: {
          ...clip.keyframes,
          [property]: entries
        }
      }, index);
    })
  };
}
