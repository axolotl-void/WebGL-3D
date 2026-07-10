import React, { useEffect, useRef } from 'react';
import './Zone2Overlay.css';

// ponytail: scroll thresholds match the Zone 2 explore phase in UnifiedScene.
// Fade in when camera starts cruising Zone 2 (~45%), fade out if scrolled back above ~38%.
const SHOW_RATIO = 0.45;
const HIDE_RATIO = 0.38;

const CUBE_DATA = [
  {
    icon: '👤',
    num: '01',
    title: 'IDENTITY',
    items: ['PROFILE', 'DEVELOPER', 'INDONESIA'],
  },
  {
    icon: '🎓',
    num: '02',
    title: 'EDUCATION',
    items: ['COMPUTER SCIENCE', 'UBBG', '2022 — PRESENT'],
  },
  {
    icon: '⟨/⟩',
    num: '03',
    title: 'SKILLS',
    items: ['REACT', 'NEXT.JS', 'WEBGL'],
  },
  {
    icon: '🏆',
    num: '04',
    title: 'ACHIEVEMENTS',
    items: ['CERTIFICATES', 'AWARDS', 'ARCHIVE'],
  },
];

export default function Zone2Overlay() {
  const rootRef = useRef(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const ratio = window.scrollY / max;

      // ponytail: simple hysteresis to avoid flicker at the threshold boundary
      if (!visibleRef.current && ratio >= SHOW_RATIO) {
        visibleRef.current = true;
        root.classList.add('visible');
      } else if (visibleRef.current && ratio < HIDE_RATIO) {
        visibleRef.current = false;
        root.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="zone2-overlay" ref={rootRef}>
      {/* ═══════ LEFT PANEL ═══════ */}
      <div className="z2-left-panel">
        <div className="z2-panel-track" />
        <div className="z2-panel-header">
          <span className="z2-panel-label">02 / ABOUT</span>
          <span className="z2-panel-deco">/ / / / /</span>
        </div>
        <div className="z2-panel-title">
          <span className="z2-panel-title-white">DIGITAL</span>
          <span className="z2-panel-title-cyan">PROFILE</span>
        </div>
        <p className="z2-panel-desc">
          Identity, education, skills,<br />
          and achievements archive.
        </p>
        <button className="z2-explore-btn">
          EXPLORE
          <span className="z2-explore-arrow">→</span>
        </button>
      </div>

      {/* ═══════ CUBE LABELS ═══════ */}
      <div className="z2-cube-labels">
        {CUBE_DATA.map((cube) => (
          <div className="z2-cube-label" key={cube.num}>
            <span className="z2-label-icon">{cube.icon}</span>
            <span className="z2-label-num">{cube.num}</span>
            <span className="z2-label-title">{cube.title}</span>
            <div className="z2-label-items">
              {cube.items.map((item) => (
                <span className="z2-label-item" key={item}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
