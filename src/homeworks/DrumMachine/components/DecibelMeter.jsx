import { useEffect, useState } from 'react';

import './DecibelMeter.css';

const MIN_DBFS = -60;
const MAX_DBFS = 0;
const UPDATE_INTERVAL = 100;

function DecibelMeter({ audioEngine }) {
  const [levelDbfs, setLevelDbfs] = useState(MIN_DBFS);

  useEffect(() => {
    let animationFrameId;
    let lastUpdate = 0;

    const updateLevel = (timestamp) => {
      if (timestamp - lastUpdate >= UPDATE_INTERVAL) {
        const rms = audioEngine.getAudioLevel();

        const dbfs =
          rms > 0
            ? 20 * Math.log10(rms)
            : MIN_DBFS;

        const clampedDbfs = Math.max(
          MIN_DBFS,
          Math.min(MAX_DBFS, dbfs),
        );

        setLevelDbfs(clampedDbfs);
        lastUpdate = timestamp;
      }

      animationFrameId = requestAnimationFrame(updateLevel);
    };

    animationFrameId = requestAnimationFrame(updateLevel);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioEngine]);

  const percentage =
    ((levelDbfs - MIN_DBFS) / (MAX_DBFS - MIN_DBFS)) * 100;

  return (
    <section
      className="decibel-meter"
      aria-labelledby="decibel-meter-heading"
    >
      <div className="decibel-meter__header">
        <h2 id="decibel-meter-heading">Audio Level</h2>

        <output className="decibel-meter__value">
          {Math.round(levelDbfs)} dBFS
        </output>
      </div>

      <div
        className="decibel-meter__track"
        role="meter"
        aria-label="Relative audio level"
        aria-valuemin={MIN_DBFS}
        aria-valuemax={MAX_DBFS}
        aria-valuenow={Math.round(levelDbfs)}
      >
        <div
          className="decibel-meter__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="decibel-meter__scale">
        <span>-60 dBFS</span>
        <span>-30 dBFS</span>
        <span>0 dBFS</span>
      </div>

      <p className="decibel-meter__description">
        Displays the relative audio signal level in real time.
      </p>
    </section>
  );
}

export default DecibelMeter;