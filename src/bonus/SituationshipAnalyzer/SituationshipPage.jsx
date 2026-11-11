import { SituationshipAnalyzer } from './SituationshipAnalyzer';

import './SituationshipPage.css';

function SituationshipPage() {
  return (
    <main className="situationship-page">
      <header className="situationship-page__header">
        <p className="situationship-page__eyebrow">BONUS · VPOP FSM</p>
        <h1 lang="vi">Hẹn Hò Nhưng Không Yêu</h1>
        <p className="situationship-page__subtitle">
          A finite state machine instead of boolean soup, asymmetric effort as
          derived state, and a leak-free &quot;seen, no reply&quot; timer.
        </p>
      </header>

      <section className="situationship-page__panel" aria-labelledby="situationship-heading">
        <h2 id="situationship-heading">Situationship Analyzer</h2>
        <SituationshipAnalyzer />
      </section>
    </main>
  );
}

export default SituationshipPage;
