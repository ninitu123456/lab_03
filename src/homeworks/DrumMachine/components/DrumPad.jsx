
import './DrumPad.css';

function DrumPad({ pad, isActive, onTrigger }) {
  return (
    <button
      type="button"
      className={`drum-pad ${isActive ? 'active' : ''}`}
      aria-pressed={isActive}
      aria-label={`${pad.name}, keyboard shortcut ${pad.keyLabel}`}
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
