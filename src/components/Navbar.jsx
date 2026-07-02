import React from 'react';

export default function Navbar() {
  return (
    <nav className="navbar-hud">
      <a href="#home" className="navbar-logo">
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 0 5px var(--accent-glow))' }}>
          <polygon points="50,10 90,85 10,85" stroke="var(--accent-cyan)" strokeWidth="8" fill="none" />
          <polygon points="50,30 75,80 25,80" fill="var(--accent-cyan)" opacity="0.3" />
        </svg>
        <span>W.GL</span>_PORTFOLIO
      </a>
      <div className="navbar-menu">
        <a href="#home" className="navbar-link active">Home</a>
        <a href="#about" className="navbar-link">About</a>
        <a href="#projects" className="navbar-link">Projects</a>
        <a href="#webgl" className="navbar-link">Lab</a>
        <a href="#contact" className="navbar-link">Contact</a>
      </div>
    </nav>
  );
}
