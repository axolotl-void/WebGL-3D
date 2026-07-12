import React, { useEffect, useRef, useState } from 'react';
import './Zone2Overlay.css';

// ponytail: scroll thresholds match the Zone 2 explore phase in UnifiedScene.
// Panel fades in when camera starts cruising Zone 2 (~45%), fades out if scrolled back above ~38%.
const SHOW_RATIO = 0.45;
const HIDE_RATIO = 0.38;

// Button fades in only towards the end of the Zone 2 scroll path (~60%), fades out if scrolled back above ~58%.
const BUTTON_SHOW_RATIO = 0.60;
const BUTTON_HIDE_RATIO = 0.58;

export default function Zone2Overlay() {
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const visibleRef = useRef(false);
  const btnVisibleRef = useRef(false);
  const clickSfxRef = useRef(null);
  const [isCooldown, setIsCooldown] = useState(false);

  // Preload click SFX on mount to avoid latency and audio context lag
  useEffect(() => {
    clickSfxRef.current = new Audio('/models/sound/click-elektrik-1.mp3');
    clickSfxRef.current.volume = 0.35;
    clickSfxRef.current.preload = 'auto';

    return () => {
      clickSfxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      
      let ratio = window.scrollY / max;
      // If we haven't clicked explore yet, the camera is clamped at 0.6245.
      // We clamp the ratio for HUD visibility check to match the camera's actual position.
      if (!window.__isExplored) {
        ratio = Math.min(ratio, 0.6245);
      }

      // Panel visibility hysteresis (visible between 0.45 and 0.75)
      const isWithinZone2 = ratio >= SHOW_RATIO && ratio < 0.75;
      const shouldHide = ratio < HIDE_RATIO || ratio >= 0.75;

      if (!visibleRef.current && isWithinZone2) {
        visibleRef.current = true;
        root.classList.add('visible');
      } else if (visibleRef.current && shouldHide) {
        visibleRef.current = false;
        root.classList.remove('visible');
      }

      // Button visibility hysteresis (only appears between 0.60 and 0.75)
      const isButtonActive = ratio >= BUTTON_SHOW_RATIO && ratio < 0.75;
      const shouldButtonHide = ratio < BUTTON_HIDE_RATIO || ratio >= 0.75;

      if (!btnVisibleRef.current && isButtonActive) {
        btnVisibleRef.current = true;
        buttonRef.current?.classList.add('btn-visible');
      } else if (btnVisibleRef.current && shouldButtonHide) {
        btnVisibleRef.current = false;
        buttonRef.current?.classList.remove('btn-visible');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleExploreClick = () => {
    if (isCooldown) return;

    // ponytail: block click spamming to avoid UI stutter and browser audio pipeline bottlenecks
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 800);

    if (localStorage.getItem('isSoundOn') !== 'false' && clickSfxRef.current) {
      clickSfxRef.current.currentTime = 0;
      clickSfxRef.current.play().catch(() => {});
    }

    // Notify UnifiedScene that the explore button has been clicked
    window.dispatchEvent(new CustomEvent('explore-click'));
  };

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
      </div>

      {/* ═══════ EXPLORE BUTTON (Moved to center-bottom, visible at the end) ═══════ */}
      <button 
        ref={buttonRef}
        className={`z2-explore-btn ${isCooldown ? 'cooldown' : ''}`}
        onClick={handleExploreClick}
        disabled={isCooldown}
      >
        EXPLORE
        <span className="z2-explore-arrow">›</span>
      </button>
    </div>
  );
}

