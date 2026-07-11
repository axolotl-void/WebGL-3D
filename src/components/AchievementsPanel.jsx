import { useState, useEffect, useCallback } from 'react';
import './IdentityPanel.css';

// ponytail: reuses IdentityPanel.css styles. Listens for cube-click index 1 (Achievements)
const CLOSE_DURATION = 400;

export default function AchievementsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeCertIdx, setActiveCertIdx] = useState(0);

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
      if (e.detail === 1) setIsOpen(true);
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

  const certificates = [
    {
      badge: '01',
      type: 'AWARD',
      icon: (
        <svg className="ach-card-cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
        </svg>
      ),
      title: 'Silver Award PEDAS 2025',
      subtitle: 'National APTIKOM Data Competition',
      infoIcon: (
        <svg className="ach-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      infoText: 'Jakarta, 2025',
      image: '/models/sertifikat/SERTIFIKAT-PEDAS_4_11zon.jpg',
      filename: 'SERTIFIKAT-PEDAS_4_11zon.jpg',
      theme: 'award-gold',
      details: {
        category: 'Award',
        event: 'PEDAS (Pesta Data Nasional) 2025',
        organizer: 'APTIKOM',
        date: '31 Aug — 06 Sep 2025',
        location: 'Jakarta, Indonesia',
        achievement: 'Silver Award'
      }
    },
    {
      badge: '02',
      type: 'PROJECT',
      icon: (
        <svg className="ach-card-cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      title: 'Lab Management System',
      subtitle: 'BTIK UBBG Project Completion',
      infoIcon: (
        <svg className="ach-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      infoText: 'Score: 90 / 100',
      image: '/models/sertifikat/SERTIFIKAT-BTIK _3_11zon.jpg',
      filename: 'SERTIFIKAT-BTIK _3_11zon.jpg',
      theme: 'project-cyan',
      details: {
        category: 'Project',
        event: 'Lab Management System',
        organizer: 'BTIK UBBG',
        date: '28 Jan 2026',
        location: 'Banda Aceh, Indonesia',
        achievement: 'Project Completion'
      }
    },
    {
      badge: '03',
      type: 'WORKSHOP',
      icon: (
        <svg className="ach-card-cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
      ),
      title: 'AI Connect Hybrid Workshop',
      subtitle: 'Vibes Coding "Coding tanpa Ngoding"',
      infoIcon: (
        <svg className="ach-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      infoText: '2025',
      image: '/models/sertifikat/SERTIFIKAT-VIBE-CODING-YOGI_1_11zon.jpg',
      filename: 'SERTIFIKAT-VIBE-CODING-YOGI_1_11zon.jpg',
      theme: 'workshop-purple',
      details: {
        category: 'Workshop',
        event: 'AI Connect Hybrid Workshop',
        organizer: 'Vibes Coding x Telkom Indonesia',
        date: '2025',
        location: 'Online / Hybrid',
        achievement: 'Certificate of Appreciation'
      }
    },
    {
      badge: '04',
      type: 'PARTICIPATION',
      icon: (
        <svg className="ach-card-cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: 'EXSIS Ramadhan 2025',
      subtitle: 'Expo dan Pekan Kansis Ramadhan 2025',
      infoIcon: (
        <svg className="ach-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      infoText: '30 SKK',
      image: '/models/sertifikat/SERTFIKAT-EXPO-USK_2_11zon.jpg',
      filename: 'SERTFIKAT-EXPO-USK_2_11zon.jpg',
      theme: 'part-green',
      details: {
        category: 'Participation',
        event: 'Expo dan Pekan Kansis Ramadhan 2025',
        organizer: 'Universitas Syiah Kuala',
        date: '28 Mar 2025',
        location: 'Darussalam, Banda Aceh',
        achievement: '30 SKK'
      }
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

        {/* Minimal Tech Header */}
        <div className="id-hud-header">
          <div className="id-hud-header-left">
            <span className="id-hud-module">04 / ACHIEVEMENTS MODULE</span>
          </div>
          <div className="id-hud-header-right">
            <span className="id-hud-slashes">///</span>
            <span className="id-hud-dots">•••••••</span>
          </div>
        </div>

        {/* Header Block */}
        <div className="ach-header-block">
          <h2 className="ach-large-title">ACHIEVEMENTS</h2>
          <p className="ach-subtitle">Verified records of awards, projects, workshops, and campus activities.</p>
        </div>

        {/* Interactive Dashboard Layout */}
        <div className="id-content ach-user-layout">
          
          {/* Left Grid: 4 Cards */}
          <div className="ach-cards-grid">
            {certificates.map((cert, idx) => (
              <div 
                key={idx} 
                className={`ach-item-card ${cert.theme} ${activeCertIdx === idx ? 'active' : ''}`}
                onClick={() => {
                  if (localStorage.getItem('isSoundOn') !== 'false') {
                    new Audio('/models/sound/click-elektrik-1.mp3').play().catch(() => {});
                  }
                  setActiveCertIdx(idx);
                }}
              >
                {/* Top header row inside card */}
                <div className="ach-card-top-row">
                  <span className="ach-card-badge">{cert.badge}</span>
                  <div className="ach-card-category-wrapper">
                    {cert.icon}
                    <span className="ach-card-cat-name">{cert.type}</span>
                  </div>
                </div>
                
                {/* Body row: Cert image thumbnail + text */}
                <div className="ach-card-body">
                  <div className="ach-card-img-thumbnail">
                    <img src={cert.image} alt={cert.title} className="ach-thumb-img" />
                  </div>
                  <div className="ach-card-text-wrapper">
                    <h4 className="ach-card-title">{cert.title}</h4>
                    <p className="ach-card-subtitle">{cert.subtitle}</p>
                  </div>
                </div>

                {/* Footer row: info badge + verify action */}
                <div className="ach-card-footer">
                  <div className="ach-card-info-badge">
                    {cert.infoIcon}
                    <span className="ach-info-text">{cert.infoText}</span>
                  </div>
                  <button className="ach-card-action-btn">
                    VIEW CERTIFICATE <span className="arrow">▸</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Section: Large Certificate Preview & Info Sheet */}
          <div className="ach-preview-section">
            <div className="ach-preview-header">
              <span className="ach-preview-title">CERTIFICATE PREVIEW</span>
              <div className="ach-preview-decor">
                <span className="decor-slash">/</span>
                <span className="decor-x">✕</span>
              </div>
            </div>

            {/* Glowing Large Certificate Frame */}
            <div className="ach-preview-frame">
              <div className="ach-frame-corner tl" />
              <div className="ach-frame-corner tr" />
              <div className="ach-frame-corner bl" />
              <div className="ach-frame-corner br" />
              <img src={certificates[activeCertIdx].image} alt="Certificate Full Preview" className="ach-large-img" />
            </div>

            {/* Specifications Details Grid */}
            <div className="ach-details-box">
              <h4 className="ach-details-title">DETAILS</h4>
              
              <div className="ach-details-grid">
                <div className="ach-detail-row">
                  <span className="label">Category</span>
                  <span className="value">{certificates[activeCertIdx].details.category}</span>
                </div>
                <div className="ach-detail-row">
                  <span className="label">Event</span>
                  <span className="value">{certificates[activeCertIdx].details.event}</span>
                </div>
                <div className="ach-detail-row">
                  <span className="label">Organizer</span>
                  <span className="value">{certificates[activeCertIdx].details.organizer}</span>
                </div>
                <div className="ach-detail-row">
                  <span className="label">Date</span>
                  <span className="value">{certificates[activeCertIdx].details.date}</span>
                </div>
                <div className="ach-detail-row">
                  <span className="label">Location</span>
                  <span className="value">{certificates[activeCertIdx].details.location}</span>
                </div>
                <div className="ach-detail-row">
                  <span className="label">Achievement</span>
                  <span className="value">{certificates[activeCertIdx].details.achievement}</span>
                </div>
              </div>

              {/* Download CTA Button */}
              <a 
                href={certificates[activeCertIdx].image} 
                download={certificates[activeCertIdx].filename} 
                className="ach-download-btn"
                onClick={() => {
                  if (localStorage.getItem('isSoundOn') !== 'false') {
                    new Audio('/models/sound/click-elektrik-1.mp3').play().catch(() => {});
                  }
                }}
              >
                <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                DOWNLOAD CERTIFICATE
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
