import React from 'react';

export default function UIOverlay() {
  return (
    <>
      {/* HUD Outer brackets */}
      <div className="ui-bracket tl" data-intro="corner" />
      <div className="ui-bracket tr" data-intro="corner" />
      <div className="ui-bracket bl" data-intro="corner" />
      <div className="ui-bracket br" data-intro="corner" />

      {/* Hero technical UI box */}
      <div className="hud-card" style={{ position: 'absolute', bottom: '10%', left: '10%' }}>
        <div className="hud-corner tl" />
        <div className="hud-corner tr" />
        <div className="hud-corner bl" />
        <div className="hud-corner br" />

        <div className="hud-label" data-intro="label">
          Core Module Initialized
        </div>
        
        <h1 className="hud-title">
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span style={{ display: 'inline-block' }} data-intro="title-word">CREATIVE</span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span style={{ display: 'inline-block' }} data-intro="title-word">WEBGL</span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span style={{ display: 'inline-block' }} data-intro="title-word">DEVELOPER</span>
          </span>
        </h1>

        <p className="hud-desc" data-intro="desc">
          Building cinematic web experiences, custom interactive shaders, and performant 3D graphics that live on the web canvas.
        </p>

        <div style={{ display: 'flex', gap: '15px' }} data-intro="cta">
          <button className="hud-btn" onClick={() => document.getElementById('projects').scrollIntoView()}>
            View Projects
          </button>
        </div>

        <div className="ui-stats-container" data-intro="stats">
          <div className="ui-stat-box">
            <div className="ui-stat-num" data-intro="stat-number" data-target="99" data-suffix="%">0%</div>
            <div className="ui-stat-lbl">WebGL Optimization</div>
          </div>
          <div className="ui-stat-box">
            <div className="ui-stat-num" data-intro="stat-number" data-target="60" data-suffix="fps">0fps</div>
            <div className="ui-stat-lbl">Render Frequency</div>
          </div>
        </div>
      </div>

      {/* HUD stats metadata details */}
      <div className="hero-hud-left">
        <div>SYS_STATUS: ACTIVE</div>
        <div>SYS_MEMORY: 16.4GB / 32GB</div>
        <div>LOC: 112.24.12.80</div>
      </div>

      <div className="hero-hud-right" data-intro="right-panel">
        <div>[02] ABOUT</div>
        <div>[03] PROJECTS</div>
        <div>[04] LAB</div>
        <div>[05] CONTACT</div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator" data-intro="scroll">
        <span>SCROLL DOWN</span>
        <div className="scroll-dot" />
      </div>
    </>
  );
}
