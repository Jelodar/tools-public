/**
 * PCM Recorder Processor
 * Modern AudioWorklet for high-performance audio data capture.
 */
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this.port.onmessage = (e) => {
      if (e.data.command === 'flush') {
        this.port.postMessage({ buffer: this._buffer });
        this._buffer = [];
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      // Capture the first channel (mono) for the buffer
      // In a pro studio we'd handle multi-channel, but for now we focus on bit-perfect mono capture
      const channelData = input[0];
      this._buffer.push(new Float32Array(channelData));
    }
    return true; // Keep processor alive
  }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
