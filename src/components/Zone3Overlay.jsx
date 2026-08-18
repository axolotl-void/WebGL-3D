import React, { useEffect, useRef, useState } from 'react';
import './Zone3Overlay.css';

// ponytail: 4 kontak, masing-masing terikat ke index LOGOS 3D; logo_id menunjuk
// idx di ParticleLogo.LOGOS (0=axolotl, 1=wa, 2=ig, 3=gmail). Urutan: GITHUB
// dulu (chip 01) supaya saat masuk Zone 3 yang pertama dilihat = GitHub card.
const CONTACTS_DATA = [
  {
    id: '01',
    name: 'GITHUB',
    short: 'GITHUB',
    type: 'CODE REPOSITORY',
    handle: '@axolotl-void',
    desc: 'Semua source code & open-source project — jelajahi, fork, kontribusi.',
    tags: ['REPO', 'OPEN SOURCE', 'PORTFOLIO'],
    logo: 0,
    href: 'https://github.com/axolotl-void',
    priority: 'KODE',
    response: '≤ 24 JAM',
    accent: '#00d2ff',
    btn: 'LIHAT GITHUB'
  },
  {
    id: '02',
    name: 'WHATSAPP',
    short: 'WA',
    type: 'INSTANT MESSAGING',
    handle: '+62 812-6031-2799',
    desc: 'Channel utama — fast response untuk diskusi proyek, kolaborasi, atau tawaran kerja.',
    tags: ['CHAT', 'CALL', '24/7'],
    logo: 1,
    href: 'https://wa.me/6281260312799',
    priority: 'PRIMER',
    response: '< 1 JAM',
    accent: '#25D366',
    btn: 'CHAT DI WHATSAPP'
  },
  {
    id: '03',
    name: 'GMAIL',
    short: 'GMAIL',
    type: 'E-MAIL / SURAT RESMI',
    handle: 'yogiprasetya907@gmail.com',
    desc: 'Keperluan resmi: lamaran, dokumen, atau undangan — dijawab maksimal 1×24 jam.',
    tags: ['EMAIL', 'PORTFOLIO', 'FORMAL'],
    logo: 3,
    href: 'mailto:yogiprasetya907@gmail.com',
    priority: 'FORMAL',
    response: '1–24 JAM',
    accent: '#D44638',
    btn: 'KIRIM E-MAIL'
  },
  {
    id: '04',
    name: 'INSTAGRAM',
    short: 'IG',
    type: 'SOCIAL MEDIA',
    handle: '@gik_prasetya',
    desc: 'Sosial & update keseharian — DM terbuka untuk kenalan dan networking.',
    tags: ['DM', 'SOCIAL', 'UPDATES'],
    logo: 2,
    href: 'https://www.instagram.com/gik_prasetya/',
    priority: 'SOSIAL',
    response: '24–48 JAM',
    accent: '#E4405F',
    btn: 'BUKA INSTAGRAM'
  }
];

// 5 proyek asli (Rancangan 11) — ditampilkan saat mode 'project'.
const PROJECTS_DATA = [
  {
    id: '01',
    title: 'AXOLOTL VOID',
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
  const visibleRef = useRef(false);
  const [mode, setMode] = useState('contact');
  const [activeIdx, setActiveIdx] = useState(0);

  const playClickSfx = () => {
    if (localStorage.getItem('isSoundOn') !== 'false') {
      new Audio('/models/sound/click-elektrik-1.mp3').play().catch(() => {});
    }
  };

  // ponytail: chip + arrows both call goTo(idx) so HUD card and 3D logo stay in sync
  const goTo = (idx) => {
    const list = mode === 'project' ? PROJECTS_DATA : CONTACTS_DATA;
    const next = (idx + list.length) % list.length;
    setActiveIdx(next);
    if (mode === 'contact') {
      window.__activeLogo = CONTACTS_DATA[next].logo;
    }
    playClickSfx();
  };

  // Mode switching is owned by UnifiedScene (fires 'zone-mode-change' in response
  // to 'project-click'/'contact-click'). The overlay only mirrors that signal.
  useEffect(() => {
    const onModeChange = () => {
      const next = window.__zoneMode === 'project' ? 'project' : 'contact';
      setMode(next);
      setActiveIdx(0);
      if (next === 'contact') {
        window.__activeLogo = CONTACTS_DATA[0].logo;
      }
    };
    window.addEventListener('zone-mode-change', onModeChange);
    return () => window.removeEventListener('zone-mode-change', onModeChange);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.__activeLogo === undefined) window.__activeLogo = CONTACTS_DATA[0].logo;

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
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isProject = mode === 'project';
  const active = isProject ? PROJECTS_DATA[activeIdx] : CONTACTS_DATA[activeIdx];

  return (
    <div className="zone3-overlay" ref={rootRef}>
        <div className={`z3-panel ${isProject ? 'z3-panel--project' : ''}`}>
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
              <span className="z3-hud-module">{isProject ? '04 / PROJECT ARCHIVE' : '03 / CONTACT ARRAY'}</span>
            </div>
            <div className="z3-hud-header-right">
              <span className="z3-hud-slashes">///</span>
              <span className="z3-hud-dots">•••••••</span>
            </div>
          </div>

          {/* Selector — contact chips (project mode pakai mission grid) */}
          {!isProject && (
            <div className="z3-chip-row">
              {CONTACTS_DATA.map((c, idx) => (
                <button
                  key={c.id}
                  className={`z3-project-chip ${activeIdx === idx ? 'active' : ''}`}
                  onClick={() => goTo(idx)}
                >
                  [{c.id}] {c.short}
                </button>
              ))}
            </div>
          )}

          {/* Project mode: Big Card + Preview (master-detail) */}
          {isProject && (
            <>
              {/* Nav strip: 5 thumbnail nav */}
              <div className="z3-project-nav-strip">
                {PROJECTS_DATA.map((p, idx) => {
                  const dotColor = {
                    'LIVE': '#00ffaa',
                    'DEPLOYED': '#00d2ff',
                    'IN DEVELOPMENT': '#ffcc00',
                    'COMPLETED': '#a78bfa',
                    'ACTIVE / v2.0': '#10b981',
                  }[p.status] || '#8da4c4';

                  return (
                    <button
                      key={p.id}
                      className={`z3-project-nav-item ${activeIdx === idx ? 'active' : ''}`}
                      onClick={() => goTo(idx)}
                      aria-label={`Select project ${p.title}`}
                    >
                      <span
                        className="z3-pn-dot"
                        style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
                      />
                      <span className="z3-pn-id">[{p.id}]</span>
                      <span className="z3-pn-title">{p.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Master-detail: preview card + detail */}
              <div className="z3-project-master-detail">
                {/* LEFT: Big preview card */}
                <button
                  className="z3-project-preview-card"
                  onClick={() => {
                    playClickSfx();
                    window.open(active.github, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <div className="z3-preview-frame">
                    <div className="z3-preview-placeholder">
                      <span className="z3-preview-icon">
                        {active.id === '01' && '◈'}
                        {active.id === '02' && '◉'}
                        {active.id === '03' && '▣'}
                        {active.id === '04' && '◇'}
                        {active.id === '05' && '◐'}
                      </span>
                    </div>
                    <div className="z3-preview-corner tl" />
                    <div className="z3-preview-corner tr" />
                    <div className="z3-preview-corner bl" />
                    <div className="z3-preview-corner br" />
                    <div className="z3-preview-overlay">
                      <div className="z3-preview-overlay-title">{active.title}</div>
                      <div className="z3-preview-overlay-cta">
                        OPEN GITHUB <span aria-hidden="true">›</span>
                      </div>
                    </div>
                  </div>
                  <div className="z3-preview-meta">
                    <span className="z3-preview-id">[{active.id}]</span>
                    <span className="z3-preview-year">{active.year}</span>
                  </div>
                </button>

                {/* RIGHT: Detail panel */}
                <div className="z3-project-detail">
                  <div className="z3-detail-header">
                    <h2 className="z3-detail-title">{active.title}</h2>
                    <div className="z3-detail-category">{active.category}</div>
                  </div>

                  {/* Spec grid */}
                  <div className="z3-spec-grid">
                    <div className="z3-spec-box">
                      <span className="z3-spec-label">SYSTEM_STATUS</span>
                      <span className="z3-spec-value green-text">{active.status}</span>
                    </div>
                    <div className="z3-spec-box">
                      <span className="z3-spec-label">LAUNCH_YEAR</span>
                      <span className="z3-spec-value">{active.year}</span>
                    </div>
                    <div className="z3-spec-box">
                      <span className="z3-spec-label">SUBSYSTEM</span>
                      <span className="z3-spec-value">03-{active.id}</span>
                    </div>
                  </div>

                  <p className="z3-detail-desc z3-detail-desc-full">{active.desc}</p>

                  <div className="z3-tags-row">
                    {active.tech.map((tag) => (
                      <span key={tag} className="z3-tech-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="z3-project-actions">
                    <button
                      className="z3-action-btn z3-action-btn-primary"
                      onClick={() => {
                        playClickSfx();
                        window.open(active.github, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      VIEW ON GITHUB <span className="z3-btn-arrow">›</span>
                    </button>
                    <button
                      className="z3-action-btn z3-action-btn-secondary"
                      onClick={() => {
                        playClickSfx();
                        navigator.clipboard.writeText(active.github).catch(() => {});
                      }}
                    >
                      COPY LINK
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Contact mode detail card */}
          {!isProject && (
            <div className="z3-detail-card">
              <div className="z3-detail-header">
                <h2 className="z3-detail-title">{active.name}</h2>
                <div className="z3-detail-category">{active.type}</div>
              </div>

              {/* Spec grid */}
              <div className="z3-spec-grid">
                <div className="z3-spec-box">
                  <span className="z3-spec-label">PRIORITY</span>
                  <span className="z3-spec-value green-text">{active.priority}</span>
                </div>
                <div className="z3-spec-box">
                  <span className="z3-spec-label">RESPONSE_T</span>
                  <span className="z3-spec-value">{active.response}</span>
                </div>
                <div className="z3-spec-box">
                  <span className="z3-spec-label">CHANNEL</span>
                  <span className="z3-spec-value accent" style={{ color: active.accent }}>
                    {active.handle}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="z3-detail-desc">{active.desc}</p>

              {/* Tags */}
              <div className="z3-tags-row">
                {active.tags.map((tag) => (
                  <span key={tag} className="z3-tech-tag">{tag}</span>
                ))}
              </div>

              {/* Action button */}
              <button
                className="z3-action-btn"
                onClick={() => {
                  playClickSfx();
                  window.open(active.href, '_blank', 'noopener,noreferrer');
                }}
              >
                {active.btn} <span className="z3-btn-arrow">›</span>
              </button>
            </div>
          )}
        </div>

        {/* Project → archive nav button (bottom-center, contact mode only) */}
        {!isProject && (
          <button
            className="z3-nav-btn"
            onClick={() => {
              playClickSfx();
              window.dispatchEvent(new Event('project-click'));
            }}
          >
            PROJECT <span aria-hidden="true">›</span>
          </button>
        )}

        {/* Back-to-contact nav button (bottom-center, project mode only) */}
        {isProject && (
          <button
            className="z3-nav-btn back"
            onClick={() => {
              playClickSfx();
              window.dispatchEvent(new Event('contact-click'));
            }}
          >
            <span aria-hidden="true">‹</span> CONTACT
          </button>
        )}
      </div>
  );
}
