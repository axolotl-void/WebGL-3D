import React from 'react';

export default function ContactSection() {
  return (
    <div className="hud-card">
      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />
      
      <div className="hud-label">05 // Terminal</div>
      <h2 className="hud-title">CONTACT ME</h2>
      
      <p className="hud-desc">
        Interested in working together or want to check out my WebGL sandbox experiments? Shoot me an email or find me on Github and LinkedIn.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          EMAIL: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>hello@yogiportfolio.dev</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          GITHUB: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>github.com/yogiprasetyasadewa</span>
        </div>
      </div>
      
      <button className="hud-btn" onClick={() => document.getElementById('home').scrollIntoView()}>
        Back to Top
      </button>
    </div>
  );
}
