import React, { useEffect, useRef, useState } from 'react';
import './Zone3Overlay.css';

const PROJECTS_DATA = [
  {
    id: '01',
    title: 'AXOLOTL VOID',
    short: 'AXOLOTL VOID',
    category: 'WEBGL / REACT THREE FIBER',
    desc: 'Immersive WebGL portfolio with scroll-driven 3D scene transitions, custom GLSL portal shaders, and interactive particle-based logo physics.',
    tech: ['R3F', 'THREE.JS', 'GLSL', 'GSAP'],
    status: 'LIVE',
    year: '2026',
    github: 'https://github.com/axolotl-void'
  },
  {
    id: '02',
    title: 'INPETA WEB GIS',
    short: 'INPETA GIS',
    category: 'REACT / LEAFLET / GIS',
    desc: 'Re-engineered Web GIS platform for DISKOMINSA UPTD Statistik Aceh — interactive Leaflet maps, presentation web, and a full REST API backend.',
    tech: ['REACT', 'LEAFLET', 'NODE.JS', 'REST API'],
    status: 'DEPLOYED',
    year: '2025',
    github: 'https://github.com/axolotl-void/Web-InPeta-Fron-end'
  },
  {
    id: '03',
    title: 'SIM-LKPS',
    short: 'SIM-LKPS',
    category: 'NEXT.JS / ENTERPRISE',
    desc: 'Sistem Informasi Manajemen Laporan Kinerja Program Studi UBBG — 31 tabel LKPS BAN-PT, 4 role akses, workflow validasi, upload bukti, dan export laporan.',
    tech: ['NEXT.JS', 'TYPESCRIPT', 'PRISMA', 'POSTGRESQL'],
    status: 'IN DEVELOPMENT',
    year: '2026',
    github: 'https://github.com/axolotl-void/SIM-LKPS'
  },
  {
    id: '04',
    title: 'WISUDA DIGITAL',
    short: 'WISUDA QR',
    category: 'NEXT.JS / REALTIME QR',
    desc: 'Campus graduation invitation validation with QR scanning — realtime attendance via Socket.io, 4 role access, and live attendance statistics.',
    tech: ['NEXT.JS', 'SOCKET.IO', 'PRISMA', 'QR CODE'],
    status: 'COMPLETED',
    year: '2026',
    github: 'https://github.com/axolotl-void/sistem-informasi-wisuda-digital'
  },
  {
    id: '05',
    title: 'LMS LAB 2.0',
    short: 'LMS LAB',
    category: 'FASTAPI / WEBSOCKET / IOT',
    desc: 'Real-time Lab Management System for PC & AC control — FastAPI + WebSocket + SQLite, deployed on Raspberry Pi 4.',
    tech: ['FASTAPI', 'PYTHON', 'WEBSOCKET', 'SQLITE'],
    status: 'ACTIVE / v2.0',
    year: '2026',
    github: 'https://github.com/axolotl-void/LMS--Lab-Management-System-2.0'
  }
];

export default function Zone3Overlay() {
  const rootRef = useRef(null);
  const switchRef = useRef(null);
  const visibleRef = useRef(false);
  const switchVisibleRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeLogo, setActiveLogo] = useState(() => window.__activeLogo ?? 0);

  // Play click SFX helper
  const playClickSfx = () => {
    if (localStorage.getItem('isSoundOn') !== 'false') {
      new Audio('/models/sound/click-elektrik-1.mp3').play().catch(() => {});
    }
  };

  // ponytail: bridge logo visibility between DOM overlay and WebGL scene
  const switchLogo = (dir) => {
    const next = (activeLogo + dir + 2) % 2;
    setActiveLogo(next);
    window.__activeLogo = next;
    playClickSfx();
  };

  useEffect(() => {
    const root = rootRef.current;
    const switchEl = switchRef.current;
    if (!root) return;

    if (window.__activeLogo === undefined) window.__activeLogo = 0;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      
      let ratio = window.scrollY / max;
      if (!window.__isExplored) {
        ratio = Math.min(ratio, 0.6245);
      }

      // Visible in Zone 3 — delayed past 0.85 so the white bling fully clears
      // and the 3D logo is revealed before the HUD panel appears (both used to trigger at 0.75)
      const isWithinZone3 = ratio >= 0.85;

      if (!visibleRef.current && isWithinZone3) {
        visibleRef.current = true;
        root.classList.add('visible');
      } else if (visibleRef.current && !isWithinZone3) {
        visibleRef.current = false;
        root.classList.remove('visible');
      }

      // Logo switcher appears together with the logos (0.75), not the panel (0.85)
      const isZone3 = ratio >= 0.75;
      if (switchEl) {
        if (!switchVisibleRef.current && isZone3) {
          switchVisibleRef.current = true;
          switchEl.classList.add('visible');
        } else if (switchVisibleRef.current && !isZone3) {
          switchVisibleRef.current = false;
          switchEl.classList.remove('visible');
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeProject = PROJECTS_DATA[activeIdx];

  const LOGO_LABELS = ['AXOLOTL', 'WA'];

  return (
    <>
      {/* Logo switcher (‹ ›) */}
      <div className="z3-logo-switch" ref={switchRef}>
        <button
          className="z3-logo-switch-btn"
          onClick={() => switchLogo(-1)}
          aria-label="Previous logo"
        >
          ‹
        </button>
        <span className="z3-logo-switch-label">{LOGO_LABELS[activeLogo]}</span>
        <button
          className="z3-logo-switch-btn"
          onClick={() => switchLogo(1)}
          aria-label="Next logo"
        >
          ›
        </button>
      </div>

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

        {/* Project Selector — 3 horizontal chips */}
        <div className="z3-chip-row">
          {PROJECTS_DATA.map((p, idx) => (
            <button
              key={p.id}
              className={`z3-project-chip ${activeIdx === idx ? 'active' : ''}`}
              onClick={() => {
                setActiveIdx(idx);
                playClickSfx();
              }}
            >
              [{p.id}] {p.short}
            </button>
          ))}
        </div>

        {/* Compact Detail Card */}
        <div className="z3-detail-card">
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
          <button
            className="z3-action-btn"
            onClick={() => {
              playClickSfx();
              window.open(activeProject.github, '_blank', 'noopener,noreferrer');
            }}
          >
            VIEW ON GITHUB <span className="z3-btn-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
