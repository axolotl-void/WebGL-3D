import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './HeroOverlay.css';

const LOGO_SUFFIXES = [
  ' PRASETYA SADEWA.',
  '. FRONTEND DEVELOPER',
  ' COMPUTER SCIENCE',
  '.DEV',
];

export default function HeroOverlay() {
  const rootRef = useRef(null);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const bgAudioRef = useRef(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const sfxPoolRef = useRef([]);
  const sfxIndexRef = useRef(0);

  // Preload click/hover SFX pool on component mount to prevent lag/CPU spikes
  useEffect(() => {
    const pool = [];
    for (let i = 0; i < 4; i++) {
      const audio = new Audio('/models/sound/click-elektrik-1.mp3');
      audio.volume = 0.35;
      audio.preload = 'auto'; // load/buffer immediately
      pool.push(audio);
    }
    sfxPoolRef.current = pool;

    return () => {
      sfxPoolRef.current = [];
    };
  }, []);

  // Typewriter cycle for logo suffix
  useEffect(() => {
    let idx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer;

    const tick = () => {
      const current = LOGO_SUFFIXES[idx];

      if (!isDeleting) {
        charIdx++;
        setTypedText(current.slice(0, charIdx));
        if (charIdx >= current.length) {
          timer = setTimeout(() => { isDeleting = true; tick(); }, 2000);
          return;
        }
        timer = setTimeout(tick, 80);
      } else {
        charIdx--;
        setTypedText(current.slice(0, charIdx));
        if (charIdx <= 0) {
          isDeleting = false;
          idx = (idx + 1) % LOGO_SUFFIXES.length;
          timer = setTimeout(tick, 400);
          return;
        }
        timer = setTimeout(tick, 40);
      }
    };

    const startDelay = setTimeout(tick, 1500);
    const cursorInterval = setInterval(() => setShowCursor(v => !v), 530);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(timer);
      clearInterval(cursorInterval);
    };
  }, []);

  // 1. Preload background audio on component mount
  useEffect(() => {
    const audio = new Audio('/models/sound/latar-belakang.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto'; // Begin loading/buffering immediately
    bgAudioRef.current = audio;

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
    };
  }, []);

  // 2. Sync background audio play/pause with isSoundOn state & bypass autoplay block
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (isSoundOn) {
      const playAudio = () => {
        audio.play()
          .then(() => {
            // Successfully playing, clean up interaction listeners
            window.removeEventListener('click', playAudio);
            window.removeEventListener('keydown', playAudio);
            window.removeEventListener('pointerdown', playAudio);
          })
          .catch((err) => {
            console.log('Audio autoplay blocked, waiting for user interaction:', err);
          });
      };

      // Try playing immediately (works if browser whitelisted the domain/refresh)
      playAudio();

      // Fallback interaction listeners for first user gesture
      window.addEventListener('click', playAudio);
      window.addEventListener('keydown', playAudio);
      window.addEventListener('pointerdown', playAudio);

      return () => {
        window.removeEventListener('click', playAudio);
        window.removeEventListener('keydown', playAudio);
        window.removeEventListener('pointerdown', playAudio);
      };
    } else {
      audio.pause();
    }
  }, [isSoundOn]);

  // Intro animation timeline
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const navbar = root.querySelector('.ho-navbar');
    const skillItems = root.querySelector('.ho-skill-item');
    const label = root.querySelector('.ho-hero-label');
    const titleWhite = root.querySelector('.ho-title-white');
    const titleCyan = root.querySelector('.ho-title-cyan');
    const dividerLines = root.querySelectorAll('.ho-divider-line');
    const dividerDiamond = root.querySelector('.ho-divider-diamond');
    const desc = root.querySelector('.ho-hero-desc');
    const buttons = root.querySelectorAll('.ho-btn');
    const statusBar = root.querySelector('.ho-status-bar');

    gsap.set(navbar, { opacity: 0, y: -20 });
    gsap.set(skillItems, { opacity: 0, x: -30 });
    gsap.set(label, { opacity: 0, letterSpacing: '0.05em' });
    gsap.set([titleWhite, titleCyan], { opacity: 0, y: 30, filter: 'blur(8px)' });
    gsap.set([dividerLines, dividerDiamond], { opacity: 0, scaleX: 0 });
    gsap.set(desc, { opacity: 0 });
    gsap.set(buttons, { opacity: 0, y: 20 });
    gsap.set(statusBar, { opacity: 0, y: 15 });

    const tl = gsap.timeline({ delay: 0.3 });

    tl.to(navbar, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0);
    tl.to(skillItems, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }, 0.3);
    tl.to(label, { opacity: 1, letterSpacing: '0.25em', duration: 0.8, ease: 'power2.out' }, 0.7);
    tl.to(titleWhite, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, 0.9);
    tl.to(titleCyan, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, 1.15);
    tl.to([dividerLines, dividerDiamond], { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' }, 1.5);
    tl.to(desc, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.7);
    tl.to(buttons, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
      onComplete() {
        gsap.to(buttons, { boxShadow: '0 0 18px rgba(0,210,255,0.5)', duration: 0.3, yoyo: true, repeat: 1 });
      },
    }, 1.95);
    tl.to(statusBar, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.3);

    // Mouse parallax on hero text
    const heroCenter = root.querySelector('.ho-hero-center');
    const handleMove = (e) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      if (heroCenter) {
        heroCenter.style.transform = `translateX(calc(-50% + ${cx * -8}px)) translateY(${cy * -5}px)`;
      }
    };
    window.addEventListener('mousemove', handleMove);

    return () => {
      tl.kill();
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  // Audio helpers
  const playClickSfx = () => {
    const pool = sfxPoolRef.current;
    if (pool.length === 0) return;

    const idx = sfxIndexRef.current;
    const sfx = pool[idx];
    if (sfx) {
      sfx.currentTime = 0; // Reset audio position to start
      sfx.play().catch(() => {});
    }
    sfxIndexRef.current = (idx + 1) % pool.length;
  };

  const toggleSound = () => {
    setIsSoundOn((prev) => !prev);
  };

  return (
    <div className="hero-overlay" ref={rootRef}>
      {/* ═══════ TOP NAVBAR ═══════ */}
      <nav className="ho-navbar">
        <a href="#home" className="ho-logo" onMouseEnter={playClickSfx}>
          YOGI<span className="ho-logo-suffix">{typedText}</span>
          <span className={`ho-logo-cursor ${showCursor ? '' : 'off'}`}>|</span>
        </a>
        <div className="ho-nav-links">
          <a href="#home" className="ho-nav-link active" onClick={playClickSfx} onMouseEnter={playClickSfx}>HOME</a>
          <a href="#about" className="ho-nav-link" onClick={playClickSfx} onMouseEnter={playClickSfx}>ABOUT</a>
          <a href="#projects" className="ho-nav-link" onClick={playClickSfx} onMouseEnter={playClickSfx}>PROJECTS</a>
          <a href="#lab" className="ho-nav-link" onClick={playClickSfx} onMouseEnter={playClickSfx}>LAB</a>
          <a href="#contact" className="ho-nav-link" onClick={playClickSfx} onMouseEnter={playClickSfx}>CONTACT</a>
        </div>
      </nav>

      {/* ═══════ LEFT SKILL TAGS ═══════ */}
      <div className="ho-skill-tags">
        {['WEBGL', 'FRONTEND', 'THREE.JS', 'CREATIVE DEV', 'UI MOTION'].map((tag) => (
          <div className="ho-skill-item" key={tag} onMouseEnter={playClickSfx}>
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
          <button className="ho-btn ho-btn-primary" onClick={playClickSfx} onMouseEnter={playClickSfx}>
            VIEW PROJECTS <span className="ho-btn-arrow">›</span>
          </button>
          <button className="ho-btn ho-btn-secondary" onClick={playClickSfx} onMouseEnter={playClickSfx}>
            CONTACT ME <span className="ho-btn-icon">✉</span>
          </button>
        </div>
      </div>

      {/* ═══════ BOTTOM STATUS BAR ═══════ */}
      <div className="ho-status-bar">
        <div
          className="ho-status-item"
          onClick={toggleSound}
          onMouseEnter={playClickSfx}
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        >
          <span className="ho-status-icon">⫶</span>
          <span>SOUND <strong>{isSoundOn ? 'ON' : 'OFF'}</strong></span>
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
