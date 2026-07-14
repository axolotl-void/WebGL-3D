import React, { useEffect, useRef, useState } from 'react';
import './Zone3Overlay.css';

const PROJECTS_DATA = [
  {
    id: '01',
    title: 'PROJECT ZENITH',
    category: 'THREE.JS / GLSL SHADERS',
    desc: 'An interactive 3D cosmic simulator featuring custom gravitational pull physics, dynamic volumetric nebulae, and high-performance post-processing bloom layers.',
    tech: ['THREE.JS', 'WEBGL', 'GLSL', 'GSAP'],
    status: 'ACTIVE / STABLE',
    year: '2025'
  },
  {
    id: '02',
    title: 'AETHER ENGINE',
    category: 'REACT THREE FIBER / PHYSICS',
    desc: 'A robust 3D sandbox engine optimized for react ecosystem, integrating rigid-body physics, real-time collision dynamics, and low-latency rendering pipelines.',
    tech: ['R3F', 'RAPIER PHYSICS', 'REACT', 'THREE.JS'],
    status: 'OPTIMIZED',
    year: '2025'
  },
  {
    id: '03',
    title: 'CHRONOS HUD',
    category: 'SCROLL CHOREOGRAPHY',
    desc: 'A fully scroll-linked cyberpunk interactive dashboard built to demonstrate state synchronization between webgl cameras, GSAP, and complex DOM components.',
    tech: ['GSAP', 'HTML5', 'VANILLA CSS', 'JS'],
    status: 'COMPLETED',
    year: '2024'
  }
];

export default function Zone3Overlay() {
  const rootRef = useRef(null);
  const visibleRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Play click SFX helper
  const playClickSfx = () => {
    if (localStorage.getItem('isSoundOn') !== 'false') {
      new Audio('/models/sound/click-elektrik-1.mp3').play().catch(() => {});
    }
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      
      let ratio = window.scrollY / max;
      if (!window.__isExplored) {
        ratio = Math.min(ratio, 0.6245);
      }

      // Visible in Zone 3 (scroll >= 0.75)
      const isWithinZone3 = ratio >= 0.75;

      if (!visibleRef.current && isWithinZone3) {
        visibleRef.current = true;
        root.classList.add('visible');
      } else if (visibleRef.current && !isWithinZone3) {
        visibleRef.current = false;
        root.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeProject = PROJECTS_DATA[activeIdx];

  return (
    <div className="zone3-overlay" ref={rootRef}>
      <div className="z3-panel">
        {/* Decorative corner brackets */}
        <div className="z3-corner tl" />
        <div className="z3-corner tr" />
        <div className="z3-corner bl" />
        <div className="z3-corner br" />

        {/* Animated scanline and cyber grid overlay */}
        <div className="z3-scanline" />
        <div className="z3-grid-overlay" />

        {/* Minimal Tech Header */}
        <div className="z3-hud-header">
          <div className="z3-hud-header-left">
            <span className="z3-hud-module">03 / PROJECT ARCHIVE</span>
          </div>
          <div className="z3-hud-header-right">
            <span className="z3-hud-slashes">///</span>
            <span className="z3-hud-dots">•••••••</span>
          </div>
        </div>

        {/* Two-Column Split Layout */}
        <div className="z3-content-layout">
          {/* Left Column: Project List */}
          <div className="z3-list-column">
            {PROJECTS_DATA.map((p, idx) => (
              <div
                key={p.id}
                className={`z3-project-item ${activeIdx === idx ? 'active' : ''}`}
                onClick={() => {
                  setActiveIdx(idx);
                  playClickSfx();
                }}
              >
                <div className="z3-item-num">[{p.id}]</div>
                <div className="z3-item-meta">
                  <div className="z3-item-title">{p.title}</div>
                  <div className="z3-item-category">{p.category}</div>
                </div>
                <div className="z3-item-bracket" />
              </div>
            ))}
          </div>

          {/* Right Column: Project Details */}
          <div className="z3-detail-column">
            <div className="z3-detail-header">
              <h2 className="z3-detail-title">{activeProject.title}</h2>
              <div className="z3-detail-category">{activeProject.category}</div>
            </div>

            {/* Spec grid */}
            <div className="z3-spec-grid">
              <div className="z3-spec-box">
                <span className="z3-spec-label">SYSTEM_STATUS</span>
                <span className="z3-spec-value green-text">{activeProject.status}</span>
              </div>
              <div className="z3-spec-box">
                <span className="z3-spec-label">LAUNCH_YEAR</span>
                <span className="z3-spec-value">{activeProject.year}</span>
              </div>
              <div className="z3-spec-box">
                <span className="z3-spec-label">SUBSYSTEM</span>
                <span className="z3-spec-value">03-{activeProject.id}</span>
              </div>
            </div>

            {/* Description */}
            <p className="z3-detail-desc">{activeProject.desc}</p>

            {/* Tech Tags */}
            <div className="z3-tags-row">
              {activeProject.tech.map((tag) => (
                <span key={tag} className="z3-tech-tag">{tag}</span>
              ))}
            </div>

            {/* Action button */}
            <button className="z3-action-btn" onClick={playClickSfx}>
              LAUNCH INTERACTIVE SITE <span className="z3-btn-arrow">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
