import { useState, useEffect, useCallback } from 'react';
import './IdentityPanel.css';

// ponytail: listens for 'cube-click' custom event from InteractiveCube (index 0 = Identity)
const CLOSE_DURATION = 400; // ms, matches CSS idHoloFold duration

export default function IdentityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, CLOSE_DURATION);
  }, [isClosing]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 0) setIsOpen(true);
    };
    window.addEventListener('cube-click', handler);
    return () => window.removeEventListener('cube-click', handler);
  }, []);

  // ESC key to close
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
        {/* Decorative corner brackets */}
        <div className="id-corner tl" />
        <div className="id-corner tr" />
        <div className="id-corner bl" />
        <div className="id-corner br" />

        {/* Animated scanline and cyber grid overlay */}
        <div className="id-scanline" />
        <div className="id-grid-overlay" />

        {/* Close Button */}
        <button className="id-close" onClick={handleClose}>✕</button>

        {/* Minimal Tech Header */}
        <div className="id-hud-header">
          <div className="id-hud-header-left">
            <span className="id-hud-module">01 / IDENTITY MODULE</span>
          </div>
          <div className="id-hud-header-right">
            <span className="id-hud-slashes">///</span>
            <span className="id-hud-dots">•••••••</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="id-content identity-content-layout">
          
          {/* Left Column: Profile Picture Frame */}
          <div className="id-profile-column">
            <div className="id-profile-outer-frame">
              <div className="id-profile-radar-bg">
                <div className="id-radar-circle outer" />
                <div className="id-radar-circle middle" />
                <div className="id-radar-circle inner" />
                <div className="id-radar-crosshair-v" />
                <div className="id-radar-crosshair-h" />
              </div>
              <div className="id-profile-inner-frame">
                <div className="id-profile-corner-tag tl" />
                <div className="id-profile-corner-tag tr" />
                <div className="id-profile-corner-tag bl" />
                <div className="id-profile-corner-tag br" />
                <img src="/models/img/profile.png" alt="Yogi Prasetya Sadewa" className="id-profile-image" />
              </div>
            </div>
            <div className="id-profile-glow-bar" />
          </div>

          {/* Right Column: Information & Metadata */}
          <div className="id-info-column">
            {/* Title Section */}
            <div className="id-title-section">
              <div className="id-hello-prefix">
                <span>HELLO, I'M</span>
                <span className="id-prefix-line" />
              </div>
              <h2 className="id-main-name">
                YOGI <span className="text-cyan">PRASETYA SADEWA</span>
              </h2>
              <div className="id-subtitle-row">
                <span className="id-subtitle-text">CREATIVE DEVELOPER & FRONTEND ARCHITECT</span>
                <span className="id-subtitle-line" />
                <span className="id-subtitle-suffix">///</span>
              </div>
            </div>

            {/* About Me Card */}
            <div className="id-about-card">
              <div className="id-about-text-content">
                <h3 className="id-about-title">| ABOUT ME</h3>
                <p className="id-about-desc">
                  Creative frontend developer specialized in building interactive 3D web experiences.
                  Passionate about bridging the gap between art and code using modern WebGL, React, and immersive shaders.
                </p>
              </div>
              {/* Rotating Hexagon Hologram */}
              <div className="id-holo-cube-container">
                <svg className="id-holo-svg" viewBox="0 0 100 100" fill="none" stroke="#00d2ff" strokeWidth="1.2">
                  <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" strokeOpacity="0.4" />
                  <polygon points="50,20 80,37 80,63 50,80 20,63 20,37" strokeOpacity="0.7" />
                  <polygon points="50,35 68,45 68,55 50,65 32,55 32,45" />
                  <line x1="50" y1="5" x2="50" y2="20" />
                  <line x1="90" y1="28" x2="80" y2="37" />
                  <line x1="90" y1="72" x2="80" y2="63" />
                  <line x1="50" y1="95" x2="50" y2="80" />
                  <line x1="10" y1="72" x2="20" y2="63" />
                  <line x1="10" y1="28" x2="20" y2="37" />
                  <line x1="50" y1="20" x2="50" y2="35" />
                  <line x1="80" y1="37" x2="68" y2="45" />
                  <line x1="80" y1="63" x2="68" y2="55" />
                  <line x1="50" y1="80" x2="50" y2="65" />
                  <line x1="20" y1="63" x2="32" y2="55" />
                  <line x1="20" y1="37" x2="32" y2="45" />
                </svg>
              </div>
            </div>

            {/* Meta Grid Section */}
            <div className="id-meta-card">
              <div className="id-meta-grid">
                
                {/* Column 1: Name */}
                <div className="id-meta-col">
                  <svg className="id-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="id-meta-lbl">NAME</span>
                  <span className="id-meta-val">Yogi Prasetya Sadewa</span>
                </div>

                {/* Column 2: Birthday */}
                <div className="id-meta-col">
                  <svg className="id-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="id-meta-lbl">BIRTHDAY</span>
                  <span className="id-meta-val">18 July 2005</span>
                </div>

                {/* Column 3: Nationality */}
                <div className="id-meta-col">
                  <svg className="id-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  <span className="id-meta-lbl">NATIONALITY</span>
                  <span className="id-meta-val">Indonesian</span>
                </div>

                {/* Column 4: Focus */}
                <div className="id-meta-col">
                  <svg className="id-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="12" x2="2" y2="12" />
                    <line x1="12" y1="6" x2="12" y2="2" />
                    <line x1="12" y1="22" x2="12" y2="18" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="id-meta-lbl">FOCUS</span>
                  <span className="id-meta-val">WebGL, Shaders, React & Next.js</span>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
