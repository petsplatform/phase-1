import { ArrowLeft, Clock, Sparkles, Rocket, Bell } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const pageLabels = {
  '/shop': 'Shop',
  '/contact': 'Contact',
  '/about': 'About',
  '/wishlist': 'Wishlist',
  '/login': 'Login',
  '/faq': 'FAQ',
}

function ComingSoon() {
  const location = useLocation()
  const pageName = pageLabels[location.pathname] || 'This Page'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="coming-soon-page">
      {/* Animated background particles */}
      <div className="coming-soon-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="coming-soon-particle"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--size': `${Math.random() * 6 + 2}px`,
              '--duration': `${Math.random() * 8 + 6}s`,
              '--delay': `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div
        className="coming-soon-content"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Animated icon */}
        <div className="coming-soon-icon-wrapper">
          <div className="coming-soon-icon-ring" />
          <div className="coming-soon-icon-ring coming-soon-icon-ring--delay" />
          <Rocket size={36} className="coming-soon-icon" />
        </div>

        {/* Kicker badge */}
        <div className="coming-soon-badge">
          <Sparkles size={14} />
          <span>Under Construction</span>
        </div>

        {/* Main heading */}
        <h1 className="coming-soon-title">
          <span className="coming-soon-title-page">{pageName}</span>
          <br />
          <span className="coming-soon-title-main">Coming Soon</span>
        </h1>

        {/* Description */}
        <p className="coming-soon-description">
          We're crafting something amazing for you and your furry friends. 
          This section is currently being built with love and care. 
          Stay tuned for exciting updates!
        </p>

        {/* Feature cards */}
        <div className="coming-soon-features">
          <div className="coming-soon-feature-card">
            <Clock size={20} className="coming-soon-feature-icon" />
            <span>Launching Soon</span>
          </div>
          <div className="coming-soon-feature-card">
            <Bell size={20} className="coming-soon-feature-icon" />
            <span>Stay Updated</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link to="/" className="coming-soon-back-btn">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>

        {/* Footer text */}
        <p className="coming-soon-footer-text">
          © {new Date().getFullYear()} Budget PetShop — Great things are on the way! Developed By{" "}
          <a
            href="https://techrabbit.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#176b59] hover:underline transition-colors"
          >
            Tech Rabbit
          </a>
        </p>
      </div>

      <style>{`
        .coming-soon-page {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
          background: #ffffff;
          font-family: var(--app-font-family-base, 'Inter', sans-serif);
        }

        .coming-soon-page::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 20%, rgba(138, 114, 199, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, rgba(138, 114, 199, 0.05) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, rgba(138, 114, 199, 0.03) 0%, transparent 60%);
          animation: comingSoonBgShift 12s ease-in-out infinite alternate;
        }

        @keyframes comingSoonBgShift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-3%, -3%) rotate(4deg); }
        }

        /* Particles */
        .coming-soon-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .coming-soon-particle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: rgba(138, 114, 199, 0.1);
          animation: comingSoonFloat var(--duration) ease-in-out var(--delay) infinite alternate;
        }

        @keyframes comingSoonFloat {
          0% { transform: translateY(0) scale(1); opacity: 0.2; }
          100% { transform: translateY(-40px) scale(1.3); opacity: 0.5; }
        }

        /* Content */
        .coming-soon-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 2rem 1.5rem;
          max-width: 580px;
          width: 100%;
        }

        /* Icon wrapper */
        .coming-soon-icon-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          margin-bottom: 2rem;
        }

        .coming-soon-icon-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(138, 114, 199, 0.3);
          animation: comingSoonPulse 3s ease-in-out infinite;
        }

        .coming-soon-icon-ring--delay {
          border-color: rgba(138, 114, 199, 0.15);
          animation-delay: 1.5s;
        }

        @keyframes comingSoonPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.35); opacity: 0; }
        }

        .coming-soon-icon {
          color: #8a72c7;
          filter: drop-shadow(0 0 12px rgba(138, 114, 199, 0.4));
          animation: comingSoonRocket 4s ease-in-out infinite;
        }

        @keyframes comingSoonRocket {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }

        /* Badge */
        .coming-soon-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.2rem;
          border-radius: 9999px;
          background: rgba(138, 114, 199, 0.08);
          border: 1px solid rgba(138, 114, 199, 0.18);
          color: #8a72c7;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        /* Title */
        .coming-soon-title {
          margin: 0 0 1.2rem;
          line-height: 1.15;
          font-family: var(--app-font-family-display, 'Manrope', sans-serif);
        }

        .coming-soon-title-page {
          display: inline-block;
          font-size: clamp(1rem, 2vw, 1.15rem);
          font-weight: 600;
          color: #999999;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }

        .coming-soon-title-main {
          display: inline-block;
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 800;
          color: #1a1a1a;
        }

        /* Description */
        .coming-soon-description {
          color: #555555;
          font-size: 1rem;
          line-height: 1.75;
          margin: 0 auto 2rem;
          max-width: 440px;
        }

        /* Feature cards */
        .coming-soon-features {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .coming-soon-feature-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.2rem;
          border-radius: 1rem;
          background: #f8f6fc;
          border: 1px solid rgba(138, 114, 199, 0.15);
          color: #333333;
          font-size: 0.82rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .coming-soon-feature-card:hover {
          background: #f0ecf7;
          border-color: rgba(138, 114, 199, 0.3);
          transform: translateY(-2px);
        }

        .coming-soon-feature-icon {
          color: #8a72c7;
        }

        /* Back button */
        .coming-soon-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.9rem 2.2rem;
          border-radius: 9999px;
          background: linear-gradient(135deg, #8a72c7, #7b5fbf);
          color: #ffffff !important;
          font-size: 0.92rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 32px rgba(138, 114, 199, 0.35), 0 0 0 0 rgba(138, 114, 199, 0);
          margin-bottom: 2.5rem;
        }

        .coming-soon-back-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 40px rgba(138, 114, 199, 0.45), 0 0 0 4px rgba(138, 114, 199, 0.12);
          background: linear-gradient(135deg, #7b5fbf, #6a4fb3);
        }

        .coming-soon-back-btn:active {
          transform: translateY(-1px) scale(0.98);
        }

        /* Footer text */
        .coming-soon-footer-text {
          color: #bbbbbb;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .coming-soon-features {
            flex-direction: column;
          }

          .coming-soon-feature-card {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default ComingSoon
