import { useEffect, useState } from 'react';

import DrumMachine from './homeworks/DrumMachine/DrumMachine';
import GrandPiano88 from './homeworks/GrandPiano88/GrandPiano88';
import KraftonPubgVnArena from './homeworks/KraftonPubgVnArena/KraftonPubgVnArena';

import './App.css';

const SITE_TITLE = 'Lab 03 · React 19 Studio';

// Only ONE homework is mounted at a time, so their global
// keyboard listeners (both use KeyW, KeyA, ...) never conflict.
const HOMEWORKS = [
  { id: 'drum', label: 'HW1 · Drum Kit', Component: DrumMachine },
  { id: 'piano', label: 'HW2 · Grand Piano 88', Component: GrandPiano88 },
  { id: 'pubg', label: 'HW3 · PUBG VN Arena', Component: KraftonPubgVnArena },
];

function App() {
  const [activeId, setActiveId] = useState(HOMEWORKS[0].id);

  const activeHomework = HOMEWORKS.find(
    (homework) => homework.id === activeId,
  );
  const ActiveHomework = activeHomework.Component;

  // WCAG 2.4.2 Page Titled: the tab title names the current homework.
  useEffect(() => {
    document.title = `${activeHomework.label} | ${SITE_TITLE}`;
  }, [activeHomework.label]);

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
