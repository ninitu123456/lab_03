
import DrumPad from './DrumPad';
import './DrumPadGrid.css';

function DrumPadGrid({
  pads,
  pressedPadIds,
  activePadId,
  onTrigger,
}) {
  return (
    <div className="drum-pad-grid">
      {pads.map((pad) => (
        <DrumPad
          key={pad.id}
          pad={pad}
          isActive={
            pressedPadIds.has(pad.id) ||
            activePadId === pad.id
          }
          onTrigger={onTrigger}
        />
      ))}
    </div>
  );
}

export default DrumPadGrid;
