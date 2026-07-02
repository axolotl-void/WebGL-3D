import React from 'react';

export default function WebGLSection() {
  return (
    <div className="hud-card">
      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />
      
      <div className="hud-label">04 // Experimental</div>
      <h2 className="hud-title">THE WEBGL LAB</h2>
      
      <p className="hud-desc">
        Testing ground for interactive math. Here I build procedural noises (Simplex, Worley), custom post-processing effects, and particle physics engines that react to audio and hover dynamics.
      </p>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <div style={{
          flex: 1,
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 210, 255, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent-cyan)', marginBottom: '5px' }}>
            50K+
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Particles Simulated
          </div>
        </div>

        <div style={{
          flex: 1,
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 210, 255, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent-cyan)', marginBottom: '5px' }}>
            1.2ms
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CPU Frame Cost
          </div>
        </div>
      </div>

      <button className="hud-btn" style={{ marginTop: '25px' }} onClick={() => document.getElementById('contact').scrollIntoView()}>
        Get in Touch
      </button>
    </div>
  );
}
