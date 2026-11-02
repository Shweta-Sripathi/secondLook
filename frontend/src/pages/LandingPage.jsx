import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Upload, ArrowRight, BarChart3, Target, Shield, Sparkles, Users, TrendingUp } from 'lucide-react';
import './LandingPage.css';

const TAGLINE = 'AI Resume Analyser';
const CHAR_DELAY = 55;
const HOLD_AFTER_TYPING = 600;
const LOGO_TRAVEL_DURATION = 800;
const STAGGER_DELAY = 80;

function shouldSkipAnimation() {
  if (typeof window === 'undefined') return true;
  if (sessionStorage.getItem('sl-anim-done')) return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return false;
}

export default function LandingPage() {
  const skipAll = useRef(shouldSkipAnimation());
  const [phase, setPhase] = useState(skipAll.current ? 'done' : 'logo-in');
  const [typedCount, setTypedCount] = useState(skipAll.current ? TAGLINE.length : 0);
  const [showSkip, setShowSkip] = useState(false);
  const [caretVisible, setCaretVisible] = useState(!skipAll.current);

  const finishAnimation = useCallback(() => {
    setPhase('done');
    setTypedCount(TAGLINE.length);
    setCaretVisible(false);
    sessionStorage.setItem('sl-anim-done', '1');
  }, []);

  useEffect(() => {
    if (skipAll.current) return;
    const t = setTimeout(() => setShowSkip(true), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (skipAll.current) return;
    let timeout;
    switch (phase) {
      case 'logo-in':
        timeout = setTimeout(() => setPhase('typing'), 800);
        break;
      case 'typing':
        if (typedCount < TAGLINE.length) {
          timeout = setTimeout(() => setTypedCount(c => c + 1), CHAR_DELAY);
        } else {
          timeout = setTimeout(() => {
            setCaretVisible(false);
            setTimeout(() => setPhase('travel'), 200);
          }, HOLD_AFTER_TYPING);
        }
        break;
      case 'travel':
        timeout = setTimeout(() => {
          finishAnimation();
        }, LOGO_TRAVEL_DURATION + STAGGER_DELAY * 3 + 200);
        break;
      default:
        break;
    }
    return () => clearTimeout(timeout);
  }, [phase, typedCount, finishAnimation]);

  const isDone = phase === 'done';
  const isTraveling = phase === 'travel' || isDone;

  return (
    <div className="landing-root" data-phase={phase}>
      {/* --- Centered animation stage --- */}
      {!isDone && (
        <div className="landing-stage" aria-hidden={isDone}>
          <div className={`landing-logo-center ${isTraveling ? 'traveling' : ''}`}>
            <img
              src="/logo.jpg"
              alt="secondLook"
              style={{
                width: 'min(280px, 65vw)',
                height: 'min(280px, 65vw)',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 20px 60px rgba(37, 99, 235, 0.15), 0 0 0 8px rgba(37, 99, 235, 0.08)',
              }}
            />
          </div>
          <div className={`landing-tagline ${isTraveling ? 'fade-up' : ''}`}>
            <span className="landing-tagline-text" aria-label={TAGLINE}>
              {TAGLINE.slice(0, typedCount)}
            </span>
            <span className={`landing-caret ${caretVisible ? 'blink' : 'hidden'}`} aria-hidden="true" />
          </div>
          {showSkip && !isDone && (
            <button className="landing-skip" onClick={finishAnimation} aria-label="Skip animation">
              Skip
            </button>
          )}
        </div>
      )}

      {/* --- Final page content --- */}
      {isDone && (
        <>
          {/* Navbar */}
          <nav className="landing-navbar" aria-label="Main navigation">
            <Link to="/" className="landing-navbar-logo" aria-label="secondLook home">
              <Logo size="sm" animate={false} />
            </Link>
            <div className="landing-navbar-actions">
              <Link to="/login" className="landing-nav-link">Sign in</Link>
              <Link to="/register" className="landing-nav-btn">Get started</Link>
            </div>
          </nav>

          {/* Hero */}
          <section className="landing-hero">
            <div className="landing-hero-right" style={{ overflow: 'hidden', minWidth: 0 }}>
              <div className="landing-preview-card" style={{ maxWidth: '100%' }}>
                <div className="landing-preview-badge">Live Preview</div>

                {/* Score ring */}
                <div className="landing-preview-score-section">
                  <div className="landing-score-ring" role="img" aria-label="Sample ATS score: 88 out of 100">
                    <svg viewBox="0 0 120 120" width="90" height="90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--sl-bg-gray-200)" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke="var(--sl-primary)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52 * 0.88} ${2 * Math.PI * 52 * 0.12}`}
                        transform="rotate(-90 60 60)"
                        className="landing-score-circle"
                      />
                      <text x="60" y="55" textAnchor="middle" className="landing-score-number">88</text>
                      <text x="60" y="72" textAnchor="middle" className="landing-score-label">/ 100</text>
                    </svg>
                    <div className="landing-score-caption">Overall ATS Score</div>
                  </div>

                  <div className="landing-stat-tiles">
                    <div className="landing-stat-tile">
                      <span className="landing-stat-label">Keyword Match</span>
                      <div className="landing-stat-bar"><div className="landing-stat-fill" style={{ width: '92%', backgroundColor: 'var(--sl-success)' }} /></div>
                      <span className="landing-stat-value">92%</span>
                    </div>
                    <div className="landing-stat-tile">
                      <span className="landing-stat-label">Semantic Fit</span>
                      <div className="landing-stat-bar"><div className="landing-stat-fill" style={{ width: '85%', backgroundColor: 'var(--sl-primary)' }} /></div>
                      <span className="landing-stat-value">85%</span>
                    </div>
                    <div className="landing-stat-tile">
                      <span className="landing-stat-label">Impact Score</span>
                      <div className="landing-stat-bar"><div className="landing-stat-fill" style={{ width: '78%', backgroundColor: 'var(--sl-warning)' }} /></div>
                      <span className="landing-stat-value">78%</span>
                    </div>
                  </div>
                </div>

                {/* Skills chips */}
                <div className="landing-preview-section">
                  <h4 className="landing-preview-section-title">✅ Skills Detected</h4>
                  <div className="landing-chip-grid">
                    {['React', 'Node.js', 'MongoDB', 'TypeScript', 'REST APIs', 'Git'].map(s => (
                      <span key={s} className="landing-chip landing-chip-found">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="landing-preview-section">
                  <h4 className="landing-preview-section-title">⚠️ Missing Keywords</h4>
                  <div className="landing-chip-grid">
                    {['Docker', 'CI/CD', 'AWS'].map(s => (
                      <span key={s} className="landing-chip landing-chip-missing">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-hero-left">
              <div className="landing-hero-badge">
                <Sparkles size={14} />
                Powered by Google Gemini AI
              </div>
              <h1 className="landing-hero-title">
                Smarter Matches.<br />
                <span className="landing-hero-title-accent">Less Searching.</span>
              </h1>
              <p className="landing-hero-subtitle">
                Let AI do the heavy lifting — from parsing job data to delivering 
                hyper-relevant roles tailored just for you. Get detailed ATS scores, 
                skill-gap analysis, and evidence-backed recommendations.
              </p>
              <div className="landing-hero-cta-group">
                <Link to="/register" className="landing-hero-cta">
                  <Upload size={18} strokeWidth={2.5} />
                  Upload Your Resume
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="landing-hero-cta-secondary">
                  Sign in as Recruiter
                </Link>
              </div>
            </div>
          </section>

          {/* Stats strip */}
          <section className="landing-stats">
            <div className="landing-stat-block">
              <span className="landing-stat-number">10K+</span>
              <span className="landing-stat-desc">Resumes Analyzed</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat-block">
              <span className="landing-stat-number">95%</span>
              <span className="landing-stat-desc">Accuracy Rate</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat-block">
              <span className="landing-stat-number">500+</span>
              <span className="landing-stat-desc">Companies Trust Us</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat-block">
              <span className="landing-stat-number">24/7</span>
              <span className="landing-stat-desc">AI Available</span>
            </div>
          </section>

          {/* Features */}
          <section className="landing-features">
            <div className="landing-features-header">
              <h2>Everything you need to land your dream job</h2>
              <p>Powerful AI tools for both candidates and recruiters</p>
            </div>
            <div className="landing-features-grid">
              <div className="landing-feature">
                <div className="landing-feature-icon"><BarChart3 size={24} /></div>
                <h3>ATS Score Analysis</h3>
                <p>Get separate readability and job-match scores with detailed breakdowns and actionable insights.</p>
              </div>
              <div className="landing-feature">
                <div className="landing-feature-icon"><Target size={24} /></div>
                <h3>Skill Gap Detection</h3>
                <p>Precisely identify matched and missing skills with AI-powered learning suggestions and resources.</p>
              </div>
              <div className="landing-feature">
                <div className="landing-feature-icon"><Users size={24} /></div>
                <h3>Recruiter Dashboard</h3>
                <p>Post jobs, receive candidate interest, and view ranked applicants with detailed profiles.</p>
              </div>
              <div className="landing-feature">
                <div className="landing-feature-icon"><TrendingUp size={24} /></div>
                <h3>AI Suggestions</h3>
                <p>Get personalized improvement tips, learning resources, and career guidance powered by Gemini.</p>
              </div>
              <div className="landing-feature">
                <div className="landing-feature-icon"><Shield size={24} /></div>
                <h3>Privacy First</h3>
                <p>Your resume data stays private and secure. Full control over what recruiters can see.</p>
              </div>
              <div className="landing-feature">
                <div className="landing-feature-icon"><Sparkles size={24} /></div>
                <h3>Smart Matching</h3>
                <p>Analyze your resume against specific job descriptions posted by real recruiters.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="landing-footer">
            <div className="landing-footer-inner">
              <Logo size="xs" animate={false} />
              <p>© 2026 secondLook. AI-powered resume analysis platform.</p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
