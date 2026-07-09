import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './HeroOverlay.css';

export default function HeroOverlay() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Grab elements
    const navbar = root.querySelector('.ho-navbar');
    const skillItems = root.querySelectorAll('.ho-skill-item');
    const label = root.querySelector('.ho-hero-label');
    const titleWhite = root.querySelector('.ho-title-white');
    const titleCyan = root.querySelector('.ho-title-cyan');
    const dividerLines = root.querySelectorAll('.ho-divider-line');
    const dividerDiamond = root.querySelector('.ho-divider-diamond');
    const desc = root.querySelector('.ho-hero-desc');
    const buttons = root.querySelectorAll('.ho-btn');
    const statusBar = root.querySelector('.ho-status-bar');

    // Initial hidden states
    gsap.set(navbar, { opacity: 0, y: -20 });
    gsap.set(skillItems, { opacity: 0, x: -30 });
    gsap.set(label, { opacity: 0, letterSpacing: '0.05em' });
    gsap.set([titleWhite, titleCyan], { opacity: 0, y: 30, filter: 'blur(8px)' });
    gsap.set([dividerLines, dividerDiamond], { opacity: 0, scaleX: 0 });
    gsap.set(desc, { opacity: 0 });
    gsap.set(buttons, { opacity: 0, y: 20 });
    gsap.set(statusBar, { opacity: 0, y: 15 });

    const tl = gsap.timeline({ delay: 0.3 });

    // 0.3s — navbar
    tl.to(navbar, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0);

    // 0.6s — sidebar skill tags stagger
    tl.to(skillItems, {
      opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
    }, 0.3);

    // 1.0s — label
    tl.to(label, {
      opacity: 1, letterSpacing: '0.25em', duration: 0.8, ease: 'power2.out',
    }, 0.7);

    // 1.2s — title line 1
    tl.to(titleWhite, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out',
    }, 0.9);

    // 1.45s — title line 2
    tl.to(titleCyan, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out',
    }, 1.15);

    // 1.8s — divider
    tl.to([dividerLines, dividerDiamond], {
      opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.out',
    }, 1.5);

    // 2.0s — description
    tl.to(desc, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.7);

    // 2.25s — buttons
    tl.to(buttons, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
      onComplete() {
        // Brief glow pulse on buttons
        gsap.to(buttons, {
          boxShadow: '0 0 18px rgba(0,210,255,0.5)', duration: 0.3, yoyo: true, repeat: 1,
        });
      },
    }, 1.95);

    // 2.6s — bottom status bar
    tl.to(statusBar, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
    }, 2.3);

    return () => tl.kill();
  }, []);

  return (
    <div className="hero-overlay" ref={rootRef}>
      {/* ═══════ TOP NAVBAR ═══════ */}
      <nav className="ho-navbar">
        <a href="#home" className="ho-logo">YOGI.DEV<span className="ho-logo-dot">●</span></a>
        <div className="ho-nav-links">
          <a href="#home" className="ho-nav-link active">HOME</a>
          <a href="#about" className="ho-nav-link">ABOUT</a>
          <a href="#projects" className="ho-nav-link">PROJECTS</a>
          <a href="#lab" className="ho-nav-link">LAB</a>
          <a href="#contact" className="ho-nav-link">CONTACT</a>
        </div>
        <button className="ho-menu-btn" aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* ═══════ LEFT SKILL TAGS ═══════ */}
      <div className="ho-skill-tags">
        {['WEBGL', 'FRONTEND', 'THREE.JS', 'CREATIVE DEV', 'UI MOTION'].map((tag) => (
          <div className="ho-skill-item" key={tag}>
            <span className="ho-skill-dot" />
            <span className="ho-skill-text">{tag}</span>
          </div>
        ))}
      </div>

      {/* ═══════ CENTER HERO TEXT ═══════ */}
      <div className="ho-hero-center">
        <p className="ho-hero-label">WEBGL FRONTEND DEVELOPER</p>
        <h1 className="ho-hero-title">
          <span className="ho-title-white">CRAFTING IMMERSIVE</span>
          <span className="ho-title-cyan">DIGITAL INTERFACES</span>
        </h1>
        <div className="ho-hero-divider">
          <span className="ho-divider-line" />
          <span className="ho-divider-diamond" />
          <span className="ho-divider-line" />
        </div>
        <p className="ho-hero-desc">
          A portfolio experiment combining 3D visuals,<br />
          motion design, and interactive web technology.
        </p>
        <div className="ho-hero-cta">
          <button className="ho-btn ho-btn-primary">
            VIEW PROJECTS <span className="ho-btn-arrow">›</span>
          </button>
          <button className="ho-btn ho-btn-secondary">
            CONTACT ME <span className="ho-btn-icon">✉</span>
          </button>
        </div>
      </div>

      {/* ═══════ BOTTOM STATUS BAR ═══════ */}
      <div className="ho-status-bar">
        <div className="ho-status-item">
          <span className="ho-status-icon">⫶</span>
          <span>SOUND <strong>OFF</strong></span>
        </div>
        <div className="ho-status-item">
          <span className="ho-status-dot green" />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="ho-status-item center">
          <span className="ho-scroll-icon" />
          <span>SCROLL TO EXPLORE</span>
        </div>
        <div className="ho-status-item">
          <span className="ho-status-dot green" />
          <span>AVAILABLE FOR PROJECTS</span>
        </div>
      </div>
    </div>
  );
}
