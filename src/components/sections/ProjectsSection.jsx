import React from 'react';

export default function ProjectsSection() {
  const projects = [
    { title: 'Project Zenith', category: 'Three.js / GLSL Shaders' },
    { title: 'Aether Engine', category: 'React Three Fiber' },
    { title: 'Chronos HUD', category: 'Scroll Choreography / GSAP' }
  ];

  return (
    <div className="hud-card">
      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />
      
      <div className="hud-label">03 // Archives</div>
      <h2 className="hud-title">SELECTED WORK</h2>
      
      <p className="hud-desc">
        A list of creative projects demonstrating custom shaders, render passes, physics integration, and full scroll-linked interfaces.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
        {projects.map((p, index) => (
          <div 
            key={index}
            style={{
              padding: '12px 18px',
              background: 'rgba(0, 210, 255, 0.03)',
              borderLeft: '2px solid var(--accent-cyan)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600 }}>
                {p.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {p.category}
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              [0{index + 1}]
            </span>
          </div>
        ))}
      </div>
      
      <button className="hud-btn" onClick={() => document.getElementById('webgl').scrollIntoView()}>
        View Lab Experiments
      </button>
    </div>
  );
}
