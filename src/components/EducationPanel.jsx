import { useState, useEffect, useCallback } from 'react';
import './IdentityPanel.css';

// ponytail: reuses IdentityPanel.css styles. Listens for cube-click index 2 (Education)
const CLOSE_DURATION = 400;

export default function EducationPanel() {
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

        {/* Header */}
        <div className="id-header">
          <div className="id-header-top">
            <span className="id-label">
              <span className="id-label-prefix">▸</span>
              02 / EDUCATION MODULE
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
            <span className="id-title-cyan">EDUCATION</span>
          </div>
          <div className="id-divider">
            <span className="id-divider-line" />
            <span className="id-divider-diamond" />
            <span className="id-divider-line" />
          </div>
        </div>

        {/* Content Area */}
        <div className="id-content edu-content-layout">
          <div className="edu-main-card">
            <div className="edu-card-tag">ACADEMIC RECORD</div>
            <h3 className="edu-degree">COMPUTER SCIENCE</h3>
            <p className="edu-institution">Universitas Bina Bangsa Getsempena (UBBG)</p>
            <div className="edu-period-badge">
              <span className="edu-period-label">DURATION:</span> 2022 — PRESENT
            </div>
          </div>

          <div className="edu-stats-grid">
            <div className="edu-stat-box">
              <div className="edu-stat-header">
                <span className="edu-stat-title">ACADEMIC STATUS</span>
                <span className="edu-stat-value green-glow">ACTIVE</span>
              </div>
              <div className="edu-stat-body">
                <div className="edu-progress-bar-container">
                  <div className="edu-progress-bar-fill" style={{ width: '75%' }} />
                </div>
                <div className="edu-progress-labels">
                  <span>YEAR 3 (SEMESTER 6)</span>
                  <span>75% COMPLETE</span>
                </div>
              </div>
            </div>

            <div className="edu-stat-box">
              <div className="edu-stat-header">
                <span className="edu-stat-title">CORE FOCUS</span>
              </div>
              <div className="edu-stat-list">
                <div className="edu-list-item">▸ WebGL & Creative Development</div>
                <div className="edu-list-item">▸ Frontend Architecture (React / Next.js)</div>
                <div className="edu-list-item">▸ Interactive UI/UX Design</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
