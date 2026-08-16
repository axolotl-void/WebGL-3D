import React, { useEffect, useRef, useState } from 'react';
import './Zone3Overlay.css';

// ponytail: 4 kontak, masing-masing terikat ke index LOGOS 3D, urutan = wa.me andr |
// git push; logo_id menunjuk idx di ParticleLogo.LOGOS (0=axolotl, 1=wa, 2=ig, 3=gmail).
const CONTACTS_DATA = [
  {
    id: '01',
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
    id: '02',
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
    id: '03',
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
  },
  {
    id: '04',
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
  }
];

export default function Zone3Overlay() {
  const rootRef = useRef(null);
  const visibleRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const playClickSfx = () => {
    if (localStorage.getItem('isSoundOn') !== 'false') {
      new Audio('/models/sound/click-elektrik-1.mp3').play().catch(() => {});
    }
  };

  // ponytail: chip + arrows both call goTo(idx) so HUD card and 3D logo stay in sync
  const goTo = (idx) => {
    const next = (idx + CONTACTS_DATA.length) % CONTACTS_DATA.length;
    setActiveIdx(next);
    window.__activeLogo = CONTACTS_DATA[next].logo;
    playClickSfx();
  };

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

  const activeContact = CONTACTS_DATA[activeIdx];

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
              <span className="z3-hud-module">03 / CONTACT ARRAY</span>
            </div>
            <div className="z3-hud-header-right">
              <span className="z3-hud-slashes">///</span>
              <span className="z3-hud-dots">•••••••</span>
            </div>
          </div>

          {/* Contact Selector — 4 horizontal chips */}
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

          {/* Compact Detail Card */}
          <div className="z3-detail-card">
            <div className="z3-detail-header">
              <h2 className="z3-detail-title">{activeContact.name}</h2>
              <div className="z3-detail-category">{activeContact.type}</div>
            </div>

            {/* Spec grid */}
            <div className="z3-spec-grid">
              <div className="z3-spec-box">
                <span className="z3-spec-label">PRIORITY</span>
                <span className="z3-spec-value green-text">{activeContact.priority}</span>
              </div>
              <div className="z3-spec-box">
                <span className="z3-spec-label">RESPONSE_T</span>
                <span className="z3-spec-value">{activeContact.response}</span>
              </div>
              <div className="z3-spec-box">
                <span className="z3-spec-label">CHANNEL</span>
                <span className="z3-spec-value accent" style={{ color: activeContact.accent }}>
                  {activeContact.handle}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="z3-detail-desc">{activeContact.desc}</p>

            {/* Tags */}
            <div className="z3-tags-row">
              {activeContact.tags.map((tag) => (
                <span key={tag} className="z3-tech-tag">{tag}</span>
              ))}
            </div>

            {/* Action button */}
            <button
              className="z3-action-btn"
              onClick={() => {
                playClickSfx();
                window.open(activeContact.href, '_blank', 'noopener,noreferrer');
              }}
            >
              {activeContact.btn} <span className="z3-btn-arrow">›</span>
            </button>
          </div>
        </div>
      </div>
  );
}
