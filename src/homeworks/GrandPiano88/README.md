
# Grand Piano 88 – Homework 2

## 1. Overview

Grand Piano 88 is a React-based polyphonic piano application developed for Lab 03.

The application combines algorithmic MIDI note generation, Web Audio API synthesis, React rendering optimization, and asynchronous FIFO sequencing.

## 2. Core Requirements

- Generate 88 piano keys from A0 to C8.
- Generate exactly 52 white keys and 36 black keys.
- Calculate note frequencies using the equal-tempered tuning formula.
- Support up to 8 simultaneous audio voices.
- Implement FIFO voice stealing when the voice limit is exceeded.
- Apply ADSR envelopes to audio voices.
- Use React.memo to isolate PianoKey rendering.
- Record and replay piano performances.
- Support playback speeds of 0.5x, 1x, and 2x.
- Cancel pending playback using AbortController.

## 3. Project Structure

```text
GrandPiano88/
├── data/
├── audio/
├── hooks/
├── components/
├── sequencer/
└── README.md
```

## 4. Implementation Architecture

| Module | Responsibility |
|---|---|
| data | MIDI notes, key generation, frequency utilities |
| audio | Polyphonic synthesizer and ADSR envelope |
| hooks | React state and interaction management |
| components | Piano keyboard and individual piano keys |
| sequencer | Recording, FIFO playback, cancellation |

## 5. Development Principles

- Use reusable and modular JavaScript code.
- Avoid manually hardcoding all 88 piano keys.
- Keep audio resource management separate from UI components.
- Use stable props and React.memo for rendering optimization.
- Validate functionality through automated tests.
- Clean up audio resources and asynchronous tasks appropriately.
