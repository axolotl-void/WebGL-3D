import React from 'react';

export default function AboutSection() {
  return (
    <div className="hud-card">
      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />
      
      <div className="hud-label">02 // Profile</div>
      <h2 className="hud-title">ABOUT ME</h2>
      
      <p className="hud-desc">
        I am a frontend developer specializing in building visual experiences. By combining React, Three.js, and GLSL shaders, I turn flat designs into interactive, scroll-choreographed 3D websites.
      </p>

      <p className="hud-desc">
        My code is optimized to run smoothly at 60 FPS by utilizing GPU shaders, low-poly geometry, and optimal garbage collection.
      </p>
      
      <button className="hud-btn" onClick={() => document.getElementById('projects').scrollIntoView()}>
        Read Experience
      </button>
    </div>
  );
}
