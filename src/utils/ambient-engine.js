export const VISUALIZER_PALETTE = {
  background: '#07080a',
  grid: 'rgba(232,227,216,0.1)',
  text: 'rgba(232,227,216,0.58)',
  low: '#c98232',
  lowDim: 'rgba(201,130,50,0.52)',
  mid: '#d8d2c4',
  midDim: 'rgba(216,210,196,0.5)',
  high: '#a8d8bd',
  highDim: 'rgba(168,216,189,0.48)',
  peak: '#ffffff',
  peakWarm: '#d6a553'
};

export const NOTE_FREQUENCIES = (() => {
  const names = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
  const values = {};
  for (let octave = 0; octave <= 8; octave += 1) {
    names.forEach((name, index) => {
      const midi = index + (octave + 1) * 12;
      values[`${name}${octave}`] = 440 * (2 ** ((midi - 69) / 12));
    });
  }
  return values;
})();

export const NOISE_MODES = {
  white: { label: 'White Noise', desc: 'Static hiss' },
  pink: { label: 'Pink Noise', desc: 'Steady rain' },
  brown: { label: 'Brown Noise', desc: 'Deep rumble' },
  blue: { label: 'Blue Noise', desc: 'High hiss' },
  violet: { label: 'Violet Noise', desc: 'Shrill hiss' },
  gray: { label: 'Gray Noise', desc: 'Balanced human' },
  green: { label: 'Green Noise', desc: 'Nature-mid' },
  velvet: { label: 'Velvet Noise', desc: 'Random pulses' }
};

export const AMBIENT_MODES = {
  natural: [
    { id: 'wind-breeze', label: 'Soft Breeze' },
    { id: 'wind-storm', label: 'Howling Wind' },
    { id: 'rain-balanced', label: 'Rain Balanced' },
    { id: 'rain-tent', label: 'Rain on Tent' },
    { id: 'thunder-storm', label: 'Thunderstorm' },
    { id: 'ocean-waves', label: 'Ocean Waves' },
    { id: 'fireside', label: 'Fireside Crackle' },
    { id: 'summer-night', label: 'Summer Night' },
    { id: 'frozen-tundra', label: 'Frozen Tundra' },
    { id: 'forest-creek', label: 'Forest Creek' },
    { id: 'forest-cuckoo', label: 'Forest Cuckoo' },
    { id: 'dawn-chorus', label: 'Dawn Chorus' },
    { id: 'waterfall-mist', label: 'Waterfall Mist' },
    { id: 'mosquito-swarm', label: 'Mosquito Swarm' },
    { id: 'cicada-heat', label: 'Cicada Heat' },
    { id: 'leaf-canopy', label: 'Leaf Canopy' },
    { id: 'desert-wind', label: 'Desert Wind' },
    { id: 'bamboo-grove', label: 'Bamboo Grove' },
    { id: 'hail-roof', label: 'Hail on Roof' },
    { id: 'traffic-hum', label: 'Traffic Hum' },
    { id: 'distant-train', label: 'Distant Train' },
    { id: 'monsoon-canopy', label: 'Monsoon Canopy' },
    { id: 'distant-avalanche', label: 'Distant Avalanche' }
  ],
  resonant: [
    { id: 'singing-bowls', label: 'Singing Bowls' },
    { id: 'glass-harmonics', label: 'Glass Harmonics' },
    { id: 'metallic-chimes', label: 'Metallic Chimes' },
    { id: 'deep-gong', label: 'Deep Gong' },
    { id: 'temple-bell', label: 'Temple Bell' },
    { id: 'crystal-vibration', label: 'Crystal Vibration' },
    { id: 'wind-chimes', label: 'Wind Chimes' },
    { id: 'wind-harp', label: 'Wind Harp' },
    { id: 'handpan', label: 'Handpan' },
    { id: 'shop-chimes', label: 'Shop Entry Chimes' },
    { id: 'church-bell', label: 'Church Bell' },
    { id: 'bowed-glass', label: 'Bowed Glass' },
    { id: 'aeolian-wires', label: 'Aeolian Wires' },
    { id: 'cedar-resonator', label: 'Cedar Resonator' },
    { id: 'copper-pipes', label: 'Copper Pipes' }
  ],
  focus: [
    { id: 'zen-flute', label: 'Zen Flute' },
    { id: 'binaural-focus', label: 'Binaural Focus' },
    { id: 'monastic-chant', label: 'Monastic Chant' },
    { id: 'tibetan-drone', label: 'Tibetan Drone' },
    { id: 'library-focus', label: 'Library Focus' },
    { id: 'alpha-focus', label: 'Alpha Focus' },
    { id: 'deep-work-pulse', label: 'Deep Work Pulse' },
    { id: 'metronome-breath', label: 'Breath Meter' },
    { id: 'steady-attention', label: 'Steady Attention' }
  ],
  scifi: [
    { id: 'space-drone', label: 'Deep Space Drone' },
    { id: 'interstellar-stay', label: 'Interstellar S.T.A.Y.' },
    { id: 'final-countdown', label: 'Final Countdown' },
    { id: 'starwars-march', label: 'Starwars March' },
    { id: 'noir-orbit', label: 'Noir Orbit' },
    { id: 'organ-horizon', label: 'Organ Horizon' },
    { id: 'love-theme', label: 'Love Theme' },
    { id: 'rhapsody-suite', label: 'Rhapsody Suite' }
  ],
  abstract: [
    { id: 'dream-sequence', label: 'Dream Sequence' },
    { id: 'submerged', label: 'Submerged World' },
    { id: 'magnetic-field', label: 'Magnetic Field' },
    { id: 'harmonic-bloom', label: 'Harmonic Bloom' },
    { id: 'ether-flow', label: 'Ether Flow' },
    { id: 'granular-cloud', label: 'Granular Cloud' },
    { id: 'solar-wind', label: 'Solar Wind' },
    { id: 'pulse-cave', label: 'Pulse Cave' },
    { id: 'pressure-waves', label: 'Pressure Waves' }
  ]
};

export const AMBIENT_VISUALIZER_RANGES = {
  'wind-breeze': [80, 4200],
  'wind-storm': [45, 5200],
  'rain-balanced': [900, 11000],
  'rain-tent': [180, 8200],
  'thunder-storm': [24, 10000],
  'ocean-waves': [28, 3200],
  fireside: [80, 7000],
  'summer-night': [2600, 8200],
  'frozen-tundra': [160, 7800],
  'forest-creek': [250, 9000],
  'forest-cuckoo': [140, 7200],
  'dawn-chorus': [950, 7600],
  'waterfall-mist': [120, 11500],
  'mosquito-swarm': [380, 3600],
  'cicada-heat': [2600, 9400],
  'leaf-canopy': [300, 4800],
  'desert-wind': [80, 5600],
  'bamboo-grove': [120, 4600],
  'hail-roof': [900, 13000],
  'traffic-hum': [28, 2600],
  'distant-train': [22, 2400],
  'monsoon-canopy': [140, 11500],
  'distant-avalanche': [20, 1500],
  'singing-bowls': [120, 1200],
  'glass-harmonics': [780, 3200],
  'metallic-chimes': [900, 4800],
  'deep-gong': [28, 560],
  'temple-bell': [80, 1600],
  'crystal-vibration': [620, 3600],
  'wind-chimes': [900, 5600],
  'wind-harp': [60, 2200],
  handpan: [120, 3600],
  'shop-chimes': [1400, 5200],
  'church-bell': [70, 2400],
  'bowed-glass': [260, 2200],
  'aeolian-wires': [80, 1800],
  'cedar-resonator': [50, 1200],
  'copper-pipes': [180, 2600],
  'zen-flute': [260, 1800],
  'binaural-focus': [120, 360],
  'monastic-chant': [60, 500],
  'tibetan-drone': [40, 620],
  'library-focus': [35, 4200],
  'alpha-focus': [70, 360],
  'deep-work-pulse': [45, 260],
  'metronome-breath': [100, 1800],
  'steady-attention': [60, 420],
  'space-drone': [20, 900],
  'interstellar-stay': [35, 900],
  'final-countdown': [42, 5200],
  'starwars-march': [28, 3200],
  'noir-orbit': [40, 1800],
  'organ-horizon': [32, 2200],
  'love-theme': [70, 4200],
  'rhapsody-suite': [42, 6400],
  'dream-sequence': [180, 1600],
  submerged: [20, 800],
  'magnetic-field': [50, 500],
  'harmonic-bloom': [140, 2400],
  'ether-flow': [900, 7000],
  'granular-cloud': [140, 2400],
  'solar-wind': [160, 5200],
  'pulse-cave': [28, 360],
  'pressure-waves': [18, 180]
};

export const NOISE_VISUALIZER_RANGES = {
  white: [60, 16000],
  pink: [35, 12000],
  brown: [18, 1800],
  blue: [800, 18000],
  violet: [1800, 20000],
  gray: [80, 16000],
  green: [80, 4200],
  velvet: [40, 9000]
};

export function computeSpatialPan(t, dur, edgeHold) {
  const travel = Math.max(0.5, dur / 2);
  const hold = Math.max(0, edgeHold);
  if (!hold) return Math.sin(t * Math.PI * 2 * (1 / Math.max(0.5, dur)));
  const cycle = travel * 2 + hold * 2;
  const phase = ((t % cycle) + cycle) % cycle;
  if (phase < travel) return -Math.cos((phase / travel) * Math.PI);
  if (phase < travel + hold) return 1;
  if (phase < travel * 2 + hold) return Math.cos(((phase - travel - hold) / travel) * Math.PI);
  return -1;
}

export function computeSpatialDistanceGain(t, dur, depth) {
  const wave = 0.5 + Math.sin(t * Math.PI * 2 * (1 / Math.max(0.5, dur)) - Math.PI / 2) * 0.5;
  return Math.max(0.35, 1 - Math.max(0, Math.min(0.85, depth)) * wave);
}

export function frequencyToVisualizerBin(freq, binCount, sampleRate = 44100) {
  const length = Math.max(1, binCount);
  const nyquist = sampleRate / 2;
  const bin = Math.round((freq / nyquist) * (length - 1));
  return Math.max(0, Math.min(length - 1, bin));
}

export function getTargetVisualizerBinRange({
  trimEmpty = false,
  ambientEnabled = true,
  noiseEnabled = true,
  currentAmbientMode = null,
  currentNoiseMode = null,
  binCount = 256,
  sampleRate = 44100
} = {}) {
  const lastBin = Math.max(0, binCount - 1);
  if (!trimEmpty) return [0, lastBin];
  const ranges = [];
  if (ambientEnabled && currentAmbientMode && AMBIENT_VISUALIZER_RANGES[currentAmbientMode]) {
    ranges.push(AMBIENT_VISUALIZER_RANGES[currentAmbientMode]);
  }
  if (noiseEnabled && currentNoiseMode && NOISE_VISUALIZER_RANGES[currentNoiseMode]) {
    ranges.push(NOISE_VISUALIZER_RANGES[currentNoiseMode]);
  }
  if (!ranges.length) return [0, lastBin];
  const minFreq = Math.min(...ranges.map((range) => range[0]));
  const maxFreq = Math.max(...ranges.map((range) => range[1]));
  const first = frequencyToVisualizerBin(minFreq, binCount, sampleRate);
  const last = frequencyToVisualizerBin(maxFreq, binCount, sampleRate);
  const pad = Math.max(3, Math.round((last - first) * 0.08));
  return [Math.max(0, first - pad), Math.min(lastBin, last + pad)];
}

export function getSmoothedVisualizerBinRange({
  trimEmpty = false,
  targetRange = [0, 255],
  currentStart = 0,
  currentEnd = 255,
  binCount = 256,
  smoothing = 0.14
} = {}) {
  const lastBin = Math.max(0, binCount - 1);
  const targetStart = Math.max(0, Math.min(lastBin, targetRange[0] ?? 0));
  const targetEnd = Math.max(0, Math.min(lastBin, targetRange[1] ?? lastBin));
  if (!trimEmpty) return [targetStart, targetEnd, targetStart, targetEnd];
  const nextStart = currentStart + (targetStart - currentStart) * smoothing;
  const nextEnd = currentEnd + (targetEnd - currentEnd) * smoothing;
  const first = Math.floor(Math.max(0, nextStart));
  const last = Math.ceil(Math.min(lastBin, nextEnd));
  const visible = last - first < 14
    ? [Math.max(0, first - 7), Math.min(lastBin, last + 7)]
    : [first, last];
  return [visible[0], visible[1], nextStart, nextEnd];
}

export function createStayPadCycle(cycleStart = 0) {
  const events = [];
  const addBgChord = (startBeat, dur, notes, vel) => {
    notes.forEach((note) => events.push({ beat: cycleStart + startBeat, dur, note, type: 'bg', vel }));
  };
  const addOstinato = (startBeat, qNote, hNote, vel, pan = 0) => {
    events.push({ beat: cycleStart + startBeat, dur: 1, note: qNote, type: 'ost', vel, pan: pan - 0.16 });
    events.push({ beat: cycleStart + startBeat + 1, dur: 2, note: hNote, type: 'ost', vel: Math.max(0.12, vel * 0.82), pan: pan + 0.18 });
  };
  const addChordPulse = (startBeat, bass, treble, hNote, vel) => {
    bass.forEach((note) => events.push({ beat: cycleStart + startBeat, dur: 3, note, type: 'bass', vel }));
    treble.forEach((note) => events.push({ beat: cycleStart + startBeat, dur: 1.15, note, type: 'bg', vel: vel * 0.74 }));
    events.push({ beat: cycleStart + startBeat + 1, dur: 2.1, note: hNote, type: 'ost', vel: vel * 0.9, pan: 0.12 });
  };

  addBgChord(0, 12, ['F2', 'C3', 'F3', 'A3', 'C4'], 0.5);
  addBgChord(12, 12, ['G2', 'D3', 'G3', 'B3', 'D4'], 0.5);
  addBgChord(24, 12, ['A2', 'E3', 'A3', 'C4', 'E4'], 0.5);
  addBgChord(36, 12, ['G2', 'D3', 'G3', 'B3', 'D4'], 0.4);

  ['A4', 'A4', 'B4', 'B4', 'C5', 'C5', 'B4', 'B4', 'A4', 'A4', 'B4', 'B4', 'A4', 'A4', 'B4', 'B4']
    .forEach((note, index) => addOstinato(index * 3, note, 'E5', 0.16 + index * 0.014, index % 2 ? 0.12 : -0.12));

  events.push({ beat: cycleStart + 48, dur: 6, note: 'A4', type: 'pause', vel: 0 });

  let beat = 54;
  ['A4', 'A4', 'B4', 'B4', 'C5', 'C5', 'B4', 'B4', 'A4', 'A4', 'B4', 'B4', 'A4', 'A4', 'B4']
    .forEach((note, index) => {
      addOstinato(beat, note, 'E5', Math.min(1, 0.5 + index * 0.038), index % 2 ? 0.1 : -0.1);
      beat += 3;
    });

  events.push({ beat: cycleStart + beat, dur: 1, note: 'A4', type: 'ost', vel: 0.6, pan: -0.16 });
  events.push({ beat: cycleStart + beat + 1, dur: 2, note: 'E5', type: 'ost', vel: 0.4, pan: 0.16 });
  beat += 3;

  [
    [['F2', 'C3', 'F3'], ['F4', 'A4']],
    [['G2', 'D3', 'G3'], ['G4', 'B4']],
    [['A2', 'E3', 'A3'], ['A4', 'C5']],
    [['B2', 'D3', 'G3'], ['G4', 'D5']]
  ].forEach(([bass, treble], index) => {
    addChordPulse(beat + index * 3, bass, treble, 'E5', 0.82 + index * 0.045);
  });
  beat += 12;

  ['F4', 'A4', 'C5'].forEach((note) => {
    events.push({ beat: cycleStart + beat, dur: 12, note, type: 'bg', vel: 0.86 });
  });
  events.push({ beat: cycleStart + beat, dur: 12, note: 'E5', type: 'ost', vel: 0.86, pan: 0.1 });
  return events.sort((a, b) => a.beat - b.beat);
}

function shiftNoteOctave(note, octaveOffset) {
  const match = String(note).match(/^([A-G]s?)(-?\d+)$/);
  if (!match) return note;
  return `${match[1]}${Number(match[2]) + octaveOffset}`;
}

function finalCountdownDegreeToNote(degree, octaveOffset = 0) {
  const map = {
    1: 'Fs4',
    2: 'Gs4',
    3: 'A4',
    4: 'B4',
    5: 'Cs5',
    6: 'D5',
    7: 'E5'
  };
  return shiftNoteOctave(map[String(degree).replace(/[^\d]/g, '')] || 'Fs4', octaveOffset);
}

function finalCountdownChord(root) {
  const chords = {
    1: ['Fs2', 'Cs3', 'Fs3', 'A3'],
    3: ['A1', 'E2', 'A2', 'Cs3'],
    4: ['B1', 'Fs2', 'B2', 'D3'],
    5: ['Cs2', 'Gs2', 'Cs3', 'E3'],
    6: ['D2', 'A2', 'D3', 'Fs3'],
    7: ['E2', 'B2', 'E3', 'Gs3']
  };
  return chords[root] || chords[1];
}

export function createFinalCountdownCycle(cycleStart = 0) {
  const events = [];
  const notes = [
    [2.5, 0.25, 5, 0], [2.75, 0.25, 4, 0], [3, 1, 5, 0], [4, 1, 1, 0],
    [6.5, 0.25, 6, 0], [6.75, 0.25, 5, 0], [7, 0.5, 6, 0], [7.5, 0.5, 5, 0], [8, 1, 4, 0],
    [10.5, 0.25, 6, 0], [10.75, 0.25, 5, 0], [11, 1, 6, 0], [12, 1, 1, 0],
    [14.5, 0.25, 4, 0], [14.75, 0.25, 3, 0], [15, 0.5, 4, 0], [15.5, 0.5, 3, 0],
    [16, 0.5, 2, 0], [16.5, 0.5, 4, 0], [17, 1.5, 3, 0],
    [18.5, 0.25, 5, 0], [18.75, 0.25, 4, 0], [19, 1, 5, 0], [20, 1, 1, 0],
    [22.5, 0.25, 6, 0], [22.75, 0.25, 5, 0], [23, 0.5, 6, 0], [23.5, 0.5, 5, 0], [24, 1, 4, 0],
    [26.5, 0.25, 6, 0], [26.75, 0.25, 5, 0], [27, 1, 6, 0], [28, 1, 1, 0],
    [30.5, 0.25, 4, 0], [30.75, 0.25, 3, 0], [31, 0.5, 4, 0], [31.5, 0.5, 3, 0],
    [32, 0.5, 2, 0], [32.5, 0.5, 4, 0], [33, 1.5, 3, 0],
    [34.5, 0.25, 2, 0], [34.75, 0.25, 3, 0], [35, 1.5, 4, 0],
    [36.5, 0.25, 3, 0], [36.75, 0.25, 4, 0], [37, 0.5, 5, 0], [37.5, 0.5, 4, 0],
    [38, 0.5, 3, 0], [38.5, 0.5, 2, 0], [39, 1, 1, 0], [40, 1, 6, 0], [41, 3, 5, 0],
    [44, 0.25, 5, 0], [44.25, 0.25, 6, 0], [44.5, 0.25, 5, 0], [44.75, 0.25, 4, 0], [45, 4, 5, 0],
    [55, 1, 1, 0], [56, 1, 7, -1], [57, 1, 5, -1], [58, 1, 3, 0],
    [59, 1, 2, 0], [60, 1, 7, -1], [61, 4, 1, 0]
  ];
  const chords = [
    [1, 4, 1], [5, 4, 6], [9, 4, 4], [13, 4, 7],
    [17, 4, 1], [21, 4, 6], [25, 4, 4], [29, 4, 7],
    [33, 2, 1], [35, 2, 7], [37, 2, 3], [39, 2, 6],
    [41, 4, 5], [45, 4, 5], [49, 16, 1]
  ];

  chords.forEach(([beat, dur, root], chordIndex) => {
    finalCountdownChord(root).forEach((note, noteIndex) => {
      events.push({
        beat: cycleStart + beat,
        dur,
        note,
        type: noteIndex === 0 ? 'bass' : 'bg',
        vel: 0.48 + Math.min(0.28, chordIndex * 0.018),
        pan: -0.18 + noteIndex * 0.12
      });
    });
  });

  notes.forEach(([beat, dur, degree, octave], index) => {
    const note = finalCountdownDegreeToNote(degree, octave);
    events.push({
      beat: cycleStart + beat,
      dur,
      note,
      type: 'lead',
      vel: 0.58 + Math.min(0.32, index * 0.006),
      pan: index % 2 ? 0.12 : -0.12
    });
    if (dur >= 0.5) {
      events.push({
        beat: cycleStart + beat + 0.33,
        dur: Math.max(0.2, dur * 0.54),
        note,
        type: 'lead',
        vel: 0.16,
        pan: index % 2 ? -0.22 : 0.22
      });
    }
  });

  return events.sort((a, b) => a.beat - b.beat);
}

function scaleDegreeToNote(degree, octaveOffset = 0, tonic = 'C') {
  const major = {
    C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    Bb: ['As', 'C', 'D', 'Ds', 'F', 'G', 'A'],
    Eb: ['Ds', 'F', 'G', 'Gs', 'As', 'C', 'D'],
    A: ['A', 'B', 'Cs', 'D', 'E', 'Fs', 'Gs']
  };
  const raw = String(degree);
  const flat = raw.startsWith('b');
  const sharp = raw.startsWith('#');
  const numeric = Number(raw.replace(/[^0-9]/g, '')) || 1;
  const names = major[tonic] || major.C;
  const chromatic = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
  const baseName = names[(numeric - 1) % 7] || names[0];
  const adjustedIndex = chromatic.indexOf(baseName) + (sharp ? 1 : 0) - (flat ? 1 : 0);
  const noteName = chromatic[(adjustedIndex + 12) % 12];
  const octaveShift = Math.floor((adjustedIndex + 12) / 12) - 1;
  return `${noteName}${4 + octaveOffset + octaveShift}`;
}

function addDegreePhrase(events, cycleStart, notes, options = {}) {
  const tonic = options.tonic || 'C';
  const section = options.section || 'theme';
  notes.forEach((entry, index) => {
    if (entry.isRest) return;
    events.push({
      beat: cycleStart + entry.beat + (options.offset || 0),
      dur: entry.duration,
      note: scaleDegreeToNote(entry.sd, entry.octave, tonic),
      type: options.type || 'lead',
      section,
      vel: options.vel ? options.vel(index, entry) : 0.52,
      pan: index % 2 ? 0.12 : -0.12
    });
  });
}

function addChordBed(events, cycleStart, chords, options = {}) {
  const tonic = options.tonic || 'C';
  const section = options.section || 'theme';
  chords.forEach((chord, chordIndex) => {
    const root = String(chord.root || 1);
    const bass = scaleDegreeToNote(root, -2, tonic);
    const mid = scaleDegreeToNote(root, -1, tonic);
    const fifth = scaleDegreeToNote(String(((Number(root) + 3) % 7) + 1), -1, tonic);
    [bass, mid, fifth].forEach((note, noteIndex) => {
      events.push({
        beat: cycleStart + chord.beat + (options.offset || 0),
        dur: chord.duration,
        note,
        type: noteIndex === 0 ? 'bass' : 'pad',
        section,
        vel: 0.28 + Math.min(0.22, chordIndex * 0.01),
        pan: -0.18 + noteIndex * 0.18
      });
    });
  });
}

export function createLoveThemeCycle(cycleStart = 0) {
  const events = [];
  const notes = [
    ['1', 0, 1, 0.5], ['7', -1, 1.5, 0.5], ['1', 0, 2, 0.5], ['5', 0, 2.5, 1.5],
    ['7', -1, 4.5, 0.5], ['7', -1, 5, 0.5], ['6', -1, 5.5, 0.5], ['6', -1, 6, 1.25],
    ['6', -1, 8.5, 0.5], ['4', 0, 9, 0.5], ['3', 0, 9.5, 0.5], ['4', 0, 10, 0.5], ['6', 0, 10.5, 1.5],
    ['6', -1, 12.5, 0.5], ['5', -1, 13, 1], ['5', 0, 14, 1], ['5', 0, 15, 1], ['4', 0, 16, 1],
    ['7', -1, 17, 0.5], ['6', -1, 17.5, 0.5], ['5', -1, 18, 0.5], ['3', 0, 18.5, 1], ['2', 0, 19.5, 1],
    ['3', 0, 20.5, 0.5], ['3', 0, 21, 2], ['1', 0, 24, 0.25], ['7', -1, 24.25, 0.5],
    ['1', 0, 24.75, 1.25], ['1', 0, 26, 0.25], ['6', -1, 26.25, 0.5], ['7', -1, 26.75, 1.25],
    ['7', -1, 28.5, 0.5], ['1', 0, 29, 0.5], ['7', -1, 29.5, 0.5], ['6', -1, 30, 0.5], ['6', -1, 30.5, 1],
    ['5', -1, 31.5, 0.5], ['3', -1, 32, 0.5], ['2', -1, 32.5, 0.25], ['1', -1, 32.75, 0.25], ['1', -1, 33, 1],
    ['5', -1, 34, 1], ['1', 0, 35, 1], ['3', 0, 36, 0.5], ['2', 0, 36.5, 1],
    ['6', -1, 38, 0.5], ['5', -1, 38.5, 0.5], ['6', -1, 39, 1], ['1', 0, 40, 0.5], ['1', 0, 40.5, 3.5]
  ].map(([sd, octave, beat, duration]) => ({ sd, octave, beat, duration }));
  const chords = [
    [1, 1, 4], [6, 5, 4], [2, 9, 4], [5, 13, 4], [1, 21, 4],
    [6, 25, 2], [3, 27, 2], [4, 29, 4], [6, 35, 1], [2, 36, 2], [5, 38, 2], [1, 40, 4]
  ].map(([root, beat, duration]) => ({ root, beat, duration }));
  for (let offset = 0; offset < 88; offset += 44) {
    addChordBed(events, cycleStart, chords, { tonic: offset ? 'F' : 'C', section: 'love', offset });
    addDegreePhrase(events, cycleStart, notes, {
      tonic: offset ? 'F' : 'C',
      section: 'love',
      offset,
      vel: (index) => 0.42 + (index % 12) * 0.018
    });
  }
  return events.sort((a, b) => a.beat - b.beat);
}

export function createRhapsodySuiteCycle(cycleStart = 0) {
  const events = [];
  let start = 0;
  RHAPSODY_SOURCE_SECTIONS.forEach((section, sectionIndex) => {
    const scale = 72 / section.bpm;
    const notes = expandRhapsodyMotif(section.notes, section.sourceBeats);
    let beat = 0;
    notes.forEach((entry, index) => {
      if (!entry[3]) {
        events.push({
          beat: cycleStart + start + beat * scale,
          dur: entry[2] * scale,
          note: scaleDegreeToNote(entry[0], entry[1], section.tonic),
          type: index % 5 === 0 ? 'guitar' : 'piano',
          section: section.section,
          vel: Math.min(0.92, 0.42 + sectionIndex * 0.055 + (index % 9) * 0.018),
          pan: Math.sin((beat + index) * 0.55) * 0.24
        });
      }
      beat += entry[2];
    });

    let chordBeat = 0;
    section.chords.forEach((chord, chordIndex) => {
      addChordBed(events, cycleStart, [{
        root: chord[0],
        beat: start + chordBeat * scale,
        duration: chord[1] * scale
      }], {
        tonic: section.tonic,
        section: section.section
      });
      chordBeat += chord[1];
      if (section.bpm > 100 && chordIndex % 2 === 0) {
        events.push({
          beat: cycleStart + start + chordBeat * scale,
          dur: 0.16,
          type: 'perc',
          section: section.section,
          vel: 0.26 + sectionIndex * 0.025
        });
      }
    });

    start += section.sourceBeats * scale;
  });
  return events.sort((a, b) => a.beat - b.beat);
}

const RHAPSODY_SOURCE_SECTIONS = [
  {
    section: 'intro',
    bpm: 72,
    tonic: 'Bb',
    sourceBeats: 64,
    notes: [
      ['5', -1, 0.5], ['5', -1, 0.5], ['5', -1, 0.5], ['5', -1, 1], ['5', -1, 1],
      ['1', 0, 1, true], ['b5', -1, 0.5], ['b5', -1, 0.5], ['5', -1, 0.5], ['b5', -1, 0.5],
      ['3', -1, 0.25], ['2', -1, 0.75], ['1', 0, 1, true], ['5', -1, 0.5], ['5', -1, 0.5],
      ['5', -1, 0.5], ['6', -1, 1], ['5', -1, 1], ['5', -2, 0.5], ['5', -2, 0.5],
      ['5', -1, 0.5], ['5', -1, 0.5], ['6', -1, 0.5], ['5', -1, 0.5], ['4', -1, 0.5],
      ['3', -1, 1.5], ['1', 0, 1, true], ['3', -1, 0.5], ['3', -1, 0.5], ['3', -1, 0.5],
      ['3', -1, 1.5], ['1', 0, 0.5, true], ['3', -1, 0.5], ['4', -1, 0.5], ['5', -1, 1],
      ['1', -1, 1], ['6', -1, 4]
    ],
    chords: [[6, 3.5], [1, 1], [5, 3], [1, 1], [5, 3.5], [1, 1], [1, 4], [6, 4], [4, 4], [2, 4], [5, 6], [1, 8]]
  },
  {
    section: 'verse',
    bpm: 72,
    tonic: 'Bb',
    sourceBeats: 32,
    notes: [
      ['3', -1, 0.25], ['3', -1, 1.75], ['1', 0, 1.5, true], ['1', -1, 0.5],
      ['2', -1, 0.5], ['3', -1, 0.25], ['3', -1, 1.25], ['1', 0, 1.5, true],
      ['3', -1, 0.25], ['3', -1, 0.25], ['4', -1, 0.25], ['5', -1, 0.5],
      ['4', -1, 0.5], ['3', -1, 0.5], ['2', -1, 0.75], ['1', 0, 0.5, true],
      ['2', -1, 0.5], ['3', -1, 0.5], ['4', -1, 0.25], ['5', -1, 0.5],
      ['4', -1, 0.5], ['3', -1, 0.5], ['2', -1, 1.25], ['1', 0, 1, true],
      ['3', -1, 0.25], ['3', -1, 1.75], ['6', -1, 0.5], ['b7', -1, 0.25],
      ['1', 0, 0.25], ['1', 0, 2], ['4', -1, 1], ['3', -1, 0.25], ['2', -1, 3.25]
    ],
    chords: [[1, 4], [6, 4], [2, 6], [5, 2], [1, 4], [6, 4], [2, 2], [7, 2], [4, 2]]
  },
  {
    section: 'chorus',
    bpm: 72,
    tonic: 'Eb',
    sourceBeats: 36,
    notes: [
      ['3', 0, 0.25], ['3', 0, 2.75], ['2', 0, 0.5], ['3', 0, 0.25],
      ['4', 0, 0.25], ['3', 0, 3], ['1', 0, 0.5, true], ['3', 0, 0.25],
      ['3', 0, 0.25], ['4', 0, 0.75], ['3', 0, 0.25], ['3', 0, 0.5],
      ['2', 0, 0.5], ['2', 0, 1.5], ['1', 0, 0.25, true], ['5', -1, 0.25],
      ['5', -1, 0.5], ['2', 0, 0.5], ['3', 0, 0.75], ['4', 0, 0.67],
      ['5', 0, 0.33], ['4', 0, 0.25], ['3', 0, 0.25], ['5', 0, 1.5],
      ['1', 0, 1.5], ['b6', -1, 0.5], ['b7', -1, 0.25], ['5', -1, 2]
    ],
    chords: [[1, 3], [5, 1], [6, 4], [2, 2], [4, 2], [7, 1], [5, 4], [1, 2], [6, 2], [4, 2], [1, 2]]
  },
  {
    section: 'chorus-lead-out',
    bpm: 142,
    tonic: 'Eb',
    sourceBeats: 84,
    notes: [
      ['1', 0, 3.5, true], ['5', -1, 2.5], ['3', 0, 1.5], ['2', 0, 0.25], ['1', 0, 0.25],
      ['5', 0, 3], ['3', 0, 1], ['5', 0, 0.5], ['6', 0, 2.5], ['1', 0, 1, true],
      ['6', 0, 1], ['7', 0, 0.5], ['1', 1, 0.5], ['2', 1, 3], ['6', 0, 1],
      ['2', 1, 0.5], ['3', 1, 0.5], ['4', 1, 0.5], ['5', 1, 0.5], ['6', 1, 2],
      ['5', 1, 0.5], ['4', 1, 0.5], ['3', 1, 0.25], ['4', 1, 0.25], ['2', 1, 0.33],
      ['1', 1, 0.33], ['7', 0, 0.34], ['6', 0, 0.5], ['5', 0, 3], ['b7', 0, 2]
    ],
    chords: [[1, 4], [1, 4], [5, 4], [6, 8], [2, 4], [4, 4], [7, 2], [5, 8], [1, 4], [6, 8], [2, 4], [7, 4], [6, 2], [5, 2], [1, 4]]
  },
  {
    section: 'bridge',
    bpm: 142,
    tonic: 'A',
    sourceBeats: 160,
    notes: [
      ['1', 0, 8, true], ['4', -1, 1], ['3', -1, 0.5], ['3', -1, 0.5], ['b3', -1, 0.5],
      ['3', -1, 0.5], ['4', -1, 0.5], ['5', -1, 0.5], ['1', 0, 1], ['5', -1, 0.5],
      ['b5', -1, 0.5], ['5', -1, 1], ['#5', -1, 0.5], ['b5', -1, 0.5], ['6', -1, 2],
      ['b7', 0, 2], ['7', 0, 2], ['1', 1, 1], ['5', 0, 0.5], ['b6', 0, 0.5],
      ['1', -1, 0.5], ['b2', -1, 0.5], ['4', 0, 0.5], ['b3', 0, 0.5], ['2', 0, 0.5]
    ],
    chords: [[1, 8], [4, 1], [1, 1], [1, 1], [4, 1], [1, 1], [6, 2], [3, 2], [5, 2], [1, 18], [6, 1], [5, 1], [4, 2], [1, 2], [5, 4], [6, 4], [3, 4], [5, 16]]
  },
  {
    section: 'pre-outro',
    bpm: 142,
    tonic: 'Eb',
    sourceBeats: 118,
    notes: [
      ['1', -1, 0.67], ['3', -2, 0.66], ['4', -2, 0.67], ['5', -2, 0.5], ['6', -2, 0.5],
      ['7', -2, 0.33], ['1', -1, 0.67], ['2', -1, 0.67], ['#4', -2, 0.66], ['5', -2, 0.67],
      ['6', -2, 0.33], ['7', -2, 0.34], ['6', -2, 1.33], ['1', 0, 0.67, true],
      ['4', 0, 0.66], ['4', 0, 0.67], ['3', 0, 0.67], ['2', 0, 0.67], ['1', 0, 1],
      ['7', -1, 0.5], ['1', 0, 0.5], ['2', 0, 3], ['4', 0, 0.5], ['5', 0, 0.5], ['6', 0, 2.5]
    ],
    chords: [[1, 12], [5, 4], [5, 6], [1, 2], [4, 4], [2, 4], [5, 4], [2, 4], [5, 4], [1, 12], [2, 4], [3, 4], [6, 4], [4, 4], [5, 10]]
  },
  {
    section: 'outro',
    bpm: 72,
    tonic: 'Eb',
    sourceBeats: 76,
    notes: [
      ['3', 0, 2], ['2', 0, 2], ['1', 0, 1.5], ['1', 0, 0.5, true], ['7', -1, 1],
      ['1', 0, 0.5], ['7', -1, 1], ['1', 0, 0.5], ['1', 0, 2, true], ['5', 0, 0.5],
      ['#4', 0, 1], ['3', 0, 0.5], ['#4', 0, 0.5], ['5', 0, 2], ['6', 0, 1.5],
      ['5', 0, 2], ['4', 0, 0.5], ['3', 0, 0.5], ['1', 0, 0.25], ['5', -1, 1.25],
      ['3', 0, 0.25], ['2', 0, 0.5], ['1', 0, 0.5], ['7', -1, 0.75], ['5', -1, 1.5],
      ['b6', -1, 1.5], ['6', -1, 1], ['7', -1, 0.5], ['1', 0, 6], ['2', 0, 4]
    ],
    chords: [[1, 2], [5, 2], [6, 4], [3, 4], [4, 2], [1, 2], [6, 2], [3, 2], [6, 2], [4, 2], [5, 4], [1, 2], [4, 2], [1, 2], [5, 4], [1, 8]]
  }
];

function expandRhapsodyMotif(notes, sourceBeats) {
  const motifLength = notes.reduce((sum, entry) => sum + entry[2], 0);
  if (motifLength >= sourceBeats) return notes;
  const output = [];
  let total = 0;
  while (total < sourceBeats) {
    for (const entry of notes) {
      if (total >= sourceBeats) break;
      const duration = Math.min(entry[2], sourceBeats - total);
      output.push([entry[0], entry[1], duration, entry[3]]);
      total += duration;
    }
  }
  return output;
}

export function createStarwarsMarchCycle(cycleStart = 0) {
  const events = [];
  const chords = {
    Gm: ['G1', 'G2', 'D3', 'G3', 'As3'],
    Ebm: ['Ds1', 'Ds2', 'As2', 'Ds3', 'Fs3'],
    Csm: ['Cs1', 'Cs2', 'Gs2', 'Cs3', 'E3']
  };
  const addMelody = (beat, dur, note, vel = 1) => {
    events.push({ beat: cycleStart + beat, dur, note, type: 'brass', vel, pan: beat % 4 ? 0.16 : -0.16 });
  };
  const addChord = (beat, chordNotes, vel = 0.7) => {
    chordNotes.forEach((note) => events.push({ beat: cycleStart + beat, dur: 0.85, note, type: 'bass', vel }));
  };

  for (let beat = 0; beat < 64; beat += 1) {
    events.push({ beat: cycleStart + beat, dur: 0.2, type: 'perc', vel: beat % 4 === 0 ? 0.68 : 0.52 });
    events.push({ beat: cycleStart + beat + 0.75, dur: 0.2, type: 'perc', vel: 0.22 });
    let chord = chords.Gm;
    if ((beat >= 20 && beat < 24) || (beat >= 32 && beat < 36) || (beat >= 48 && beat < 52)) chord = chords.Ebm;
    else if ((beat >= 28 && beat < 32) || (beat >= 44 && beat < 48)) chord = chords.Csm;
    else if (beat >= 56 && beat % 4 >= 2) chord = chords.Ebm;
    addChord(beat, chord, 0.66);
  }

  [
    [8, 1, 'G4'], [9, 1, 'G4'], [10, 1, 'G4'], [11, 0.75, 'Ds4'], [11.75, 0.25, 'As4'],
    [12, 1, 'G4'], [13, 0.75, 'Ds4'], [13.75, 0.25, 'As4'], [14, 2, 'G4'],
    [16, 1, 'D5'], [17, 1, 'D5'], [18, 1, 'D5'], [19, 0.75, 'Ds5'], [19.75, 0.25, 'As4'],
    [20, 1, 'Fs4'], [21, 0.75, 'Ds4'], [21.75, 0.25, 'As4'], [22, 2, 'G4'],
    [24, 1, 'G5'], [25, 0.75, 'G4'], [25.75, 0.25, 'G4'], [26, 1, 'G5'], [27, 0.75, 'Fs5'], [27.75, 0.25, 'F5'],
    [28, 0.25, 'E5'], [28.25, 0.25, 'Ds5'], [28.5, 0.5, 'E5'], [29.5, 0.5, 'Gs4'], [30, 1, 'Cs5'], [31, 0.75, 'C5'], [31.75, 0.25, 'B4'],
    [32, 0.25, 'As4'], [32.25, 0.25, 'A4'], [32.5, 0.5, 'As4'], [33.5, 0.5, 'Ds4'], [34, 1, 'Fs4'], [35, 0.75, 'Ds4'], [35.75, 0.25, 'Fs4'],
    [36, 1, 'As4'], [37, 0.75, 'G4'], [37.75, 0.25, 'As4'], [38, 2, 'D5'],
    [40, 1, 'G5'], [41, 0.75, 'G4'], [41.75, 0.25, 'G4'], [42, 1, 'G5'], [43, 0.75, 'Fs5'], [43.75, 0.25, 'F5'],
    [44, 0.25, 'E5'], [44.25, 0.25, 'Ds5'], [44.5, 0.5, 'E5'], [45.5, 0.5, 'Gs4'], [46, 1, 'Cs5'], [47, 0.75, 'C5'], [47.75, 0.25, 'B4'],
    [48, 0.25, 'As4'], [48.25, 0.25, 'A4'], [48.5, 0.5, 'As4'], [49.5, 0.5, 'Ds4'], [50, 1, 'Fs4'], [51, 0.75, 'Ds4'], [51.75, 0.25, 'As4'],
    [52, 1, 'G4'], [53, 0.75, 'Ds4'], [53.75, 0.25, 'As4'], [54, 2, 'G4']
  ].forEach(([beat, dur, note], index) => addMelody(beat, dur, note, Math.min(1, 0.68 + index * 0.006)));

  return events.sort((a, b) => a.beat - b.beat);
}

export function createNoirOrbitCycle(cycleStart = 0) {
  const events = [];
  [['D2', 'A2', 'F3', 'C4'], ['F2', 'C3', 'Gs3', 'Ds4'], ['A1', 'E2', 'G3', 'C4'], ['G1', 'D2', 'F3', 'B3']]
    .forEach((chord, index) => {
      chord.forEach((note) => events.push({ beat: cycleStart + index * 12, dur: 12, note, type: 'bg', vel: 0.42 + index * 0.04 }));
    });
  ['A4', 'C5', 'D5', 'F5', 'E5', 'C5'].forEach((note, index) => {
    events.push({ beat: cycleStart + 6 + index * 6, dur: 3.4, note, type: 'ost', vel: 0.35, pan: -0.36 + index * 0.14 });
  });
  return events.sort((a, b) => a.beat - b.beat);
}

export function createOrganHorizonCycle(cycleStart = 0) {
  const events = [];
  const chords = [
    ['D2', 'A2', 'D3', 'F3', 'A3'],
    ['A1', 'E2', 'A2', 'C3', 'E3'],
    ['B1', 'Fs2', 'B2', 'D3', 'Fs3'],
    ['G1', 'D2', 'G2', 'B2', 'D3'],
    ['D2', 'A2', 'D3', 'F3', 'A3'],
    ['C2', 'G2', 'C3', 'E3', 'G3']
  ];
  chords.forEach((chord, chordIndex) => {
    const beat = chordIndex * 16;
    chord.forEach((note, noteIndex) => {
      events.push({
        beat: cycleStart + beat,
        dur: 18,
        note,
        type: noteIndex < 2 ? 'bass' : 'bg',
        vel: 0.42 + chordIndex * 0.035,
        pan: -0.22 + noteIndex * 0.11
      });
    });
  });
  [
    [8, 'A4'], [12, 'E5'], [18, 'D5'], [24, 'A4'], [32, 'B4'], [36, 'Fs5'],
    [44, 'D5'], [52, 'G4'], [60, 'B4'], [68, 'A4'], [76, 'E5'], [84, 'D5']
  ].forEach(([beat, note], index) => {
    events.push({
      beat: cycleStart + beat,
      dur: index % 3 === 1 ? 5.5 : 4,
      note,
      type: 'ost',
      vel: 0.32 + index * 0.032,
      pan: index % 2 ? 0.18 : -0.18
    });
  });
  return events.sort((a, b) => a.beat - b.beat);
}
