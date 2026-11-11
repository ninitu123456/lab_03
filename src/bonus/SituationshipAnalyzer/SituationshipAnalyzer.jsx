import { useId, useReducer, useState } from 'react';

import { useGhostingTimer } from './hooks/useGhostingTimer';
import {
  ACTORS,
  appendSignal,
  createEffortSignal,
  getRedFlag,
  summarizeEffort,
} from './model/effortSignals';
import { createMockPartner } from './model/mockPartner';
import {
  EVENTS,
  INITIAL_MACHINE_STATE,
  PHASES,
  TRANSITIONS,
  relationshipReducer,
} from './model/relationshipMachine';

import './SituationshipAnalyzer.css';

const PHASE_LABELS = Object.freeze({
  [PHASES.FRIENDS]: 'Bạn bè',
  [PHASES.DATING_NO_LOVE]: 'Hẹn hò nhưng không yêu',
  [PHASES.OFFICIAL_LOVE]: 'Yêu chính thức',
  [PHASES.GHOSTED_EXIT]: 'Đã dừng lại',
});

const ACTION_LABELS = Object.freeze({
  [EVENTS.START_DATING]: 'Bắt đầu hẹn hò',
  [EVENTS.MUTUAL_COMMITMENT]: 'Xác nhận yêu thật',
  [EVENTS.STOP]: 'Dừng lại (giải phóng bộ nhớ)',
  [EVENTS.BREAK_UP]: 'Chia tay',
  [EVENTS.RESET]: 'Làm lại từ đầu',
});

// The timeout is not a button: it only happens when nobody replies.
const USER_EVENTS = new Set(Object.keys(ACTION_LABELS));

const EMPTY_LOG = Object.freeze([]);

function parseSteps(value) {
  const steps = Number(value);
  return Number.isInteger(steps) && steps >= 1 && steps <= 1000 ? steps : null;
}

export function SituationshipAnalyzer({ partner: injectedPartner }) {
  const emStepsId = useId();
  const rivalStepsId = useId();
  const messageId = useId();
  const stepsHintId = useId();

  const [partner] = useState(() => injectedPartner ?? createMockPartner());
  const [machine, dispatch] = useReducer(relationshipReducer, INITIAL_MACHINE_STATE);
  const [signals, setSignals] = useState(EMPTY_LOG);
  const [emSteps, setEmSteps] = useState('100');
  const [rivalSteps, setRivalSteps] = useState('1');
  const [draft, setDraft] = useState('');
  const [pendingMessage, setPendingMessage] = useState(null);
  const [chatStatus, setChatStatus] = useState('');

  const { phase } = machine;

  // ---- Derived state: computed during render, never stored. ----
  const summary = summarizeEffort(signals);
  const verdict = getRedFlag(phase, summary);
  const availableEvents = Object.keys(TRANSITIONS[phase]).filter((event) => USER_EVENTS.has(event));
  const isDating = phase === PHASES.DATING_NO_LOVE;
  const maxScore = Math.max(summary.emScore, summary.rivalScore, 1);
  const stepsInvalid = parseSteps(emSteps) === null || parseSteps(rivalSteps) === null;

  // Leaving DATING_NO_LOVE cancels the wait automatically (effect cleanup).
  useGhostingTimer({
    pendingMessage: isDating ? pendingMessage : null,
    waitForReply: partner.waitForReply,
    onReply: (reply) => {
      setPendingMessage(null);
      setSignals((log) => appendSignal(log, createEffortSignal({ actor: ACTORS.AI_DO, steps: 1 })));
      setChatStatus(`Ai đó đã trả lời: "${reply.text}"`);
    },
    onTimeout: () => {
      setPendingMessage(null);
      dispatch({ type: EVENTS.REPLY_TIMEOUT });
      setChatStatus('Seen không rep sau 5 giây. Đã tự động dừng lại.');
    },
  });

  const addEffort = (actor, value) => {
    const steps = parseSteps(value);

    if (steps !== null) {
      setSignals((log) => appendSignal(log, createEffortSignal({ actor, steps })));
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();

    if (!isDating || text === '') {
      return;
    }

    setSignals((log) => appendSignal(log, createEffortSignal({ actor: ACTORS.EM, steps: 1 })));
    setPendingMessage(Object.freeze({ id: crypto.randomUUID(), text }));
    setDraft('');
    setChatStatus(`Đã gửi "${text}". Đã xem… đang chờ trả lời (5 giây).`);
  };

  const runAction = (eventType) => {
    if (eventType === EVENTS.STOP || eventType === EVENTS.RESET) {
      setPendingMessage(null);
      setChatStatus('');
    }

    if (eventType === EVENTS.RESET) {
      setSignals(EMPTY_LOG);
    }

    dispatch({ type: eventType });
  };

  return (
    <article className="situationship" aria-label="Hẹn Hò Nhưng Không Yêu Analyzer" lang="vi">
      <p className="situationship__phase">
        Trạng thái: <strong>{PHASE_LABELS[phase]}</strong>
      </p>

      <output
        className={`situationship__verdict situationship__verdict--${verdict.level.toLowerCase()}`}
        role="status"
        aria-live="polite"
        aria-label="Cảnh báo red-flag"
      >
        {verdict.message}
      </output>

      <section className="situationship__block" aria-labelledby="situationship-effort-heading">
        <h3 id="situationship-effort-heading">Nỗ lực: em cố trăm lần, ai đó một phần</h3>

        <div className="situationship__inputs">
          <p className="situationship__field">
            <label htmlFor={emStepsId}>Em cố bao nhiêu lần (× 0.1)</label>
            <input
              id={emStepsId}
              type="number"
              inputMode="numeric"
              min="1"
              max="1000"
              step="1"
              value={emSteps}
              aria-describedby={stepsHintId}
              aria-invalid={parseSteps(emSteps) === null}
              onChange={(event) => setEmSteps(event.target.value)}
            />
            <button type="button" onClick={() => addEffort(ACTORS.EM, emSteps)}>
              Ghi nỗ lực của em
            </button>
          </p>

          <p className="situationship__field">
            <label htmlFor={rivalStepsId}>Ai đó bao nhiêu phần (× 50)</label>
            <input
              id={rivalStepsId}
              type="number"
              inputMode="numeric"
              min="1"
              max="1000"
              step="1"
              value={rivalSteps}
              aria-describedby={stepsHintId}
              aria-invalid={parseSteps(rivalSteps) === null}
              onChange={(event) => setRivalSteps(event.target.value)}
            />
            <button type="button" onClick={() => addEffort(ACTORS.AI_DO, rivalSteps)}>
              Ghi nỗ lực của ai đó
            </button>
          </p>
        </div>

        <p id={stepsHintId} className={stepsInvalid ? 'situationship__hint situationship__hint--error' : 'situationship__hint'}>
          Nhập số nguyên từ 1 đến 1000.
        </p>

        <dl className="situationship__scores">
          <div>
            <dt>Em: {summary.emSteps} lần</dt>
            <dd>
              {summary.emScore} điểm
              <span className="situationship__bar" aria-hidden="true">
                <span style={{ width: `${(summary.emScore / maxScore) * 100}%` }} />
              </span>
            </dd>
          </div>
          <div>
            <dt>Ai đó: {summary.rivalSteps} phần</dt>
            <dd>
              {summary.rivalScore} điểm
              <span className="situationship__bar situationship__bar--rival" aria-hidden="true">
                <span style={{ width: `${(summary.rivalScore / maxScore) * 100}%` }} />
              </span>
            </dd>
          </div>
        </dl>

        <p className="situationship__log">Nhật ký: {signals.length} tín hiệu (bất biến)</p>
      </section>

      <section className="situationship__block" aria-labelledby="situationship-chat-heading">
        <h3 id="situationship-chat-heading">Nhắn tin</h3>

        <form className="situationship__chat" onSubmit={sendMessage}>
          <label htmlFor={messageId}>Tin nhắn</label>
          <input
            id={messageId}
            type="text"
            value={draft}
            maxLength={120}
            autoComplete="off"
            disabled={!isDating}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" aria-disabled={!isDating || draft.trim() === ''}>
            Gửi
          </button>
        </form>

        <output className="situationship__chat-status" aria-live="polite" aria-label="Trạng thái tin nhắn">
          {chatStatus}
        </output>
      </section>

      <section className="situationship__block" aria-labelledby="situationship-actions-heading">
        <h3 id="situationship-actions-heading">Bước tiếp theo</h3>

        <ul className="situationship__actions">
          {availableEvents.map((eventType) => (
            <li key={eventType}>
              <button type="button" onClick={() => runAction(eventType)}>
                {ACTION_LABELS[eventType]}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
