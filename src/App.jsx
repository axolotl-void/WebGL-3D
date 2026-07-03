import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import UnifiedScene from './scenes/UnifiedScene';
import Navbar from './components/Navbar';
import UIOverlay from './components/UIOverlay';
import AboutSection from './components/sections/AboutSection';
import ProjectsSection from './components/sections/ProjectsSection';
import WebGLSection from './components/sections/WebGLSection';
import ContactSection from './components/sections/ContactSection';
import './App.css';

function App() {
  const navbarRef = useRef(null);
  const uiRef = useRef(null);


  useEffect(() => {
    // Force scroll restoration to manual and reset scroll position to 0 on page reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const navbar = navbarRef.current;
    const ui = uiRef.current;
    if (!navbar || !ui) return;

    // --- Hide all items before intro timeline ---
    gsap.set(navbar, { opacity: 0, y: -20 });

    const titleWords = ui.querySelectorAll('[data-intro="title-word"]');
    const label = ui.querySelector('[data-intro="label"]');
    const desc = ui.querySelector('[data-intro="desc"]');
    const cta = ui.querySelector('[data-intro="cta"]');
    const stats = ui.querySelector('[data-intro="stats"]');
    const statNums = ui.querySelectorAll('[data-intro="stat-number"]');
    const rightPanel = ui.querySelector('[data-intro="right-panel"]');
    const corners = ui.querySelectorAll('[data-intro="corner"]');
    const scrollEl = ui.querySelector('[data-intro="scroll"]');

    gsap.set(titleWords, { y: '105%', opacity: 0 });
    gsap.set(label, { opacity: 0, letterSpacing: '0.05em' });
    gsap.set(desc, { opacity: 0, y: 15 });
    gsap.set(cta, { opacity: 0, y: 15 });
    gsap.set(stats, { opacity: 0 });
    gsap.set(rightPanel, { opacity: 0, x: 20 });
    gsap.set(corners, { opacity: 0, scale: 0.8 });
    gsap.set(scrollEl, { opacity: 0 });

    // --- Intro GSAP Timeline ---
    // Start intro timeline after a slight delay to allow canvas render settle
    const tl = gsap.timeline({ delay: 0.5 });

    // 1. Top Navbar slides down
    tl.to(navbar, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'power3.out',
    }, 0);

    // 2. HUD corners brackets scale in
    tl.to(corners, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'back.out(1.4)',
      stagger: 0.08,
    }, 0.2);

    // 3. System module label fades and expands letter-spacing
    tl.to(label, {
      opacity: 1,
      letterSpacing: '0.15em',
      duration: 1.0,
      ease: 'power2.out',
    }, 0.4);

    // 4. Hero Title word-by-word reveal (slides up from mask)
    tl.to(titleWords, {
      y: '0%',
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.1,
    }, 0.5);

    // 5. Hero Description and CTA buttons
    tl.to([desc, cta], {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.1,
    }, 0.8);

    // 6. Right Panel links slide in
    tl.to(rightPanel, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power2.out',
    }, 0.9);

    // 7. Stats fade in
    tl.to(stats, {
      opacity: 1,
      duration: 0.6,
    }, 1.1);

    // 8. Stats numeric counters run up from 0 to target
    statNums.forEach((el) => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const obj = { val: 0 };
      tl.to(obj, {
        val: target,
        duration: 1.5,
        ease: 'power3.out',
        onUpdate() {
          el.textContent = Math.round(obj.val) + suffix;
        },
        onComplete() {
          el.textContent = target + suffix;
        },
      }, 1.1);
    });

    // 9. Scroll indicator fades in at the end
    tl.to(scrollEl, {
      opacity: 1,
      duration: 0.8,
    }, 1.4);

    return () => tl.kill();
  }, []);

  return (
    <>
      {/* 3D WebGL Canvas Background Layer */}
      <div className="canvas-container">
        <Canvas gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          
          <Suspense fallback={null}>
            <UnifiedScene />
          </Suspense>

        </Canvas>
      </div>

      {/* Absolute Navbar (HIDDEN TEMPORARILY) */}
      <div
        ref={navbarRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'none'
        }}
      >
        <Navbar />
      </div>

      {/* Main HUD Overlays and Scrollable Content */}
      <div className="scroll-container" style={{ pointerEvents: 'none' }}>
        {/*
        <section id="home" className="section-hero">
          <div ref={uiRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
              <UIOverlay />
            </div>
          </div>
        </section>

        <section id="about" className="section-content">
          <AboutSection />
        </section>

        <section id="projects" className="section-content">
          <ProjectsSection />
        </section>

        <section id="webgl" className="section-content">
          <WebGLSection />
        </section>

        <section id="contact" className="section-content">
          <ContactSection />
        </section>
        */}
        
        {/* We still need a tall invisible div so we can scroll and test camera movements! */}
        <div style={{ height: '500vh', width: '100%' }}></div>
      </div>
    </>
  );
}

export default App;
