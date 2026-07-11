import { useState, useEffect, useCallback } from 'react';
import './IdentityPanel.css';

// ponytail: reuses IdentityPanel.css styles. Listens for cube-click index 4 (Skills)
const CLOSE_DURATION = 400;

export default function SkillsPanel() {
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
      if (e.detail === 4) setIsOpen(true);
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
            <span className="id-hud-module">03 / SKILLS MODULE</span>
          </div>
          <div className="id-hud-header-right">
            <span className="id-hud-slashes">///</span>
            <span className="id-hud-dots">•••••••</span>
          </div>
        </div>

        {/* Large Title */}
        <div className="skills-header-block">
          <h2 className="skills-large-title">
            TECHNICAL <span className="cyan-highlight">SKILLS</span>
          </h2>
          <p className="skills-subtitle">
            Tools, technologies, and creative abilities I use to build interactive digital experiences.
          </p>
        </div>

        {/* HUD Divider Line */}
        <div className="skills-hud-divider">
          <div className="skills-hud-line" />
          <div className="skills-hud-diamond" />
          <div className="skills-hud-line" />
        </div>

        {/* 4-Column Layout */}
        <div className="skills-columns-grid">
          
          {/* Column 1: Creative WebGL */}
          <div className="skills-col">
            <div className="skills-col-header">
              <span className="skills-col-badge">01</span>
              <div className="skills-col-icon-wrapper">
                <svg className="skills-col-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="12" y1="12" x2="22" y2="8" />
                  <line x1="12" y1="12" x2="2" y2="8" />
                </svg>
              </div>
              <h3 className="skills-col-title">CREATIVE WEBGL</h3>
              <p className="skills-col-subtitle">Building immersive 3D web experiences</p>
            </div>
            
            <div className="skills-col-list">
              {/* Skill items */}
              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
                  <line x1="12" y1="12" x2="12" y2="2" />
                  <line x1="12" y1="12" x2="22" y2="8" />
                  <line x1="12" y1="12" x2="2" y2="8" strokeOpacity="0.6" />
                </svg>
                <span className="skill-item-name">Three.js</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>
              
              <div className="skills-col-item">
                <div className="skill-badge-box r3f">R3F</div>
                <span className="skill-item-name">React Three Fiber</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>
              
              <div className="skills-col-item">
                <div className="skill-badge-box drei">DREI</div>
                <span className="skill-item-name">Drei</span>
                <span className="skill-item-level intermediate">• Intermediate</span>
              </div>

              <div className="skills-col-item">
                <div className="skill-badge-box webgl">WEBGL</div>
                <span className="skill-item-name">WebGL</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <div className="skill-badge-box glsl">GLSL</div>
                <span className="skill-item-name">GLSL Shaders</span>
                <span className="skill-item-level intermediate">• Intermediate</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
                <span className="skill-item-name">3D Interaction</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>
            </div>
          </div>

          {/* Column 2: Frontend System */}
          <div className="skills-col">
            <div className="skills-col-header">
              <span className="skills-col-badge">02</span>
              <div className="skills-col-icon-wrapper">
                <svg className="skills-col-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="16,18 22,12 16,6" />
                  <polyline points="8,6 2,12 8,18" />
                </svg>
              </div>
              <h3 className="skills-col-title">FRONTEND SYSTEM</h3>
              <p className="skills-col-subtitle">Modern web development with scalable architecture</p>
            </div>
            
            <div className="skills-col-list">
              <div className="skills-col-item">
                <span className="skill-badge-box js">JS</span>
                <span className="skill-item-name">JavaScript</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <span className="skill-badge-box ts">TS</span>
                <span className="skill-item-name">TypeScript</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg react" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="1.5">
                  <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(30 12 12)" />
                  <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(90 12 12)" />
                  <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(150 12 12)" />
                  <circle cx="12" cy="12" r="1.5" fill="#00d2ff" />
                </svg>
                <span className="skill-item-name">React.js</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg next" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" fill="#000000" />
                  <path d="M8 16V8l8 8V8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="skill-item-name">Next.js</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg tailwind" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5">
                  <path d="M12 6c-2.7 0-4.5 1.35-5.4 4.05 1.35-1.8 2.7-2.25 4.05-1.35.77.51 1.32 1.07 1.93 1.68C13.56 11.4 14.9 12.75 18 12.75c2.7 0 4.5-1.35 5.4-4.05-1.35 1.8-2.7 2.25-4.05 1.35-.77-.51-1.32-1.07-1.93-1.68C16.44 7.35 15.1 6 12 6z M6 12.75c-2.7 0-4.5 1.35-5.4 4.05 1.35-1.8 2.7-2.25 4.05-1.35.77.51 1.32 1.07 1.93 1.68C7.56 18.15 8.9 19.5 12 19.5c2.7 0 4.5-1.35 5.4-4.05-1.35 1.8-2.7 2.25-4.05 1.35-.77-.51-1.32-1.07-1.93-1.68C10.44 14.1 9.1 12.75 6 12.75z" />
                </svg>
                <span className="skill-item-name">Tailwind CSS</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <span className="skill-badge-box htmlcss">5 3</span>
                <span className="skill-item-name">HTML5 / CSS3</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>
            </div>
          </div>

          {/* Column 3: UI Motion & Experience */}
          <div className="skills-col">
            <div className="skills-col-header">
              <span className="skills-col-badge">03</span>
              <div className="skills-col-icon-wrapper">
                <svg className="skills-col-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                  <path d="M12 8V12L15 15" />
                </svg>
              </div>
              <h3 className="skills-col-title">UI MOTION & EXPERIENCE</h3>
              <p className="skills-col-subtitle">Crafting engaging interfaces with smooth interactions</p>
            </div>
            
            <div className="skills-col-list">
              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="12" height="15" rx="1" />
                  <rect x="16" y="9" width="6" height="9" rx="1" />
                </svg>
                <span className="skill-item-name">Responsive Design</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span className="skill-item-name">UI Animation</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span className="skill-item-name">Motion Design</span>
                <span className="skill-item-level intermediate">• Intermediate</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
                <span className="skill-item-name">Interactive Layout</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <span className="skill-item-name">Component UI</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="skill-item-name">UX Focused</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>
            </div>
          </div>

          {/* Column 4: Tools & Workflow */}
          <div className="skills-col">
            <div className="skills-col-header">
              <span className="skills-col-badge">04</span>
              <div className="skills-col-icon-wrapper">
                <svg className="skills-col-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <h3 className="skills-col-title">TOOLS & WORKFLOW</h3>
              <p className="skills-col-subtitle">Productive & efficient development workflow</p>
            </div>
            
            <div className="skills-col-list">
              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                <span className="skill-item-name">Git & GitHub</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg figma" viewBox="0 0 24 24" fill="none" stroke="#f24e1e" strokeWidth="1.5">
                  <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5zM5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 0 1-3.5 3.5h-.5a3.5 3.5 0 0 1-3.5-3.5zM12 9h3.5a3.5 3.5 0 0 1 3.5 3.5v.5a3.5 3.5 0 0 1-3.5 3.5H12V9zM12 2h3.5A3.5 3.5 0 0 1 19 5.5v.5a3.5 3.5 0 0 1-3.5 3.5H12V2z" />
                </svg>
                <span className="skill-item-name">Figma</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg vscode" viewBox="0 0 24 24" fill="none" stroke="#007acc" strokeWidth="1.5">
                  <path d="M23.93 6.58a1.5 1.5 0 0 0-.58-.33l-7-2.33a1.5 1.5 0 0 0-1.67.5L9.12 10 3.2 5.06A1.5 1.5 0 0 0 1 6.2v11.6a1.5 1.5 0 0 0 2.2 1.34L9.12 14l5.56 5.59a1.5 1.5 0 0 0 1.67.5l7-2.33a1.5 1.5 0 0 0 .58-.33v-10.8z" />
                </svg>
                <span className="skill-item-name">VS Code</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg vercel" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12,2 22,20 2,20" />
                </svg>
                <span className="skill-item-name">Vercel</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>

              <div className="skills-col-item">
                <span className="skill-badge-box npm">npm</span>
                <span className="skill-item-name">NPM / PNPM</span>
                <span className="skill-item-level intermediate">• Intermediate</span>
              </div>

              <div className="skills-col-item">
                <svg className="skill-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span className="skill-item-name">API Integration</span>
                <span className="skill-item-level primary">• Primary</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer HUD Decor Block */}
        <div className="skills-footer-hud">
          <div className="skills-footer-left">
            <svg className="skills-footer-target-svg" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="1" x2="12" y2="23" />
              <line x1="1" y1="12" x2="23" y2="12" />
            </svg>
            <div className="skills-footer-badge-text">
              <div className="skills-badge-top">CONTINUOUS LEARNING</div>
              <div className="skills-badge-bottom">ADAPT. BUILD. INNOVATE.</div>
            </div>
          </div>

          <div className="skills-footer-divider" />

          <p className="skills-footer-desc">
            I enjoy turning ideas into interactive digital experiences through clean code, creative design, and modern technology.
          </p>

          <div className="skills-footer-icons-row">
            <span className="skills-glow-badge js">JS</span>
            <span className="skills-glow-badge ts">TS</span>
            
            <svg className="skills-glow-svg react" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2">
              <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(30 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(90 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(150 12 12)" />
            </svg>

            <svg className="skills-glow-svg next" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" fill="#000" />
              <path d="M9 15V9l6 6V9" />
            </svg>

            <svg className="skills-glow-svg tailwind" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
              <path d="M12 6c-2.7 0-4.5 1.35-5.4 4.05 1.35-1.8 2.7-2.25 4.05-1.35.77.51 1.32 1.07 1.93 1.68C13.56 11.4 14.9 12.75 18 12.75c2.7 0 4.5-1.35 5.4-4.05-1.35 1.8-2.7 2.25-4.05 1.35-.77-.51-1.32-1.07-1.93-1.68C16.44 7.35 15.1 6 12 6z M6 12.75c-2.7 0-4.5 1.35-5.4 4.05 1.35-1.8 2.7-2.25 4.05-1.35.77.51 1.32 1.07 1.93 1.68C7.56 18.15 8.9 19.5 12 19.5c2.7 0 4.5-1.35 5.4-4.05-1.35 1.8-2.7 2.25-4.05 1.35-.77-.51-1.32-1.07-1.93-1.68C10.44 14.1 9.1 12.75 6 12.75z" strokeWidth="1.5" />
            </svg>

            <svg className="skills-glow-svg three" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
              <line x1="12" y1="12" x2="12" y2="2" />
              <line x1="12" y1="12" x2="22" y2="8" />
              <line x1="12" y1="12" x2="2" y2="8" />
            </svg>

            <span className="skills-glow-badge webgl">WebGL</span>
          </div>
        </div>

      </div>
    </div>
  );
}
