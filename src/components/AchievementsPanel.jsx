import { useState, useEffect, useCallback } from 'react';
import './IdentityPanel.css';

// ponytail: reuses IdentityPanel.css styles. Listens for cube-click index 1 (Achievements)
const CLOSE_DURATION = 400;

export default function AchievementsPanel() {
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
      if (e.detail === 1) setIsOpen(true);
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

  const achievements = [
    {
      type: 'CERTIFICATE',
      title: 'React Developer Expert',
      issuer: 'Dicoding Indonesia',
      date: '2023',
      id: 'RC-EXPERT-9941X'
    },
    {
      type: 'CERTIFICATE',
      title: 'Three.js & WebGL Creative Dev',
      issuer: 'Three.js Journey / Design Course',
      date: '2024',
      id: 'TJ-GLSL-8820Z'
    },
    {
      type: 'AWARD',
      title: 'Creative Coding Winner',
      issuer: 'Local Tech Competition',
      date: '2023',
      id: 'COMP-AWD-01X'
    }
  ];

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

        {/* Header */}
        <div className="id-header">
          <div className="id-header-top">
            <span className="id-label">
              <span className="id-label-prefix">▸</span>
              04 / ACHIEVEMENTS MODULE
              <span className="id-cursor">_</span>
            </span>
            <div className="id-header-decor">
              <span className="id-bar" />
              <span className="id-bar" />
              <span className="id-bar" />
              <span className="id-bar" />
              <span className="id-bar active" />
            </div>
          </div>
          <div className="id-title">
            <span className="id-title-cyan">ACHIEVEMENTS</span>
          </div>
          <div className="id-divider">
            <span className="id-divider-line" />
            <span className="id-divider-diamond" />
            <span className="id-divider-line" />
          </div>
        </div>

        {/* Content Area */}
        <div className="id-content ach-content-layout">
          <div className="ach-grid">
            {achievements.map((item, idx) => (
              <div key={idx} className="ach-card">
                <div className="ach-card-header">
                  <span className={`ach-badge ${item.type.toLowerCase()}`}>{item.type}</span>
                  <span className="ach-date">{item.date}</span>
                </div>
                <h4 className="ach-title">{item.title}</h4>
                <p className="ach-issuer">{item.issuer}</p>
                <div className="ach-footer">
                  <span className="ach-id">REF: {item.id}</span>
                  <button className="ach-btn-verify">
                    <span className="ach-btn-prefix">▸</span> VERIFY
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
