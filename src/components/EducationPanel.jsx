import { useState, useEffect, useCallback } from 'react';
import './IdentityPanel.css';

// ponytail: reuses IdentityPanel.css styles. Listens for cube-click index 2 (Education)
const CLOSE_DURATION = 400;

export default function EducationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    if (localStorage.getItem('isSoundOn') !== 'false') {
      new Audio('/models/sound/click-keluar.mp3').play().catch(() => {});
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, CLOSE_DURATION);
  }, [isClosing]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 2) setIsOpen(true);
    };
    window.addEventListener('cube-click', handler);
    return () => window.removeEventListener('cube-click', handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className={`id-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`id-panel ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="id-corner tl" />
        <div className="id-corner tr" />
        <div className="id-corner bl" />
        <div className="id-corner br" />

        <div className="id-scanline" />
        <div className="id-grid-overlay" />

        <button className="id-close" onClick={handleClose}>✕</button>

        {/* Minimal Tech Header */}
        <div className="id-hud-header">
          <div className="id-hud-header-left">
            <span className="id-hud-module">02 / EDUCATION MODULE</span>
          </div>
          <div className="id-hud-header-right">
            <span className="id-hud-slashes">///</span>
            <span className="id-hud-dots">•••••••</span>
          </div>
        </div>

        {/* Large Title */}
        <h2 className="edu-large-title">EDUCATION</h2>

        {/* Main Content Area */}
        <div className="id-content edu-user-layout">
          
          {/* Left Column: Campus Building Image */}
          <div className="edu-campus-column">
            <div className="edu-building-frame">
              <div className="edu-building-corner tl" />
              <div className="edu-building-corner tr" />
              <div className="edu-building-corner bl" />
              <div className="edu-building-corner br" />
              <img src="/models/img/gedung-ubbg.webp" alt="UBBG Campus" className="edu-building-image" />
            </div>
          </div>

          {/* Right Column: University details & map */}
          <div className="edu-details-column">
            {/* University Title Box */}
            <div className="edu-univ-card">
              <img src="/models/img/Logo-UBBG.svg" alt="UBBG Logo" className="edu-univ-logo" />
              <div className="edu-univ-info">
                <h3 className="edu-univ-name">UNIVERSITAS BINA BANGSA GETSEMPENA</h3>
                <h4 className="edu-univ-location">BANDA ACEH</h4>
                <p className="edu-univ-motto">Shaping the Future, Inspiring Innovation</p>
              </div>
            </div>

            {/* Address Box & Blueprint Map */}
            <div className="edu-address-map-container">
              <div className="edu-address-box">
                <div className="edu-address-title-wrapper">
                  <svg className="edu-addr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="edu-address-title">CAMPUS ADDRESS</span>
                </div>
                <div className="edu-address-text">
                  <p>Jl. Tanggul Krueng Lamnyong No.34</p>
                  <p>Dusun Lam Ara III, Desa Rukoh</p>
                  <p>Kec. Syiah Kuala, Kota Banda Aceh</p>
                  <p>Provinsi Aceh, Indonesia</p>
                  <p>23112</p>
                </div>
              </div>

              {/* Map Blueprint HUD */}
              <a 
                href="https://www.google.com/maps/dir//Universitas+Bina+Bangsa+Getsempena+(Kampus+A),+Jl.+Tanggul+Krueng+Lamnyong+No.34,+Rukoh,+Kec.+Syiah+Kuala,+Kota+Banda+Aceh,+Aceh+23112/@5.5689141,95.3625526,3876m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3040374a01f1ab6b:0xc38884c42aae7a65!2m2!1d95.3578907!2d5.5802278?entry=ttu&g_ep=EgoyMDI2MDcwOC4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="edu-map-blueprint"
                onClick={() => {
                  if (localStorage.getItem('isSoundOn') !== 'false') {
                    new Audio('/models/sound/click-elektrik-1.mp3').play().catch(() => {});
                  }
                }}
              >
                <div className="edu-map-radar">
                  <div className="edu-map-circle outer" />
                  <div className="edu-map-circle inner" />
                  <div className="edu-map-crosshair-v" />
                  <div className="edu-map-crosshair-h" />
                </div>
                <svg className="edu-map-grid" viewBox="0 0 150 90" fill="none" stroke="#00d2ff" strokeWidth="0.6">
                  {/* Horizontal perspective lines */}
                  <line x1="0" y1="20" x2="150" y2="20" strokeOpacity="0.2" />
                  <line x1="0" y1="35" x2="150" y2="35" strokeOpacity="0.3" />
                  <line x1="0" y1="50" x2="150" y2="50" strokeOpacity="0.45" />
                  <line x1="0" y1="65" x2="150" y2="65" strokeOpacity="0.6" />
                  <line x1="0" y1="80" x2="150" y2="80" strokeOpacity="0.75" />
                  
                  {/* Perspective grid lines converging to center/top */}
                  <line x1="75" y1="5" x2="5" y2="90" strokeOpacity="0.35" />
                  <line x1="75" y1="5" x2="32" y2="90" strokeOpacity="0.45" />
                  <line x1="75" y1="5" x2="60" y2="90" strokeOpacity="0.55" />
                  <line x1="75" y1="5" x2="90" y2="90" strokeOpacity="0.55" />
                  <line x1="75" y1="5" x2="118" y2="90" strokeOpacity="0.45" />
                  <line x1="75" y1="5" x2="145" y2="90" strokeOpacity="0.35" />
                  
                  {/* Concentric rings in perspective (ellipses) */}
                  <ellipse cx="75" cy="50" rx="55" ry="22" strokeOpacity="0.3" />
                  <ellipse cx="75" cy="50" rx="35" ry="14" strokeOpacity="0.45" />
                  <ellipse cx="75" cy="50" rx="15" ry="6" strokeOpacity="0.7" />
                  
                  {/* Corner marks */}
                  <path d="M 6,6 L 16,6 M 6,6 L 6,16" strokeOpacity="0.5" />
                  <path d="M 144,6 L 134,6 M 144,6 L 144,16" strokeOpacity="0.5" />
                  <path d="M 6,84 L 16,84 M 6,84 L 6,74" strokeOpacity="0.5" />
                  <path d="M 144,84 L 134,84 M 144,84 L 144,74" strokeOpacity="0.5" />
                </svg>
                <div className="edu-map-pin">
                  <div className="edu-pin-pulse" />
                  <svg className="edu-pin-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" fill="#39ff14" />
                  </svg>
                </div>
                <div className="edu-map-overlay-text">
                  <span>▸ LAUNCH NAV SYSTEM</span>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Grid Rows */}
        <div className="edu-grid-row">
          
          {/* Col 1: Major */}
          <div className="edu-grid-card">
            <div className="edu-grid-icon-wrapper">
              <svg className="edu-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <div className="edu-grid-card-content">
              <span className="edu-grid-lbl">MAJOR</span>
              <h4 className="edu-grid-val">ILMU KOMPUTER</h4>
              <span className="edu-grid-subval">Computer Science</span>
            </div>
          </div>

          {/* Col 2: Enrollment Year */}
          <div className="edu-grid-card">
            <div className="edu-grid-icon-wrapper">
              <svg className="edu-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="edu-grid-card-content">
              <span className="edu-grid-lbl">ENROLLMENT YEAR</span>
              <h4 className="edu-grid-val">2023</h4>
              <span className="edu-grid-subval">LATING</span>
            </div>
          </div>

          {/* Col 3: Current Status */}
          <div className="edu-grid-card">
            <div className="edu-grid-icon-wrapper">
              <svg className="edu-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="edu-grid-card-content">
              <span className="edu-grid-lbl">CURRENT STATUS</span>
              <h4 className="edu-grid-val">SEMESTER 6</h4>
              <span className="edu-grid-subval">Aktif</span>
            </div>
          </div>

          {/* Col 4: GPA */}
          <div className="edu-grid-card">
            <div className="edu-grid-icon-wrapper">
              <svg className="edu-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="edu-grid-card-content">
              <span className="edu-grid-lbl">GPA</span>
              <h4 className="edu-grid-val">3,67</h4>
              <span className="edu-grid-subval">Sangat Baik</span>
            </div>
          </div>

        </div>

        {/* Footer Quote */}
        <div className="edu-footer-quote-row">
          <div className="edu-quote-slashes-left">//////</div>
          <p className="edu-quote-text">
            <span className="edu-quote-mark">“</span>
            Continuous learning, constant growth, endless possibilities.
            <span className="edu-quote-mark">”</span>
          </p>
          <div className="edu-quote-slashes-right">//////</div>
        </div>

      </div>
    </div>
  );
}
