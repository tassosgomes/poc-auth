import type { ReactNode } from 'react';

type Tone = 'neutral' | 'warning' | 'danger';

interface ActionLink {
  href: string;
  label: string;
}

interface ActionButton {
  label: string;
  onClick: () => void;
}

interface FeedbackPanelProps {
  eyebrow: string;
  title: string;
  message: string;
  tone?: Tone;
  traceId?: string;
  details?: ReactNode;
  linkAction?: ActionLink;
  buttonAction?: ActionButton;
}

export function FeedbackPanel({
  eyebrow,
  title,
  message,
  tone = 'neutral',
  traceId,
  details,
  linkAction,
  buttonAction
}: FeedbackPanelProps): JSX.Element {
  return (
    <section className={`feedback-panel feedback-panel--${tone}`} aria-live="polite">
      <p className="feedback-panel__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="feedback-panel__message">{message}</p>
      {details ? <div className="feedback-panel__details">{details}</div> : null}
      {traceId ? <p className="feedback-panel__trace">TraceId: {traceId}</p> : null}
      <div className="feedback-panel__actions">
        {linkAction ? (
          <a className="button button--primary" href={linkAction.href}>
            {linkAction.label}
          </a>
        ) : null}
        {buttonAction ? (
          <button className="button button--secondary" type="button" onClick={buttonAction.onClick}>
            {buttonAction.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}