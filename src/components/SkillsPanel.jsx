import { useState, useEffect, useCallback } from 'react';
import './IdentityPanel.css';

// ponytail: reuses IdentityPanel.css styles. Listens for cube-click index 4 (Skills)
const CLOSE_DURATION = 400;

export default function SkillsPanel() {
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

  const skillCategories = [
    {
      title: 'CREATIVE DEVELOPMENT & WEBGL',
      skills: [
        { name: 'WebGL / Three.js', level: 85 },
        { name: 'React Three Fiber / Drei', level: 90 },
        { name: 'GLSL Shaders', level: 75 }
      ]
    },
    {
      title: 'FRONTEND ARCHITECTURE',
      skills: [
        { name: 'React.js / Next.js', level: 95 },
        { name: 'TypeScript / Javascript', level: 90 },
        { name: 'Tailwind CSS / Modern CSS', level: 95 }
      ]
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
              03 / SKILLS MODULE
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
            <span className="id-title-cyan">TECHNICAL SKILLS</span>
          </div>
          <div className="id-divider">
            <span className="id-divider-line" />
            <span className="id-divider-diamond" />
            <span className="id-divider-line" />
          </div>
        </div>

        {/* Content Area */}
        <div className="id-content skills-content-layout">
          {skillCategories.map((category, catIdx) => (
            <div key={catIdx} className="skills-category-box">
              <h4 className="skills-cat-title">{category.title}</h4>
              <div className="skills-list">
                {category.skills.map((skill, skillIdx) => (
                  <div key={skillIdx} className="skill-item">
                    <div className="skill-meta">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-percentage">{skill.level}%</span>
                    </div>
                    <div className="skill-bar-bg">
                      <div 
                        className="skill-bar-fill" 
                        style={{ '--skill-level': `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
