export const VIDEO_EXPORT_PROFILES = {
  'social-vertical': {
    id: 'social-vertical',
    label: 'Vertical',
    width: 1080,
    height: 1920,
    fps: 30,
    outputFormat: 'mp4',
    preset: 'slow',
    crf: 18
  },
  'social-square': {
    id: 'social-square',
    label: 'Square',
    width: 1080,
    height: 1080,
    fps: 30,
    outputFormat: 'mp4',
    preset: 'slow',
    crf: 18
  },
  master: {
    id: 'master',
    label: 'Master',
    width: 3840,
    height: 2160,
    fps: 60,
    outputFormat: 'mp4',
    preset: 'slow',
    crf: 12
  },
  gif: {
    id: 'gif',
    label: 'GIF',
    width: 720,
    height: 720,
    fps: 15,
    outputFormat: 'gif',
    preset: 'slow',
    crf: 18
  }
};

export function getVideoExportProfile(id = 'master', overrides = {}) {
  const profile = VIDEO_EXPORT_PROFILES[id] || VIDEO_EXPORT_PROFILES.master;
  return { ...profile, ...overrides };
}

export function shouldUseSequentialChain(clips = []) {
  return (Array.isArray(clips) ? clips : []).some((clip) => {
    const blendMode = String(clip?.blendMode || 'normal').toLowerCase();
    return Boolean(
      clip?.chromaKey ||
      clip?.mask ||
      clip?.lut ||
      (blendMode && blendMode !== 'normal') ||
      Object.keys(clip?.keyframes || {}).length
    );
  });
}

export {
  FFmpegPlanBuilder,
  buildMediaCompositionPlan,
  buildMediaMixerPlan,
  buildMediaNormalizedStitchPlan,
  buildMediaRenderPlan,
  buildMediaSequentialChainPlan,
  buildMediaTimelinePlan,
  describeMediaRenderPlan,
  flattenMediaMixerTracks,
  getFramePreviewSubtitleCues,
  getMediaCompositionClipDuration,
  getMediaCompositionClipEnd,
  getMediaCompositionClipStart,
  getMediaCompositionGeometry,
  getSubtitleCueSpan,
  normalizeCropRect,
  normalizeSubtitleCueText,
  parseSrtSubtitles,
  resolveFFmpegAudioEncodePlan,
  resolveFFmpegOutputPolicy,
  resolveFFmpegScalePlan,
  resolveFFmpegVideoEncodePlan,
  serializeSrtSubtitles,
  shiftSubtitleCues
} from '../core/ffmpeg-builder.js';

function inferMimeTypeFromOutputName(outputName, fallback) {
  const extension = String(outputName || '').split('.').pop()?.toLowerCase();
  const mimeTypes = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav'
  };
  return mimeTypes[extension] || fallback || 'application/octet-stream';
}

export function tokenizeMediaFfmpegCommand(commandText) {
  const text = String(commandText || '').trim();
  if (!text) return [];
  const tokens = [];
  let current = '';
  let quote = '';
  let escaped = false;
  for (const char of text) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }
  if (escaped) current += '\\';
  if (quote) throw new Error('Command has an unterminated quote.');
  if (current) tokens.push(current);
  if (/^(?:.*\/)?ffmpeg(?:\.exe)?$/i.test(tokens[0] || '')) return tokens.slice(1);
  return tokens;
}

export function getMediaFfmpegCommandOutputName(commandText) {
  const command = Array.isArray(commandText) ? commandText : tokenizeMediaFfmpegCommand(commandText);
  return command.at(-1) || '';
}

export function applyMediaCommandOverride(plan, commandText) {
  const command = tokenizeMediaFfmpegCommand(commandText);
  const outputName = getMediaFfmpegCommandOutputName(command);
  const previousToken = command.at(-2) || '';
  const flagWithoutValue = ['-y', '-n', '-nostdin', '-hide_banner', '-stats', '-nostats'].includes(previousToken);
  if (!command.length) throw new Error('Custom FFmpeg arguments are empty.');
  if (!outputName || outputName.startsWith('-') || (previousToken.startsWith('-') && !flagWithoutValue)) {
    throw new Error('Custom FFmpeg arguments must end with an output file.');
  }
  return {
    ...plan,
    command,
    commandSequence: null,
    outputName,
    mimeType: inferMimeTypeFromOutputName(outputName, plan.mimeType)
  };
}

export function applyMediaCommandSequenceDraft(plan, draft = []) {
  const source = Array.isArray(draft) ? draft : [];
  const commandSequence = source
    .filter((entry) => !entry?.deleted)
    .map((entry, index) => {
      const command = Array.isArray(entry.command)
        ? entry.command
        : tokenizeMediaFfmpegCommand(entry.commandText);
      const outputFileName = getMediaFfmpegCommandOutputName(command) || entry.outputFileName || '';
      const previousToken = command.at(-2) || '';
      const flagWithoutValue = ['-y', '-n', '-nostdin', '-hide_banner', '-stats', '-nostats'].includes(previousToken);
      if (!command.length) throw new Error(`Command ${index + 1} arguments are empty.`);
      if (!outputFileName || outputFileName.startsWith('-') || (previousToken.startsWith('-') && !flagWithoutValue)) {
        throw new Error(`Command ${index + 1} must end with an output file.`);
      }
      return {
        stage: entry.stage || '',
        name: entry.name || `Command ${index + 1}`,
        command,
        outputFileName,
        keepOutput: entry.keepOutput === true
      };
    });
  if (!commandSequence.length) throw new Error('Command chain must keep at least one command.');
  const finalStep = commandSequence.at(-1);
  return {
    ...plan,
    commandSequence,
    command: finalStep.command,
    outputName: finalStep.outputFileName,
    mimeType: inferMimeTypeFromOutputName(finalStep.outputFileName, plan.mimeType)
  };
}
