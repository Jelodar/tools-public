import {
  buildMixerTrackGainPoints,
  getMixerAutomationValueAt,
  getMixerTimelineDuration,
  resolveMixerAudibility
} from '../utils/audio-mixer.js';

function getTrackSpan(track = {}) {
  return Math.max(0, (Number(track.trimEnd) || 0) - (Number(track.trimStart) || 0));
}

function getPlaybackNow(context, startedAt, fallbackNow) {
  const currentTime = Number(context?.currentTime);
  if (Number.isFinite(currentTime) && Number.isFinite(startedAt)) {
    return Math.max(0, currentTime - startedAt);
  }
  return Math.max(0, (Date.now() - fallbackNow) / 1000);
}

function toTrackStructureSignature(track = {}) {
  return [
    track.id,
    track.laneIndex,
    track.offset,
    track.trimStart,
    track.trimEnd,
    track.fadeStyle
  ].join('|');
}

function toTrackEnvelopeSignature(track = {}) {
  return [
    track.id,
    Number(track.volume) || 1,
    JSON.stringify(track.volumeAutomation || [])
  ].join('|');
}

function applyTrackEnvelope({ context, track, laneTracks, trackGain, trackTime = 0 }) {
  const clipDuration = getTrackSpan(track);
  const currentTrackTime = Math.max(0, Math.min(clipDuration, Number(trackTime) || 0));
  const scheduleClipTime = (clipTime) => context.currentTime + Math.max(0, (Number(clipTime) || 0) - currentTrackTime);
  const points = buildMixerTrackGainPoints(track, laneTracks, {
    fromTime: currentTrackTime
  });
  trackGain.gain.cancelScheduledValues(context.currentTime);
  if (!points.length) {
    trackGain.gain.setValueAtTime(getMixerAutomationValueAt([], currentTrackTime, track.volume), context.currentTime);
    return;
  }
  trackGain.gain.setValueAtTime(points[0].value, context.currentTime);
  points.slice(1).forEach((point) => {
    if (point.time <= currentTrackTime) return;
    trackGain.gain.linearRampToValueAtTime(point.value, scheduleClipTime(point.time));
  });
}

export function createMixerPlaybackService() {
  let context = null;
  let activeEntries = [];
  let laneEntries = [];
  let timeInterval = null;
  let endTimeout = null;
  let playbackBeganAt = 0;
  let playbackStartedAt = 0;
  let wallClockStartedAt = 0;
  let currentState = null;
  let endTime = 0;
  let ended = false;
  let onTimeUpdate = null;
  let onEnded = null;

  const clearTimers = () => {
    if (timeInterval) clearInterval(timeInterval);
    if (endTimeout) clearTimeout(endTimeout);
    timeInterval = null;
    endTimeout = null;
  };

  const stop = () => {
    clearTimers();
    activeEntries.forEach((entry) => {
      try {
        entry.source.stop();
      } catch {}
      entry.source.disconnect?.();
      entry.trackGain.disconnect?.();
    });
    laneEntries.forEach((entry) => entry.gain.disconnect?.());
    activeEntries = [];
    laneEntries = [];
    ended = false;
  };

  const finish = () => {
    if (ended) return;
    ended = true;
    clearTimers();
    onEnded?.();
  };

  const getCurrentTime = () => playbackStartedAt + getPlaybackNow(context, playbackBeganAt, wallClockStartedAt);

  const syncState = ({ state } = {}) => {
    currentState = state || currentState;
    if (!context || !activeEntries.length || !currentState) {
      return { requiresRestart: false, restartFromTime: null };
    }

    const audibility = resolveMixerAudibility({
      lanes: currentState.lanes,
      tracks: currentState.tracks
    });

    let requiresRestart = false;
    const currentTime = getCurrentTime();
    let restartFromTime = null;

    laneEntries.forEach((entry) => {
      const lane = currentState.lanes[entry.index];
      const audible = audibility.laneAudibility[entry.index];
      const volume = audible ? Number(lane?.volume) || 1 : 0;
      entry.gain.gain.setTargetAtTime(volume, context.currentTime, 0.04);
    });

    activeEntries.forEach((entry) => {
      const nextTrack = currentState.tracks.find((track) => track.id === entry.trackId);
      if (!nextTrack || entry.structureSignature !== toTrackStructureSignature(nextTrack)) {
        requiresRestart = true;
        restartFromTime = Math.min(
          Math.max(0, currentTime),
          Math.max(0, getMixerTimelineDuration(currentState.tracks))
        );
        return;
      }
      const audible = audibility.trackAudibility[nextTrack.id];
      const trackTime = Math.max(0, currentTime - nextTrack.offset);
      const envelopeSignature = toTrackEnvelopeSignature(nextTrack);
      if (envelopeSignature !== entry.envelopeSignature && audible) {
        const clipStart = Number(nextTrack.offset) || 0;
        const startTimeOnContext = playbackBeganAt + Math.max(0, clipStart - playbackStartedAt);
        applyTrackEnvelope({
          context,
          track: nextTrack,
          laneTracks: currentState.tracks
            .filter((track) => track.laneIndex === nextTrack.laneIndex)
            .sort((left, right) => left.offset - right.offset),
          trackGain: entry.trackGain,
          trackTime,
          startTimeOnContext
        });
        entry.envelopeSignature = envelopeSignature;
        return;
      }
      const volume = audible ? getMixerAutomationValueAt(nextTrack.volumeAutomation, trackTime, nextTrack.volume) : 0;
      entry.trackGain.gain.setTargetAtTime(volume, context.currentTime, 0.04);
    });

    if (!requiresRestart) {
      const activeTrackIds = new Set(activeEntries.map((entry) => entry.trackId));
      const hasNewAudibleTrack = currentState.tracks.some((track) => {
        const clipDuration = getTrackSpan(track);
        const clipStart = Number(track.offset) || 0;
        const clipEnd = clipStart + clipDuration;
        return !activeTrackIds.has(track.id)
          && audibility.trackAudibility[track.id]
          && track.buffer
          && clipDuration > 0
          && clipEnd > currentTime;
      });
      if (hasNewAudibleTrack) {
        requiresRestart = true;
        restartFromTime = Math.min(
          Math.max(0, currentTime),
          Math.max(0, getMixerTimelineDuration(currentState.tracks))
        );
      }
    }

    return { requiresRestart, restartFromTime };
  };

  const play = async ({
    audioContext,
    state,
    startTime = 0,
    onTimeUpdate: handleTimeUpdate,
    onEnded: handleEnded
  } = {}) => {
    stop();
    context = audioContext || context;
    currentState = state;
    onTimeUpdate = handleTimeUpdate;
    onEnded = handleEnded;
    playbackStartedAt = Math.max(0, Number(startTime) || 0);
    playbackBeganAt = Number(context?.currentTime) || 0;
    wallClockStartedAt = Date.now();
    ended = false;

    if (!context || !currentState) return;

    const audibility = resolveMixerAudibility({
      lanes: currentState.lanes,
      tracks: currentState.tracks
    });
    const laneTracks = currentState.lanes.map((_, laneIndex) => (
      currentState.tracks
        .filter((track) => track.laneIndex === laneIndex)
        .sort((left, right) => left.offset - right.offset)
    ));

    laneEntries = currentState.lanes.map((lane, index) => {
      const gain = context.createGain();
      gain.gain.value = audibility.laneAudibility[index] ? Number(lane.volume) || 1 : 0;
      gain.connect(context.destination);
      return { index, gain };
    });

    activeEntries = [];
    endTime = playbackStartedAt;

    currentState.tracks.forEach((track) => {
      const clipDuration = getTrackSpan(track);
      const clipStart = Number(track.offset) || 0;
      const clipEnd = clipStart + clipDuration;
      if (!audibility.trackAudibility[track.id] || !track.buffer || clipDuration <= 0 || playbackStartedAt >= clipEnd) {
        return;
      }

      const laneGain = laneEntries[track.laneIndex]?.gain;
      if (!laneGain) return;

      const trackGain = context.createGain();
      const source = context.createBufferSource();
      const startOffset = Math.max(0, playbackStartedAt - clipStart);
      const playFrom = Math.max(0, (Number(track.trimStart) || 0) + startOffset);
      const remainingDuration = Math.max(0, clipDuration - startOffset);
      if (remainingDuration <= 0) return;

      source.buffer = track.buffer;
      const startTimeOnContext = context.currentTime + Math.max(0, clipStart - playbackStartedAt);
      applyTrackEnvelope({
        context,
        track,
        laneTracks: laneTracks[track.laneIndex],
        trackGain,
        trackTime: startOffset,
        startTimeOnContext
      });
      source.connect(trackGain);
      trackGain.connect(laneGain);
      source.start(startTimeOnContext, playFrom, remainingDuration);

      activeEntries.push({
        trackId: track.id,
        structureSignature: toTrackStructureSignature(track),
        envelopeSignature: toTrackEnvelopeSignature(track),
        source,
        trackGain
      });
      endTime = Math.max(endTime, clipEnd);
    });

    if (!activeEntries.length) {
      finish();
      return;
    }

    const updateClock = () => {
      onTimeUpdate?.(Math.min(endTime, getCurrentTime()));
    };

    updateClock();
    timeInterval = setInterval(updateClock, 33);
    endTimeout = setTimeout(() => {
      updateClock();
      finish();
    }, Math.max(0, (endTime - playbackStartedAt) * 1000));
  };

  return {
    play,
    stop,
    syncState,
    getCurrentTime
  };
}
