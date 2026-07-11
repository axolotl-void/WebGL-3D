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
  const clickSfxRef = useRef(null);

  // Preload click SFX on mount
  useEffect(() => {
    clickSfxRef.current = new Audio('/models/sound/click-elektrik-1.mp3');
    clickSfxRef.current.volume = 0.35;
    clickSfxRef.current.preload = 'auto';

    return () => {
      clickSfxRef.current = null;
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

  // Manage background audio instance and playback syncing
  useEffect(() => {
    // Ensure the audio instance is created and preloaded immediately
    if (!bgAudioRef.current) {
      const audio = new Audio('/models/sound/latar-belakang.mp3');
      audio.loop = true;
      audio.volume = 0.4;
      audio.preload = 'auto'; // Begin loading/buffering immediately
      bgAudioRef.current = audio;
    }

    const audio = bgAudioRef.current;

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

      // Try playing immediately (works if browser whitelisted the domain or on refresh if already interacted)
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

  // Intro and scroll animations
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const navbar = root.querySelector('.ho-navbar');
    const skillItems = Array.from(root.querySelectorAll('.ho-skill-item')); // Array for proper GSAP stagger
    const skillTags = root.querySelector('.ho-skill-tags');     // container for scroll exit fade
    const label = root.querySelector('.ho-hero-label');
    const titleWhite = root.querySelector('.ho-title-white');
    const titleCyan = root.querySelector('.ho-title-cyan');
    const dividerLines = Array.from(root.querySelectorAll('.ho-divider-line'));
    const dividerDiamond = root.querySelector('.ho-divider-diamond');
    const desc = root.querySelector('.ho-hero-desc');
    const buttons = Array.from(root.querySelectorAll('.ho-btn'));
    const statusBar = root.querySelector('.ho-status-bar');

    const dividerElements = [...dividerLines, dividerDiamond];

    gsap.set(navbar, { opacity: 0, y: -20 });
    gsap.set(skillItems, { opacity: 0, x: -30 });
    gsap.set(label, { opacity: 0, letterSpacing: '0.05em' });
    gsap.set([titleWhite, titleCyan], { opacity: 0, y: 30, filter: 'blur(8px)' });
    gsap.set(dividerElements, { opacity: 0, scaleX: 0 });
    gsap.set(desc, { opacity: 0 });
    gsap.set(buttons, { opacity: 0, y: 20 });
    gsap.set(statusBar, { opacity: 0, y: 15 });

    const tl = gsap.timeline({ delay: 0.3 });

    tl.to(navbar, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0);
    tl.to(skillItems, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }, 0.3);
    tl.to(label, { opacity: 1, letterSpacing: '0.25em', duration: 0.8, ease: 'power2.out' }, 0.7);
    tl.to(titleWhite, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, 0.9);
    tl.to(titleCyan, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, 1.15);
    tl.to(dividerElements, { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' }, 1.5);
    tl.to(desc, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.7);
    tl.to(buttons, {
      opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
      onComplete() {
        gsap.to(buttons, { filter: 'drop-shadow(0 0 15px rgba(0,210,255,0.75))', duration: 0.35, yoyo: true, repeat: 1, clearProps: 'filter' });
      },
    }, 1.95);
    tl.to(statusBar, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.3);

    // Mouse parallax and scroll-driven exit animation on hero text using GSAP (avoids fighting CSS transitions)
    const heroCenter = root.querySelector('.ho-hero-center');

    const updateHeroPositionAndOpacity = (e) => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      const fadeStart = 0.0;
      const fadeEnd = 0.08; // Fades out completely by 8% of the total page scroll
      const rawProgress = (scrollRatio - fadeStart) / (fadeEnd - fadeStart);
      const scrollOpacity = Math.max(0, 1 - Math.min(1, rawProgress));

      let cx = 0;
      let cy = 0;
      if (e) {
        cx = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        cy = (e.clientY / window.innerHeight - 0.5) * 2;
      }

      // 1. Central hero text animation
      if (heroCenter) {
        heroCenter.style.pointerEvents = 'none';

        const px = cx * -8;
        const py = cy * -5 + scrollY * 0.25; // Sink down as we scroll

        gsap.to(heroCenter, {
          opacity: scrollOpacity,
          x: px,
          y: py,
          xPercent: -50,
          duration: 0.15,
          overwrite: 'auto',
          ease: 'power2.out'
        });
      }

      // 2. Sidebar skill tags animation (fades out as we approach the cube)
      if (skillTags) {
        skillTags.style.pointerEvents = scrollOpacity < 0.1 ? 'none' : 'auto';

        gsap.to(skillTags, {
          opacity: scrollOpacity,
          x: cx * -4, // subtle horizontal parallax
          y: cy * -3, // subtle vertical parallax
          duration: 0.15,
          overwrite: 'auto',
          ease: 'power2.out'
        });
      }
    };

    let lastMouseEvent = null;
    const handleMouseMove = (e) => {
      lastMouseEvent = e;
      updateHeroPositionAndOpacity(e);
    };

    const handleScroll = () => {
      updateHeroPositionAndOpacity(lastMouseEvent);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Initial check to apply correct visibility state immediately on mount
    updateHeroPositionAndOpacity(null);

    return () => {
      tl.kill();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Audio helpers
  const playClickSfx = () => {
    if (!isSoundOn) return;
    const sfx = clickSfxRef.current;
    if (sfx) {
      sfx.currentTime = 0; // Reset audio position to start
      sfx.play().catch(() => {});
    }
  };

  const toggleSound = () => {
    setIsSoundOn((prev) => !prev);
  };

  return (
    <div className="hero-overlay" ref={rootRef}>
      {/* ═══════ TOP NAVBAR ═══════ */}
      <nav className="ho-navbar">
        <a href="#home" className="ho-logo" onClick={playClickSfx}>
          YOGI<span className="ho-logo-suffix">{typedText}</span>
          <span className={`ho-logo-cursor ${showCursor ? '' : 'off'}`}>|</span>
        </a>
        <div className="ho-nav-links">
          <a href="#home" className="ho-nav-link active" onClick={playClickSfx}>HOME</a>
          <a href="#about" className="ho-nav-link" onClick={playClickSfx}>ABOUT</a>
          <a href="#projects" className="ho-nav-link" onClick={playClickSfx}>PROJECTS</a>
          <a href="#lab" className="ho-nav-link" onClick={playClickSfx}>LAB</a>
          <a href="#contact" className="ho-nav-link" onClick={playClickSfx}>CONTACT</a>
        </div>
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
          <button className="ho-btn ho-btn-primary" onClick={playClickSfx}>
            VIEW PROJECTS <span className="ho-btn-arrow">›</span>
          </button>
          <button className="ho-btn ho-btn-secondary" onClick={playClickSfx}>
            CONTACT ME <span className="ho-btn-icon">✉</span>
          </button>
        </div>
      </div>

      {/* ═══════ BOTTOM STATUS BAR ═══════ */}
      <div className="ho-status-bar">
        <div
          className="ho-status-item"
          onClick={() => {
            toggleSound();
            playClickSfx();
          }}
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
