// src/homeworks/DrumMachine/data/drumPads.js

// 1. Define all drum pad configurations.
export const DRUM_PADS = Object.freeze([
  {
    id: 'kick',
    name: 'KICK',
    keyLabel: 'W',
    code: 'KeyW',
    soundType: 'kick',
    description: 'Bass Drum',
  },
  {
    id: 'snare',
    name: 'SNARE',
    keyLabel: 'A',
    code: 'KeyA',
    soundType: 'snare',
    description: 'Snare Drum',
  },
  {
    id: 'closed-hat',
    name: 'CLOSED HAT',
    keyLabel: 'S',
    code: 'KeyS',
    soundType: 'closed-hat',
    description: 'Closed Hi-Hat',
  },
  {
    id: 'open-hat',
    name: 'OPEN HAT',
    keyLabel: 'D',
    code: 'KeyD',
    soundType: 'open-hat',
    description: 'Open Hi-Hat',
  },
  {
    id: 'low-tom',
    name: 'LOW TOM',
    keyLabel: 'J',
    code: 'KeyJ',
    soundType: 'low-tom',
    description: 'Low Tom',
  },
  {
    id: 'crash',
    name: 'CRASH',
    keyLabel: 'K',
    code: 'KeyK',
    soundType: 'crash',
    description: 'Crash Cymbal',
  },
  {
    id: 'ride',
    name: 'RIDE',
    keyLabel: 'L',
    code: 'KeyL',
    soundType: 'ride',
    description: 'Ride Cymbal',
  },
]);

// 2. Create a lookup Map for physical keyboard codes.
export const DRUM_PAD_MAP = new Map(
  DRUM_PADS.map((pad) => [pad.code, pad]),
);

// 3. Find a drum pad by its ID.
export function getDrumPadById(id) {
  return DRUM_PADS.find((pad) => pad.id === id);
}