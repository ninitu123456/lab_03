import { useState } from 'react';

import DrumMachine from './homeworks/DrumMachine/DrumMachine';
import GrandPiano88 from './homeworks/GrandPiano88/GrandPiano88';

import './App.css';

// Only ONE homework is mounted at a time, so their global
// keyboard listeners (both use KeyW, KeyA, ...) never conflict.
const HOMEWORKS = [
  { id: 'drum', label: 'HW1 · Drum Kit', Component: DrumMachine },
  { id: 'piano', label: 'HW2 · Grand Piano 88', Component: GrandPiano88 },
];

function App() {
  const [activeId, setActiveId] = useState(HOMEWORKS[0].id);

  const ActiveHomework = HOMEWORKS.find(
    (homework) => homework.id === activeId,
  ).Component;

  return (
    <>
      <nav className="app-nav" aria-label="Homework">
        <ul className="app-nav__list">
          {HOMEWORKS.map((homework) => (
            <li key={homework.id}>
              <button
                type="button"
                className="app-nav__button"
                aria-pressed={homework.id === activeId}
                onClick={() => setActiveId(homework.id)}
              >
                {homework.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <ActiveHomework />
    </>
  );
}

export default App;
