import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Dropzone from '../components/Dropzone';
import {
  FileText, Upload, Briefcase, ChevronRight, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, User, GraduationCap, Code, Lightbulb,
  ExternalLink, Sparkles, BookOpen, Save, Edit3, Star, MapPin
} from 'lucide-react';

function CandidateDashboard() {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analyze');
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyMessage, setApplyMessage] = useState({});

  // Profile state
  const [profileEdit, setProfileEdit] = useState(false);
  const [profile, setProfile] = useState({
    college: '', degree: '', cgpa: '', linkedin: '', leetcode: '',
    skills: [], projects: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ name: '', description: '', techStack: '', link: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (user?.profile) {
      setProfile({
        college: user.profile.college || '',
        degree: user.profile.degree || '',
        cgpa: user.profile.cgpa || '',
        linkedin: user.profile.linkedin || '',
        leetcode: user.profile.leetcode || '',
        skills: user.profile.skills || [],
        projects: user.profile.projects || []
      });
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const res = await API.get('/candidate/jobs');
      setJobs(res.data.data);
    } catch (err) { console.error('Error fetching jobs:', err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await API.get('/candidate/history');
      const reports = res.data.data || [];
      setHistory(reports);
      if (reports.length > 0 && !analysisResult) {
        const r = reports[0];
        setAnalysisResult({
          scores: r.scores, keywords: r.keywords,
          bulletImprovements: r.bulletImprovements, summary: r.summary,
        });
      }
    } catch (err) { console.error('Error fetching history:', err); }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a PDF or DOCX resume file.'); return; }
    setError(''); setLoading(true);

    const formData = new FormData();
    formData.append('resume', file);
    if (selectedJobId) {
      // Analyze against recruiter job
      try {
        const res = await API.post(`/candidate/analyze-job/${selectedJobId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAnalysisResult(res.data);
        setLoading(false);
        fetchHistory();
      } catch (err) {
        setError(err.response?.data?.message || 'Analysis failed.');
        setLoading(false);
      }
    } else {
      if (jobDescription) formData.append('jobDescription', jobDescription);
      try {
        const res = await API.post('/candidate/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAnalysisResult(res.data);
        setLoading(false);
        fetchHistory();
      } catch (err) {
        setError(err.response?.data?.message || 'Resume analysis failed.');
        setLoading(false);
      }
    }
  };

  const handleExpressInterest = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      const res = await API.post(`/candidate/express-interest/${jobId}`);
      setApplyMessage(prev => ({ ...prev, [jobId]: { type: 'success', text: res.data.message } }));
      setApplyingJobId(null);
      fetchHistory();
    } catch (err) {
      setApplyMessage(prev => ({
        ...prev, [jobId]: { type: 'error', text: err.response?.data?.message || 'Failed' }
      }));
      setApplyingJobId(null);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await API.put('/auth/profile', { profile });
      updateUser(res.data.user);
      setProfileMsg('Profile saved!');
      setProfileEdit(false);
      setProfileSaving(false);
    } catch (err) {
      setProfileMsg('Save failed');
      setProfileSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(p => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (idx) => {
    setProfile(p => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }));
  };

  const addProject = () => {
    if (newProject.name.trim()) {
      setProfile(p => ({ ...p, projects: [...p.projects, { ...newProject }] }));
      setNewProject({ name: '', description: '', techStack: '', link: '' });
    }
  };

  const removeProject = (idx) => {
    setProfile(p => ({ ...p, projects: p.projects.filter((_, i) => i !== idx) }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--sl-success)';
    if (score >= 60) return 'var(--sl-warning)';
    return 'var(--sl-danger)';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const tabs = [
    { id: 'analyze', label: 'Analyze Resume', icon: <Upload size={16} /> },
    { id: 'jobs', label: `Job Board (${jobs.length})`, icon: <Briefcase size={16} /> },
    { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
  ];

  return (
    <div style={s.container}>
      {/* Welcome header */}
      <header style={s.header}>
        <div>
          <h1 style={s.title}>Welcome, {user?.name || 'Candidate'} 👋</h1>
          <p style={s.subtitle}>Your AI-powered career dashboard</p>
        </div>
        <div style={s.headerStats}>
          <div style={s.headerStat}>
            <span style={s.headerStatNum}>{history.length}</span>
            <span style={s.headerStatLabel}>Analyses</span>
          </div>
          <div style={s.headerStat}>
            <span style={s.headerStatNum}>{jobs.length}</span>
            <span style={s.headerStatLabel}>Open Jobs</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {/* ANALYZE TAB */}
      {activeTab === 'analyze' && (
        <div style={{ animation: 'fadeRiseIn 400ms ease-out both' }}>
          <form onSubmit={handleAnalyze}>
            <div style={s.uploadGrid}>
              <div className="sl-card" style={{ flex: 1 }}>
                <div style={s.cardHeader}>
                  <FileText size={18} style={{ color: 'var(--sl-primary)' }} />
                  <h3 style={s.cardTitle}>Job Description</h3>
                </div>
                {/* Recruiter job selector */}
                {jobs.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--sl-text-muted)', marginBottom: '4px', display: 'block' }}>
                      Analyze against recruiter posting:
                    </label>
                    <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                      <option value="">Custom JD (type below)</option>
                      {jobs.map(j => (
                        <option key={j._id} value={j._id}>{j.title} — {j.company}</option>
                      ))}
                    </select>
                  </div>
                )}
                {!selectedJobId && (
                  <textarea
                    rows={5}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste a custom job description for targeted analysis..."
                    style={{ resize: 'vertical', minHeight: '120px' }}
                  />
                )}
                {selectedJobId && (
                  <div style={{ padding: '12px', background: 'var(--sl-primary-bg)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--sl-primary)' }}>
                    <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Will analyze against: <strong>{jobs.find(j => j._id === selectedJobId)?.title}</strong>
                  </div>
                )}
              </div>

              <div className="sl-card" style={{ flex: 1 }}>
                <div style={s.cardHeader}>
                  <Upload size={18} style={{ color: 'var(--sl-primary)' }} />
                  <h3 style={s.cardTitle}>Upload Resume</h3>
                </div>
                <Dropzone onFileSelect={(f) => setFile(f)} label="Drop your resume here" />
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button type="submit" className="sl-btn-primary" disabled={loading} style={{ padding: '12px 36px', fontSize: '1rem' }}>
                <Sparkles size={18} />
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </div>
          </form>

          {/* Results */}
          <div style={s.resultsGrid}>
            <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analysisResult ? (
                <>
                  {/* Job context */}
                  {analysisResult.jobTitle && (
                    <div className="sl-card" style={{ borderLeft: '4px solid var(--sl-primary)', padding: '14px 20px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--sl-text-muted)', marginBottom: '2px' }}>Analyzed against</div>
                      <div style={{ fontWeight: 700, color: 'var(--sl-ink)' }}>{analysisResult.jobTitle} at {analysisResult.company}</div>
                    </div>
                  )}

                  {/* Scores */}
                  <div className="sl-card">
                    <h3 style={s.sectionTitle}><Star size={16} style={{ color: 'var(--sl-warning)' }} /> Score Summary</h3>
                    <div style={s.scoreCardsRow}>
                      <ScoreCard label="Overall" score={analysisResult.scores?.overallScore} getColor={getScoreColor} getLabel={getScoreLabel} large />
                      <ScoreCard label="ATS Score" score={analysisResult.scores?.atsScore || analysisResult.scores?.formattingScore || 0} getColor={getScoreColor} getLabel={getScoreLabel} />
                      <ScoreCard label="Job Match" score={analysisResult.scores?.jobMatchScore || analysisResult.scores?.keywordMatchScore || 0} getColor={getScoreColor} getLabel={getScoreLabel} />
                    </div>
                  </div>

                  {/* Summary */}
                  {analysisResult.summary && (
                    <div className="sl-card" style={{ borderLeft: '4px solid var(--sl-primary)' }}>
                      <h4 style={{ color: 'var(--sl-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        <Lightbulb size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        AI Assessment
                      </h4>
                      <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>{analysisResult.summary}</p>
                    </div>
                  )}

                  {/* Matched Skills */}
                  <div className="sl-card">
                    <h3 style={s.sectionTitle}>Skills Analysis</h3>
                    {analysisResult.keywords?.foundKeywords?.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={s.chipGroupTitle}><CheckCircle2 size={14} style={{ color: 'var(--sl-success)' }} /> Matched Skills ({analysisResult.keywords.foundKeywords.length})</h4>
                        <div style={s.chipGrid}>
                          {analysisResult.keywords.foundKeywords.map((sk, i) => (
                            <span key={i} className="sl-badge sl-badge-success">{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisResult.keywords?.missingKeywords?.length > 0 && (
                      <div>
                        <h4 style={s.chipGroupTitle}><XCircle size={14} style={{ color: 'var(--sl-danger)' }} /> Missing Skills ({analysisResult.keywords.missingKeywords.length})</h4>
                        <div style={s.chipGrid}>
                          {analysisResult.keywords.missingKeywords.map((sk, i) => (
                            <span key={i} className="sl-badge sl-badge-danger">{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Suggestions */}
                  {analysisResult.aiSuggestions?.length > 0 && (
                    <div className="sl-card" style={{ border: '1px solid var(--sl-primary-soft)' }}>
                      <h3 style={s.sectionTitle}><Sparkles size={16} style={{ color: 'var(--sl-primary)' }} /> AI Suggestions to Improve</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {analysisResult.aiSuggestions.map((sug, i) => (
                          <div key={i} style={s.suggestionItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span className={`sl-badge ${sug.priority === 'high' ? 'sl-badge-danger' : 'sl-badge-warning'}`}>{sug.priority}</span>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--sl-ink)' }}>Learn {sug.skill}</strong>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', margin: '0 0 6px 0' }}>{sug.suggestion}</p>
                            <div style={{ fontSize: '0.78rem', color: 'var(--sl-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <BookOpen size={12} /> {sug.resources}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {analysisResult.improvements?.length > 0 && (
                    <div className="sl-card">
                      <h3 style={s.sectionTitle}><TrendingUp size={16} style={{ color: 'var(--sl-warning)' }} /> Improvement Tips</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {analysisResult.improvements.map((imp, i) => (
                          <div key={i} style={s.improvementItem}>
                            <span className={`sl-badge ${imp.priority === 'high' ? 'sl-badge-danger' : imp.priority === 'medium' ? 'sl-badge-warning' : 'sl-badge-primary'}`}>{imp.priority}</span>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--sl-ink)' }}>{imp.area}</strong>
                            <p style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', margin: 0 }}>{imp.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="sl-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <Upload size={40} style={{ color: 'var(--sl-text-subtle)', marginBottom: '12px' }} />
                  <h3 style={{ color: 'var(--sl-ink)', fontSize: '1.1rem', marginBottom: '6px' }}>No Analysis Yet</h3>
                  <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.88rem' }}>Upload your resume above to get your ATS score and AI-powered analysis.</p>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.length > 0 && (
                <div className="sl-card">
                  <h3 style={s.sectionTitle}>Recent Analyses</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {history.slice(0, 5).map((rep, i) => (
                      <div key={rep._id || i} style={s.historyItem}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--sl-ink)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rep.resumeId?.fileName || `Analysis #${i + 1}`}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--sl-text-subtle)' }}>
                            {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <span className="sl-badge sl-badge-primary sl-tabular">{rep.scores?.overallScore || 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div style={{ animation: 'fadeRiseIn 400ms ease-out both' }}>
          {jobs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {jobs.map((job) => (
                <div key={job._id} className="sl-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sl-ink)', marginBottom: '2px' }}>{job.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--sl-primary)', fontWeight: 600 }}>{job.company}</p>
                    </div>
                    <span className="sl-badge sl-badge-success">Open</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.descriptionText}
                  </p>
                  {job.extractedSkills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {job.extractedSkills.slice(0, 5).map((sk, i) => (
                        <span key={i} className="sl-badge sl-badge-primary" style={{ fontSize: '10px' }}>{sk}</span>
                      ))}
                      {job.extractedSkills.length > 5 && (
                        <span style={{ fontSize: '10px', color: 'var(--sl-text-subtle)' }}>+{job.extractedSkills.length - 5} more</span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--sl-border-light)' }}>
                    <button
                      onClick={() => handleExpressInterest(job._id)}
                      disabled={applyingJobId === job._id}
                      className="sl-btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem', flex: 1 }}
                    >
                      {applyingJobId === job._id ? 'Applying...' : 'Express Interest'}
                      <ChevronRight size={14} />
                    </button>
                    {applyMessage[job._id] && (
                      <span style={{ fontSize: '0.75rem', color: applyMessage[job._id].type === 'error' ? 'var(--sl-danger)' : 'var(--sl-success-text)' }}>
                        {applyMessage[job._id].text}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sl-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Briefcase size={40} style={{ color: 'var(--sl-text-subtle)', marginBottom: '12px' }} />
              <h3 style={{ color: 'var(--sl-ink)' }}>No Open Positions</h3>
              <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.9rem' }}>Check back later for new job postings from recruiters.</p>
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeRiseIn 400ms ease-out both' }}>
          <div className="sl-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={s.sectionTitle}><User size={18} /> My Profile</h3>
              <button onClick={() => profileEdit ? handleSaveProfile() : setProfileEdit(true)} className={profileEdit ? 'sl-btn-primary' : 'sl-btn-secondary'} disabled={profileSaving} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                {profileEdit ? (profileSaving ? 'Saving...' : <><Save size={14} /> Save Profile</>) : <><Edit3 size={14} /> Edit Profile</>}
              </button>
            </div>

            {profileMsg && <div style={{ padding: '8px 14px', background: profileMsg === 'Profile saved!' ? 'var(--sl-success-light)' : 'var(--sl-danger-light)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: profileMsg === 'Profile saved!' ? 'var(--sl-success-text)' : 'var(--sl-danger-text)' }}>{profileMsg}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={s.fieldLabel}><GraduationCap size={14} /> College / University</label>
                <input value={profile.college} onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} disabled={!profileEdit} placeholder="e.g. IIT Delhi" />
              </div>
              <div>
                <label style={s.fieldLabel}>Degree</label>
                <input value={profile.degree} onChange={e => setProfile(p => ({ ...p, degree: e.target.value }))} disabled={!profileEdit} placeholder="e.g. B.Tech Computer Science" />
              </div>
              <div>
                <label style={s.fieldLabel}>CGPA</label>
                <input value={profile.cgpa} onChange={e => setProfile(p => ({ ...p, cgpa: e.target.value }))} disabled={!profileEdit} placeholder="e.g. 8.5" />
              </div>
              <div>
                <label style={s.fieldLabel}><ExternalLink size={14} /> LinkedIn</label>
                <input value={profile.linkedin} onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))} disabled={!profileEdit} placeholder="https://linkedin.com/in/..." />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.fieldLabel}><Code size={14} /> LeetCode Profile</label>
                <input value={profile.leetcode} onChange={e => setProfile(p => ({ ...p, leetcode: e.target.value }))} disabled={!profileEdit} placeholder="https://leetcode.com/..." />
              </div>
            </div>

            {/* Skills */}
            <div style={{ marginTop: '20px' }}>
              <label style={s.fieldLabel}>Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {profile.skills.map((sk, i) => (
                  <span key={i} className="sl-badge sl-badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {sk}
                    {profileEdit && <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>}
                  </span>
                ))}
              </div>
              {profileEdit && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill..." style={{ flex: 1 }} />
                  <button type="button" onClick={addSkill} className="sl-btn-secondary" style={{ padding: '8px 14px' }}>Add</button>
                </div>
              )}
            </div>

            {/* Projects */}
            <div style={{ marginTop: '20px' }}>
              <label style={s.fieldLabel}>Projects</label>
              {profile.projects.map((proj, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--sl-bg-gray-50)', borderRadius: '10px', marginBottom: '8px', position: 'relative' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--sl-ink)' }}>{proj.name}</strong>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', margin: '2px 0' }}>{proj.description}</p>
                  {proj.techStack && <div style={{ fontSize: '0.78rem', color: 'var(--sl-primary)' }}>Tech: {proj.techStack}</div>}
                  {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem' }}>{proj.link}</a>}
                  {profileEdit && <button onClick={() => removeProject(i)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--sl-danger)', cursor: 'pointer', fontSize: '16px' }}>×</button>}
                </div>
              ))}
              {profileEdit && (
                <div style={{ padding: '14px', background: 'var(--sl-bg-gray-50)', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" />
                  <input value={newProject.techStack} onChange={e => setNewProject(p => ({ ...p, techStack: e.target.value }))} placeholder="Tech stack" />
                  <input value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" style={{ gridColumn: '1 / -1' }} />
                  <input value={newProject.link} onChange={e => setNewProject(p => ({ ...p, link: e.target.value }))} placeholder="Project link (optional)" />
                  <button type="button" onClick={addProject} className="sl-btn-primary" style={{ padding: '8px' }}>Add Project</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score, getColor, getLabel, large }) {
  const sc = score || 0;
  const circ = 2 * Math.PI * 40;
  const dash = (sc / 100) * circ;
  return (
    <div style={{ textAlign: 'center', flex: large ? 1.2 : 1 }}>
      <svg viewBox="0 0 100 100" width={large ? 100 : 76} height={large ? 100 : 76}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--sl-bg-gray-200)" strokeWidth="6" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={getColor(sc)} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 600ms ease' }} />
        <text x="50" y="47" textAnchor="middle" style={{ fontSize: large ? '22px' : '18px', fontWeight: 800, fill: 'var(--sl-ink)', fontFamily: 'var(--sl-font-family)' }}>{sc}</text>
        <text x="50" y="62" textAnchor="middle" style={{ fontSize: '9px', fill: 'var(--sl-text-subtle)', fontFamily: 'var(--sl-font-family)' }}>/ 100</text>
      </svg>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: getColor(sc), marginTop: '4px' }}>{getLabel(sc)}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--sl-text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

const s = {
  container: { padding: '24px 20px', maxWidth: '1320px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '1.6rem', color: 'var(--sl-ink)', fontWeight: 800, letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--sl-text-muted)', fontSize: '0.9rem', marginTop: '2px' },
  headerStats: { display: 'flex', gap: '20px' },
  headerStat: { textAlign: 'center', padding: '8px 16px', background: 'var(--sl-bg-white)', borderRadius: '12px', border: '1px solid var(--sl-border-color)' },
  headerStatNum: { display: 'block', fontSize: '1.3rem', fontWeight: 800, color: 'var(--sl-primary)' },
  headerStatLabel: { fontSize: '0.7rem', color: 'var(--sl-text-muted)', fontWeight: 500 },
  tabBar: { display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--sl-bg-white)', padding: '4px', borderRadius: '12px', border: '1px solid var(--sl-border-color)', width: 'fit-content' },
  tab: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--sl-text-muted)', cursor: 'pointer', background: 'transparent', border: 'none', transition: 'all 150ms ease' },
  tabActive: { background: 'var(--sl-primary)', color: '#fff', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' },
  errorBox: { background: 'var(--sl-danger-light)', color: 'var(--sl-danger-text)', padding: '12px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px', fontSize: '0.88rem' },
  uploadGrid: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--sl-ink)', margin: 0 },
  resultsGrid: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--sl-ink)', marginBottom: '14px' },
  scoreCardsRow: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  chipGroupTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  suggestionItem: { padding: '14px', background: 'var(--sl-primary-bg)', borderRadius: '10px', borderLeft: '3px solid var(--sl-primary)' },
  improvementItem: { padding: '12px', background: 'var(--sl-bg-gray-50)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: 'var(--sl-bg-gray-50)', gap: '8px' },
  fieldLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 500, color: 'var(--sl-ink)', marginBottom: '6px' },
};

export default CandidateDashboard;
