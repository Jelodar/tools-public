import { runFFmpegJob } from '../core/ffmpeg-service.js';
import { readFileAsArrayBuffer } from '../ui/ui-utils.js';

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi']);
const AUDIO_EXTENSIONS = new Set(['wav', 'mp3', 'm4a', 'aac', 'ogg', 'opus', 'flac', 'webm']);

function getExtension(name = '') {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

export function getMediaAudioSourceType(file) {
  const type = String(file?.type || '').toLowerCase();
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  const extension = getExtension(file?.name);
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  return 'unknown';
}

async function readMediaFileBuffer(file) {
  if (typeof file?.arrayBuffer === 'function') return file.arrayBuffer();
  return readFileAsArrayBuffer(file);
}

function createAudioContext(sampleRate) {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AudioContextCtor = root.AudioContext || root.webkitAudioContext || globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextCtor) throw new Error('Audio decoding is not available in this browser.');
  try {
    return new AudioContextCtor({ sampleRate });
  } catch {
    return new AudioContextCtor();
  }
}

async function readyAudioContext(audioContext) {
  if (audioContext?.state === 'suspended') await audioContext.resume();
  return audioContext;
}

async function decodeAudioBuffer(audioContext, buffer) {
  const decodeBuffer = buffer?.slice ? buffer.slice(0) : buffer;
  return audioContext.decodeAudioData(decodeBuffer);
}

export async function decodeMediaAudioFile(file, options = {}) {
  if (!file) throw new Error('No media file selected.');
  const sourceName = file.name || 'input';
  const sourceType = getMediaAudioSourceType(file);
  const createdContext = !options.audioContext;
  const requestedRate = Number(options.sampleRate) || Number(options.audioContext?.sampleRate) || 48000;
  const audioContext = await readyAudioContext(options.audioContext || createAudioContext(requestedRate));
  const sampleRate = Math.max(1, Math.round(Number(options.sampleRate) || Number(audioContext.sampleRate) || requestedRate));
  const outputName = options.outputName || 'converted.wav';
  try {
    const sourceBuffer = await readMediaFileBuffer(file);
    let decoded = null;
    let mediaBuffer = sourceBuffer;
    let mediaName = sourceName;
    let wasConverted = false;

    if (sourceType !== 'video') {
      try {
        decoded = await decodeAudioBuffer(audioContext, sourceBuffer);
      } catch {
        decoded = null;
      }
    }

    if (!decoded) {
      options.onConvertStart?.({ file, sourceType, outputName });
      const result = await runFFmpegJob({
        files: [{ name: sourceName, buffer: sourceBuffer }],
        command: ['-i', sourceName, '-vn', '-ac', '2', '-ar', String(sampleRate), '-f', 'wav', outputName],
        outputFileName: outputName,
        onEvent: options.onEvent
      });
      mediaBuffer = result.buffer;
      mediaName = result.name || outputName;
      wasConverted = true;
      decoded = await decodeAudioBuffer(audioContext, mediaBuffer);
    }

    return {
      name: sourceName,
      mediaName,
      buffer: decoded,
      audioBuffer: decoded,
      arrayBuffer: mediaBuffer,
      sourceType,
      wasConverted
    };
  } finally {
    if (createdContext && options.closeCreatedContext !== false) {
      await audioContext.close?.();
    }
  }
}
