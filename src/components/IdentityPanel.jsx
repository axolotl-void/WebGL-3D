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

        {/* Header */}
        <div className="id-header">
          <div className="id-header-top">
            <span className="id-label">
              <span className="id-label-prefix">▸</span>
              01 / IDENTITY MODULE
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
            <span className="id-title-white">YOGI </span>
            <span className="id-title-cyan">PRASETYA SADEWA</span>
          </div>
          <div className="id-divider">
            <span className="id-divider-line" />
            <span className="id-divider-diamond" />
            <span className="id-divider-line" />
          </div>
        </div>

        {/* Content Area (placeholder for future content) */}
        <div className="id-content">
          {/* Area ini akan diisi kemudian */}
        </div>

      </div>
    </div>
  );
}
