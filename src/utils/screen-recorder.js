const QUALITY_PRESETS = {
  archival: { mp4Crf: '18', webmCrf: '28', videoBitrate: '12M', audioBitrate: '192k' },
  balanced: { mp4Crf: '21', webmCrf: '32', videoBitrate: '8M', audioBitrate: '160k' },
  compact: { mp4Crf: '26', webmCrf: '36', videoBitrate: '4M', audioBitrate: '128k' }
};

export function getRecorderBitrate(width) {
  const targetWidth = Number(width) || 1920;
  if (targetWidth >= 3840) return 18_000_000;
  if (targetWidth >= 2560) return 14_000_000;
  if (targetWidth >= 1920) return 10_000_000;
  return 6_000_000;
}

export function sanitizeCaptureSurface(value) {
  const surface = String(value || 'monitor');
  return ['monitor', 'window', 'browser'].includes(surface) ? surface : 'monitor';
}

export function buildScreenRecorderExportPlan(options) {
  const {
    sourceName,
    sourceBuffer,
    clipStart = 0,
    clipEnd = 0,
    duration = 0,
    format = 'mp4',
    quality = 'balanced',
    muteSourceAudio = false,
    sourceHasAudio = true,
    replacementAudioName = '',
    replacementAudioBuffer = null
  } = options;

  const safeQuality = QUALITY_PRESETS[quality] ? quality : 'balanced';
  const preset = QUALITY_PRESETS[safeQuality];
  const safeFormat = format === 'webm' ? 'webm' : 'mp4';
  const normalizedStart = Math.max(0, Number(clipStart) || 0);
  const maxDuration = Math.max(0.1, Number(duration) || 0.1);
  const normalizedEnd = Math.max(normalizedStart + 0.1, Math.min(Number(clipEnd) || maxDuration, maxDuration));
  const clipDuration = Number((normalizedEnd - normalizedStart).toFixed(3));
  const files = [{ name: sourceName, buffer: sourceBuffer }];
  const command = ['-ss', String(normalizedStart), '-i', sourceName, '-t', String(clipDuration)];
  const hasReplacementAudio = !!(replacementAudioBuffer && replacementAudioName);
  const keepOriginalAudio = !!sourceHasAudio && !muteSourceAudio && !hasReplacementAudio;

  if (hasReplacementAudio) {
    files.push({ name: replacementAudioName, buffer: replacementAudioBuffer });
    command.push('-i', replacementAudioName);
  }

  if (safeFormat === 'mp4') {
    command.push(
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', preset.mp4Crf,
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart'
    );
  } else {
    command.push(
      '-c:v', 'libvpx-vp9',
      '-b:v', preset.videoBitrate,
      '-crf', preset.webmCrf,
      '-deadline', 'good'
    );
  }

  if (hasReplacementAudio) {
    if (safeFormat === 'mp4') {
      command.push('-c:a', 'aac', '-b:a', preset.audioBitrate);
    } else {
      command.push('-c:a', 'libopus', '-b:a', preset.audioBitrate);
    }
    command.push('-map', '0:v:0', '-map', '1:a:0', '-shortest');
  } else if (keepOriginalAudio) {
    if (safeFormat === 'mp4') {
      command.push('-c:a', 'aac', '-b:a', preset.audioBitrate);
    } else {
      command.push('-c:a', 'libopus', '-b:a', preset.audioBitrate);
    }
    command.push('-map', '0:v:0', '-map', '0:a:0?');
  } else {
    command.push('-an', '-map', '0:v:0');
  }

  const extension = safeFormat === 'mp4' ? 'mp4' : 'webm';
  const mimeType = safeFormat === 'mp4' ? 'video/mp4' : 'video/webm';
  const outputName = `screen_recording_${Date.now()}.${extension}`;
  command.push(outputName);

  return {
    files,
    command,
    outputName,
    mimeType,
    clipStart: normalizedStart,
    clipEnd: normalizedEnd,
    clipDuration,
    hasReplacementAudio,
    keepOriginalAudio
  };
}
