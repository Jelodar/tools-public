import { downloadFile, showToast } from '../ui/ui-utils.js';
import { runFFmpegJob } from '../core/ffmpeg-service.js';
import { analyzeWaveform } from '../core/media-visualization-service.js';
import { createJobProgress } from '../ui/job-progress.js';
import { createMediaTrimmer } from '../ui/media-trimmer.js';
import { getRecorderBitrate, sanitizeCaptureSurface, buildScreenRecorderExportPlan } from '../utils/screen-recorder.js';
import { captureVideoFrameStrip } from '../utils/media-visualization.js';
import { decodeMediaAudioFile } from '../utils/media-audio-import.js';
import { bindMediaControls, setMediaPlaybackState } from '../utils/media-session.js';

let container = null;
let mediaRecorder = null;
let chunks = [];
let previewStream = null;
let recordedBlob = null;
let recordedUrl = '';
let replacementAudioFile = null;
let recordingStartedAt = 0;
let recordingTimer = null;
let capturedDuration = 0;
let startVal = 0;
let endVal = 0;
let sourceHasAudio = false;
let captureProgressController = null;
let exportProgressController = null;
let reviewTrimmer = null;
let reviewVisualToken = 0;
let lastLoopState = false;
let cleanup = [];

function clearRecordingTimer() {
  if (recordingTimer) window.clearInterval(recordingTimer);
  recordingTimer = null;
}

function clearPreviewStream(previewElement = null) {
  if (!previewStream) return;
  previewStream.getTracks().forEach((track) => track.stop());
  previewStream = null;
  if (previewElement) previewElement.srcObject = null;
}

function waitForVisualUpdate() {
  return new Promise((resolve) => {
    const schedule = globalThis.requestAnimationFrame || globalThis.window?.requestAnimationFrame;
    if (typeof schedule === 'function') {
      schedule(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

export async function mount(parent) {
  cleanup = [];
  container = document.createElement('div');
  container.className = 'tool-recorder';
  container.innerHTML = `
    <div class="card rj-layout screen-recorder-shell">
      <div class="screen-recorder-capture-grid">
        <div class="screen-recorder-preview-panel">
          <div id="recorder-viewport" class="screen-recorder-viewport">
            <video id="record-preview" class="screen-recorder-preview" autoplay muted playsinline></video>
            <div id="rec-indicator" class="hidden screen-recorder-indicator">
              <div class="screen-recorder-indicator-dot"></div>
              <span id="rec-indicator-label" class="screen-recorder-indicator-label">REC</span>
            </div>
          </div>
        </div>

        <div class="screen-recorder-settings-panel">
          <div class="settings-grid screen-recorder-settings-grid">
            <div class="form-group">
              <label>Capture Surface</label>
              <select id="rec-surface">
                <option value="monitor">Screen</option>
                <option value="window">Window</option>
                <option value="browser">Browser Tab</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target Resolution</label>
              <select id="rec-res">
                <option value="3840">4K</option>
                <option value="2560">1440p</option>
                <option value="1920" selected>1080p</option>
                <option value="1280">720p</option>
              </select>
            </div>
            <div class="form-group">
              <label>Frame Rate</label>
              <select id="rec-fps">
                <option value="60">60 FPS</option>
                <option value="30" selected>30 FPS</option>
                <option value="24">24 FPS</option>
              </select>
            </div>
            <div class="form-group">
              <label>Audio Capture</label>
              <select id="rec-audio-mode">
                <option value="system" selected>System if available</option>
                <option value="none">No audio</option>
              </select>
            </div>
          </div>

          <div class="screen-recorder-controls">
            <button id="btn-rec-start" class="screen-recorder-primary-action">Start Capture</button>
            <button id="btn-rec-pause" class="hidden btn-secondary screen-recorder-secondary-action">Pause</button>
            <button id="btn-rec-resume" class="hidden btn-secondary screen-recorder-secondary-action">Resume</button>
            <button id="btn-rec-stop" class="hidden btn-secondary screen-recorder-primary-action">Stop Capture</button>
          </div>

          <div id="recording-diagnostics" class="screen-recorder-diagnostics">
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Status</span>
              <strong id="diag-status">Idle</strong>
            </div>
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Source Audio</span>
              <strong id="diag-audio">Waiting</strong>
            </div>
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Elapsed</span>
              <strong id="diag-elapsed">00:00</strong>
            </div>
            <div class="studio-output-card screen-recorder-diagnostic-card">
              <span>Recorder Codec</span>
              <strong id="diag-codec">Auto</strong>
            </div>
          </div>

          <div id="recording-progress-host" class="screen-recorder-progress-host"></div>
        </div>
      </div>

      <section id="recording-review" class="hidden screen-recorder-review">
        <div class="screen-recorder-review-header">
          <div>
            <h3 class="screen-recorder-review-title">Review</h3>
            <div id="review-summary" class="screen-recorder-review-summary">No capture yet.</div>
          </div>
          <div class="screen-recorder-review-actions">
            <button id="btn-download-raw" class="btn-secondary">Download Raw WebM</button>
          </div>
        </div>

        <div class="screen-recorder-review-grid">
          <div class="screen-recorder-review-media-panel">
            <video id="review-preview" class="screen-recorder-review-preview" playsinline></video>

            <div id="review-trimmer-host"></div>
          </div>

          <div class="screen-recorder-export-panel">
            <div class="settings-grid screen-recorder-export-settings">
              <div class="form-group">
                <label>Export Format</label>
                <select id="review-format">
                  <option value="mp4" selected>MP4 (H.264 + AAC)</option>
                  <option value="webm">WebM (VP9 + Opus)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Quality</label>
                <select id="review-quality">
                  <option value="archival">Archival</option>
                  <option value="balanced" selected>Balanced</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>

            <div class="settings-grid screen-recorder-audio-settings">
              <div class="form-group screen-recorder-switch-row">
                <label class="rj-switch">
                  <input type="checkbox" id="review-mute">
                  <span class="slider-switch"></span>
                </label>
                <label for="review-mute" class="screen-recorder-switch-label">Mute source audio</label>
              </div>
              <div class="form-group">
                <label>Replace Audio Track</label>
                <div id="replacement-audio-shell" class="screen-recorder-replacement-shell">
                  <button id="btn-pick-audio" class="btn-secondary" type="button">Choose Audio File</button>
                  <span id="replacement-audio-name" class="screen-recorder-replacement-name">No replacement audio selected.</span>
                  <input type="file" id="replacement-audio-input" class="hidden" accept="audio/*,video/*">
                </div>
              </div>
            </div>

            <div class="screen-recorder-export-actions">
              <button id="btn-export-edited" class="screen-recorder-export-button">Export Capture</button>
              <button id="btn-reset-review" class="btn-secondary screen-recorder-reset-button">Discard Review</button>
            </div>
            <div id="screen-recorder-export-state" class="screen-recorder-export-state">Waiting for a capture.</div>
            <div id="recording-export-progress-host" class="screen-recorder-progress-host screen-recorder-export-progress-host"></div>
          </div>
        </div>
      </section>

      <p class="screen-recorder-note">
        Capture stays local. Review exports can trim, mute, swap audio, and transcode before download.
      </p>
    </div>
  `;

  parent.appendChild(container);

  captureProgressController = createJobProgress(container.querySelector('#recording-progress-host'), {
    variant: 'compact'
  });
  exportProgressController = createJobProgress(container.querySelector('#recording-export-progress-host'), {
    variant: 'compact'
  });
  captureProgressController.update({
    title: 'Recorder ready',
    detail: 'Pick a surface and start capture.',
    autoResetMs: 1600
  });

  const refs = {
    preview: container.querySelector('#record-preview'),
    indicator: container.querySelector('#rec-indicator'),
    indicatorLabel: container.querySelector('#rec-indicator-label'),
    start: container.querySelector('#btn-rec-start'),
    pause: container.querySelector('#btn-rec-pause'),
    resume: container.querySelector('#btn-rec-resume'),
    stop: container.querySelector('#btn-rec-stop'),
    status: container.querySelector('#diag-status'),
    audio: container.querySelector('#diag-audio'),
    elapsed: container.querySelector('#diag-elapsed'),
    codec: container.querySelector('#diag-codec'),
    review: container.querySelector('#recording-review'),
    reviewPreview: container.querySelector('#review-preview'),
    reviewSummary: container.querySelector('#review-summary'),
    reviewFormat: container.querySelector('#review-format'),
    reviewQuality: container.querySelector('#review-quality'),
    reviewMute: container.querySelector('#review-mute'),
    replacementInput: container.querySelector('#replacement-audio-input'),
    replacementName: container.querySelector('#replacement-audio-name'),
    reviewTrimmerHost: container.querySelector('#review-trimmer-host'),
    exportPanel: container.querySelector('.screen-recorder-export-panel'),
    exportState: container.querySelector('#screen-recorder-export-state')
  };

  const playReviewMedia = () => {
    if (recordedBlob) refs.reviewPreview.play?.();
  };
  const pauseReviewMedia = () => {
    refs.reviewPreview.pause?.();
  };
  const toggleReviewMedia = () => {
    if (!recordedBlob || refs.reviewPreview.paused) playReviewMedia();
    else pauseReviewMedia();
  };
  cleanup.push(bindMediaControls({
    target: window,
    metadata: { title: 'Screen Recorder Review', artist: 'Jelodar Tools' },
    playbackState: 'paused',
    handlers: {
      play: playReviewMedia,
      pause: pauseReviewMedia,
      stop: pauseReviewMedia,
      toggle: toggleReviewMedia
    }
  }));

  const setElapsed = (seconds) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const mins = String(Math.floor(total / 60)).padStart(2, '0');
    const secs = String(total % 60).padStart(2, '0');
    refs.elapsed.textContent = `${mins}:${secs}`;
  };

  const updateRecordingButtons = (mode) => {
    refs.start.classList.toggle('hidden', mode !== 'idle');
    refs.pause.classList.toggle('hidden', mode !== 'recording');
    refs.resume.classList.toggle('hidden', mode !== 'paused');
    refs.stop.classList.toggle('hidden', mode === 'idle');
    refs.indicator.classList.toggle('hidden', mode === 'idle');
    refs.indicatorLabel.textContent = mode === 'paused' ? 'PAUSED' : 'REC';
    refs.status.textContent = mode === 'idle'
      ? 'Idle'
      : mode === 'paused'
        ? 'Paused'
        : 'Recording';
  };

  const resetReview = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    recordedBlob = null;
    recordedUrl = '';
    replacementAudioFile = null;
    capturedDuration = 0;
    refs.review.classList.add('hidden');
    refs.reviewPreview.removeAttribute('src');
    refs.reviewPreview.load?.();
    setMediaPlaybackState('paused');
    refs.reviewSummary.textContent = 'No capture yet.';
    refs.replacementName.textContent = 'No replacement audio selected.';
    refs.exportState.textContent = 'Waiting for a capture.';
    refs.reviewMute.checked = false;
    exportProgressController?.hide();
    reviewTrimmer?.destroy();
    reviewTrimmer = null;
  };

  const chooseRecorderMime = () => {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    return candidates.find((mime) => MediaRecorder.isTypeSupported?.(mime)) || '';
  };

  const createReviewTrimmer = () => {
    reviewTrimmer?.destroy();
    reviewTrimmer = createMediaTrimmer({
      mount: refs.reviewTrimmerHost,
      idPrefix: 'screen',
      duration: capturedDuration || 0.1,
      start: 0,
      end: capturedDuration || 0.1,
      minSpan: 0.1,
      zoom: 1,
      maxZoom: 100,
      isLooping: lastLoopState,
      onChange(range) {
        startVal = range.start;
        endVal = range.end;
        if (range.reason === 'selection') {
          refs.reviewPreview.currentTime = range.start;
        }
      },
      onRulerSeek({ time }) {
        refs.reviewPreview.currentTime = time;
      },
      onSeek(time) {
        refs.reviewPreview.currentTime = time;
      },
      onTogglePlayback({ isPlaying, time }) {
        if (isPlaying) {
          if (time !== undefined) refs.reviewPreview.currentTime = time;
          if (refs.reviewPreview.currentTime >= endVal || refs.reviewPreview.currentTime < startVal) {
            refs.reviewPreview.currentTime = startVal;
          }
          refs.reviewPreview.play();
        } else {
          refs.reviewPreview.pause();
        }
      },
      onLoopChange({ isLooping }) {
        lastLoopState = isLooping;
      }
    });

    const onTimeUpdate = () => {
      if (reviewTrimmer && !refs.reviewPreview.paused) {
        if (refs.reviewPreview.currentTime >= endVal) {
          if (lastLoopState) {
            refs.reviewPreview.currentTime = startVal;
            refs.reviewPreview.play();
          } else {
            refs.reviewPreview.pause();
            reviewTrimmer.clearPlayhead();
            reviewTrimmer.emitEnded();
          }
          return;
        }
        reviewTrimmer.setPlayhead(refs.reviewPreview.currentTime);
      }
    };
    const onPlay = () => {
      reviewTrimmer?.setPlaying(true);
      setMediaPlaybackState('playing');
    };
    const onPause = () => {
      reviewTrimmer?.setPlaying(false);
      setMediaPlaybackState('paused');
    };

    refs.reviewPreview.addEventListener('timeupdate', onTimeUpdate);
    refs.reviewPreview.addEventListener('play', onPlay);
    refs.reviewPreview.addEventListener('pause', onPause);
    
    cleanup.push(() => {
      refs.reviewPreview.removeEventListener('timeupdate', onTimeUpdate);
      refs.reviewPreview.removeEventListener('play', onPlay);
      refs.reviewPreview.removeEventListener('pause', onPause);
    });
  };

  const hydrateReviewFrames = async () => {
    if (!recordedBlob || !reviewTrimmer) return;
    const token = ++reviewVisualToken;
    if (!sourceHasAudio) {
      const frames = await captureVideoFrameStrip({ blob: recordedBlob, count: 12, width: 104, height: 58 });
      if (token !== reviewVisualToken || !reviewTrimmer) return;
      reviewTrimmer.setFrameStrip(frames);
      reviewTrimmer.setLoading({ visible: false });
      return;
    }
    reviewTrimmer.setLoading({ visible: true, title: 'Preparing waveform', detail: 'Analyzing local capture...', progress: 8 });
    try {
      const waveform = await analyzeWaveform({
        file: recordedBlob,
        fileName: 'capture.webm',
        cacheKey: `capture:${recordedBlob.size}:${capturedDuration}`,
        maxBins: 32768,
        onEvent(event) {
          if (!reviewTrimmer || token !== reviewVisualToken) return;
          if (event.type === 'ffmpeg-progress') {
            reviewTrimmer.setLoading({ visible: true, title: 'Preparing waveform', detail: 'Decoding capture audio...', progress: event.payload.progress });
          } else if (event.type === 'waveform-status') {
            reviewTrimmer.setLoading({ visible: event.payload.phase !== 'complete', title: 'Preparing waveform', detail: event.payload.message, progress: event.payload.phase === 'complete' ? 100 : 72 });
          }
        }
      });
      if (token !== reviewVisualToken || !reviewTrimmer) return;
      if (waveform?.levels?.length) {
        reviewTrimmer.setWaveform(waveform);
        reviewTrimmer.setLoading({ visible: false });
        return;
      }
    } catch {}
    const frames = await captureVideoFrameStrip({ blob: recordedBlob, count: 12, width: 104, height: 58 });
    if (token !== reviewVisualToken || !reviewTrimmer) return;
    reviewTrimmer.setFrameStrip(frames);
    reviewTrimmer.setLoading({ visible: false });
  };

  const hydrateReview = (blob) => {
    recordedBlob = blob;
    recordedUrl = URL.createObjectURL(blob);
    refs.reviewPreview.src = recordedUrl;
    refs.review.classList.remove('hidden');
    refs.reviewSummary.textContent = `${(blob.size / 1024 / 1024).toFixed(2)} MB capture ready for trim and export.`;
    refs.exportState.textContent = 'Ready to export trimmed capture.';
    
    const onLoadedMetadata = () => {
      const duration = Number(refs.reviewPreview.duration);
      const safeDuration = (Number.isFinite(duration) && duration > 0) ? duration : capturedDuration || 0.1;
      capturedDuration = safeDuration;
      startVal = 0;
      endVal = safeDuration;
      setElapsed(safeDuration);
      createReviewTrimmer();
      hydrateReviewFrames();
    };
    refs.reviewPreview.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    cleanup.push(() => refs.reviewPreview.removeEventListener('loadedmetadata', onLoadedMetadata));
  };

  const finalizeCapture = () => {
    if (!container?.isConnected) return;
    const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'video/webm' });
    const endedAt = performance.now();
    capturedDuration = Math.max(0.1, (endedAt - recordingStartedAt) / 1000);
    hydrateReview(blob);
    clearPreviewStream(refs.preview);
    clearRecordingTimer();
    mediaRecorder = null;
    updateRecordingButtons('idle');
    captureProgressController.update({
      title: 'Capture ready',
      detail: 'Review or export the recording below.',
      tone: 'success',
      autoResetMs: 2200
    });
  };

  refs.start.addEventListener('click', async () => {
    try {
      resetReview();
      const width = Number(container.querySelector('#rec-res').value);
      const frameRate = Number(container.querySelector('#rec-fps').value);
      const surface = sanitizeCaptureSurface(container.querySelector('#rec-surface').value);
      const includeAudio = container.querySelector('#rec-audio-mode').value !== 'none';
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: width },
          frameRate: { ideal: frameRate },
          displaySurface: surface
        },
        audio: includeAudio
      });

      previewStream = stream;
      sourceHasAudio = stream.getAudioTracks().length > 0;
      refs.audio.textContent = sourceHasAudio ? 'Present' : 'None';
      refs.preview.srcObject = stream;
      chunks = [];
      const mimeType = chooseRecorderMime();
      mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: getRecorderBitrate(width)
      });
      refs.codec.textContent = mimeType || 'Browser default';
      recordingStartedAt = performance.now();
      mediaRecorder.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data);
      };
      
      const onRecorderStop = () => finalizeCapture();
      const onRecorderPause = () => updateRecordingButtons('paused');
      const onRecorderResume = () => updateRecordingButtons('recording');

      mediaRecorder.addEventListener('stop', onRecorderStop);
      mediaRecorder.addEventListener('pause', onRecorderPause);
      mediaRecorder.addEventListener('resume', onRecorderResume);
      
      cleanup.push(() => {
        if (mediaRecorder) {
          mediaRecorder.removeEventListener('stop', onRecorderStop);
          mediaRecorder.removeEventListener('pause', onRecorderPause);
          mediaRecorder.removeEventListener('resume', onRecorderResume);
        }
      });

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (mediaRecorder?.state !== 'inactive') mediaRecorder.stop();
      });

      mediaRecorder.start(250);
      updateRecordingButtons('recording');
      captureProgressController.update({
        title: 'Capture live',
        detail: `${surface} capture at ${width}px / ${frameRate}fps.`,
        busy: true
      });
      recordingTimer = window.setInterval(() => {
        setElapsed((performance.now() - recordingStartedAt) / 1000);
      }, 250);
    } catch (error) {
      showToast(`Capture failed: ${error.message}`, 'danger');
      clearPreviewStream(refs.preview);
      clearRecordingTimer();
      updateRecordingButtons('idle');
      captureProgressController.update({
        title: 'Capture failed',
        detail: error.message,
        tone: 'danger'
      });
    }
  });

  refs.pause.addEventListener('click', () => {
    if (mediaRecorder?.state === 'recording') mediaRecorder.pause();
  });

  refs.resume.addEventListener('click', () => {
    if (mediaRecorder?.state === 'paused') mediaRecorder.resume();
  });

  refs.stop.addEventListener('click', () => {
    if (mediaRecorder?.state && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  });

  container.querySelector('#btn-download-raw').addEventListener('click', () => {
    if (recordedBlob) downloadFile(recordedBlob, 'capture_raw.webm');
  });

  container.querySelector('#btn-pick-audio').addEventListener('click', () => {
    refs.replacementInput.click();
  });

  refs.replacementInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      replacementAudioFile = file;
      refs.replacementName.textContent = file.name;
    }
  });

  container.querySelector('#btn-reset-review').addEventListener('click', () => {
    resetReview();
    updateRecordingButtons('idle');
  });

  const exportButton = container.querySelector('#btn-export-edited');
  exportButton.addEventListener('click', async () => {
    if (!recordedBlob || exportButton.disabled) return;
    const format = container.querySelector('#review-format').value;
    const quality = container.querySelector('#review-quality').value;
    const start = startVal;
    const end = endVal;
    const isMuted = refs.reviewMute.checked;
    const progress = exportProgressController;
    const originalLabel = exportButton.textContent;

    exportButton.disabled = true;
    exportButton.textContent = 'Preparing Export';
    refs.exportState.textContent = 'Preparing local export...';
    refs.exportPanel?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    progress.update({
      title: 'Preparing export',
      detail: 'Reading local capture and export settings.',
      progress: 2,
      busy: true
    });
    await waitForVisualUpdate();

    try {
      const sourceBuffer = await recordedBlob.arrayBuffer();
      progress.update({
        title: 'Preparing export',
        detail: 'Building local FFmpeg command.',
        progress: 8,
        busy: true
      });
      refs.exportState.textContent = 'Building local export plan...';
      let replacementAudio = null;
      if (replacementAudioFile) {
        replacementAudio = await decodeMediaAudioFile(replacementAudioFile, {
          sampleRate: 48000,
          outputName: 'replacement.wav',
          onConvertStart: () => {
            progress.update({
              title: 'Preparing audio',
              detail: `Extracting audio from ${replacementAudioFile.name}`,
              busy: true
            });
          },
          onEvent: (event) => {
            if (event.type === 'ffmpeg-progress') {
              progress.update({
                progress: event.payload.progress,
                detail: `Preparing audio... ${event.payload.progress.toFixed(1)}%`,
                busy: true
              });
              refs.exportState.textContent = `Preparing replacement audio... ${event.payload.progress.toFixed(1)}%`;
            }
          }
        });
        if (replacementAudio.wasConverted) refs.replacementName.textContent = `${replacementAudio.name} (audio extracted)`;
      }
      const plan = buildScreenRecorderExportPlan({
        sourceName: 'input.webm',
        sourceBuffer,
        clipStart: start,
        clipEnd: end,
        duration: capturedDuration,
        format,
        quality,
        muteSourceAudio: isMuted,
        sourceHasAudio,
        replacementAudioName: replacementAudio?.mediaName || '',
        replacementAudioBuffer: replacementAudio?.arrayBuffer || null
      });

      const { name, buffer } = await runFFmpegJob({
        files: plan.files,
        command: plan.command,
        outputFileName: plan.outputName,
        onEvent: (event) => {
          if (event.type === 'ffmpeg-progress') {
            progress.update({
              progress: event.payload.progress,
              detail: `Encoding capture... ${event.payload.progress.toFixed(1)}%`,
              busy: true
            });
            refs.exportState.textContent = `Encoding capture... ${event.payload.progress.toFixed(1)}%`;
          }
        }
      });
      downloadFile(new Blob([buffer]), name);
      refs.exportState.textContent = 'Export complete.';
      progress.update({
        title: 'Export complete',
        detail: 'Capture exported successfully',
        tone: 'success',
        autoResetMs: 5000
      });
    } catch (err) {
      refs.exportState.textContent = 'Export failed.';
      progress.update({
        title: 'Export failed',
        detail: err.message,
        tone: 'danger'
      });
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = originalLabel;
    }
  });
}

export function unmount() {
  clearPreviewStream();
  clearRecordingTimer();
  reviewTrimmer?.destroy();
  reviewTrimmer = null;
  captureProgressController?.destroy();
  captureProgressController = null;
  exportProgressController?.destroy();
  exportProgressController = null;
  for (const dispose of cleanup) dispose();
  cleanup = [];
  if (container) container.remove();
}
