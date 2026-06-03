import { closeAudioContext, createBrowserAudioContext, resumeAudioContext, stopAndDisconnectAudioNodes } from '../utils/audio-context.js';
import { bindMediaControls, setMediaPlaybackState } from '../utils/media-session.js';

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let inputHandler = null;
let containerRef = null;
let mediaControlsCleanup = null;
let isTonePlaying = false;

export async function mount(container) {
  containerRef = container;
  container.innerHTML = `
    <div class="tool-audio-tools">
      <header>
        <h2 class="audio-tools-title">Audio Tone Generator</h2>
        <p class="audio-tools-copy">
          Generate precise audio tones and frequencies directly in your browser. Utilize the native Web Audio API to create custom sounds (Sine, Square, Sawtooth, Triangle) for testing audio equipment, musical tuning, or acoustic experiments.
        </p>
      </header>
      <div class="audio-tools-panel">
        <div class="audio-tools-frequency" id="freq-display">440 Hz</div>
        
        <div class="audio-tools-slider-shell">
          <input type="range" id="freq-slider" class="audio-tools-slider" min="20" max="20000" value="440">
          <div class="audio-tools-range-labels">
            <span>20 Hz</span>
            <span>20,000 Hz</span>
          </div>
        </div>

        <div class="audio-tools-wave-options">
          <label><input type="radio" name="wave" value="sine" checked> Sine</label>
          <label><input type="radio" name="wave" value="square"> Square</label>
          <label><input type="radio" name="wave" value="sawtooth"> Sawtooth</label>
          <label><input type="radio" name="wave" value="triangle"> Triangle</label>
        </div>

        <button id="play-btn" class="audio-tools-play-button">Play Tone</button>
      </div>
    </div>
  `;

  const root = container.querySelector('.tool-audio-tools');
  const freqDisplay = root.querySelector('#freq-display');
  const freqSlider = root.querySelector('#freq-slider');
  const playBtn = root.querySelector('#play-btn');

  const stopTone = () => {
    if (oscillator) {
      stopAndDisconnectAudioNodes([oscillator, gainNode], { context: audioCtx });
      oscillator = null;
      gainNode = null;
    }
    playBtn.textContent = 'Play Tone';
    playBtn.classList.remove('is-playing');
    isTonePlaying = false;
    setMediaPlaybackState('paused');
  };

  const startTone = async () => {
    if (isTonePlaying) return;
    if (!audioCtx) {
      audioCtx = createBrowserAudioContext(window);
    }
    await resumeAudioContext(audioCtx);
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    oscillator.type = root.querySelector('input[name="wave"]:checked').value;
    oscillator.frequency.setValueAtTime(freqSlider.value, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    
    playBtn.textContent = 'Stop Tone';
    playBtn.classList.add('is-playing');
    isTonePlaying = true;
    setMediaPlaybackState('playing');
  };

  const toggleTone = () => {
    if (isTonePlaying) return stopTone();
    return startTone();
  };

  mediaControlsCleanup = bindMediaControls({
    target: window,
    metadata: { title: 'Audio Tone Generator', artist: 'Jelodar Tools' },
    playbackState: 'paused',
    handlers: {
      play: startTone,
      pause: stopTone,
      stop: stopTone,
      toggle: toggleTone
    }
  });

  inputHandler = async (e) => {
    if (e.target.id === 'freq-slider') {
      const freq = e.target.value;
      freqDisplay.textContent = `${freq} Hz`;
      if (oscillator) {
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      }
    } else if (e.target.name === 'wave') {
      if (oscillator) {
        oscillator.type = e.target.value;
      }
    } else if (e.target.id === 'play-btn') {
      await toggleTone();
    }
  };

  root.addEventListener('input', inputHandler);
  root.addEventListener('click', inputHandler);
}

export function unmount() {
  mediaControlsCleanup?.();
  const root = containerRef?.querySelector('.tool-audio-tools');
  if (root && inputHandler) {
    root.removeEventListener('input', inputHandler);
    root.removeEventListener('click', inputHandler);
  }
  stopAndDisconnectAudioNodes([oscillator, gainNode], { context: audioCtx });
  if (audioCtx) {
    closeAudioContext(audioCtx);
  }
  oscillator = null;
  audioCtx = null;
  gainNode = null;
  inputHandler = null;
  containerRef = null;
  mediaControlsCleanup = null;
  isTonePlaying = false;
}
