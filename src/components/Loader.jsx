import React, { useEffect, useState } from 'react';
import './Loader.css';

const PHASES = ['dom', 'fonts', 'canvas', 'assets', 'intro'];

export default function Loader({ fontsReady, canvasReady, assetsReady, introReady }) {
  const reached = {
    dom: true,
    fonts: fontsReady,
    canvas: canvasReady,
    assets: assetsReady,
    intro: introReady,
  };
  const completedCount = PHASES.filter((p) => reached[p]).length;
  const allReady = completedCount === PHASES.length;

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isReturn, setIsReturn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('porto-visited') === '1') {
      setIsReturn(true);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
    const minTimer = setTimeout(() => setMinTimeElapsed(true), 600);
    return () => clearTimeout(minTimer);
  }, []);

  useEffect(() => {
    if (!isReturn && allReady && minTimeElapsed) {
      try {
        localStorage.setItem('porto-visited', '1');
      } catch (e) {
        // localStorage disabled (private mode / quota) — silent no-op
      }
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [allReady, minTimeElapsed, isReturn]);

  if (!visible) return null;

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hidden progressbar for screen readers only — no visible UI per user direction
  // (cukup desain animasi UI yang ada di file html itu saja).
  return (
    <div className="loader-root" aria-live="polite" aria-busy={!allReady}>
      {!reduceMotion && !isReturn && (
        <iframe
          className="loader-iframe"
          src="/models/loadingawal-masukweb.html"
          title="Loading animation"
          aria-hidden="true"
          tabIndex={-1}
          sandbox="allow-same-origin allow-scripts"
        />
      )}
      <div
        className="loader-progressbar-sr"
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={PHASES.length}
        aria-label="Loading progress"
      >
        {completedCount} of {PHASES.length} phases loaded
      </div>
    </div>
  );
}
