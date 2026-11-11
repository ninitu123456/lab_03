
import './DrumPad.css';

function DrumPad({ pad, isActive, onTrigger }) {
  return (
    <button
      type="button"
      className={`drum-pad ${isActive ? 'active' : ''}`}
      aria-pressed={isActive}
      // WCAG 2.5.3 Label in Name: the accessible name comes from the
      // visible text ("W KICK Bass Drum"); the shortcut is exposed
      // separately instead of overriding the name with aria-label.
      aria-keyshortcuts={pad.keyLabel}
      onClick={() => onTrigger(pad.id)}
    >
      <span className="drum-pad__key">
        {pad.keyLabel}
      </span>

      <span className="drum-pad__name">
        {pad.name}
      </span>

      <span className="drum-pad__description">
        {pad.description}
      </span>
    </button>
  );
}

export default DrumPad;
