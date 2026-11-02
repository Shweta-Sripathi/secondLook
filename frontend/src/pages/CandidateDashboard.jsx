import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Dropzone from '../components/Dropzone';
import {
  FileText, Upload, Briefcase, ChevronRight, TrendingUp,
  CheckCircle2, XCircle, User, GraduationCap, Code, Lightbulb,
  ExternalLink, Sparkles, BookOpen, Save, Edit3, Star
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

  // Profile
  const [profileEdit, setProfileEdit] = useState(false);
  const [profile, setProfile] = useState({
    college: '', degree: '', cgpa: '', linkedin: '', leetcode: '',
    skills: [], projects: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ name: '', description: '', techStack: '', link: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => { fetchJobs(); fetchHistory(); }, []);
  useEffect(() => {
    if (user?.profile) {
      setProfile({
        college: user.profile.college || '', degree: user.profile.degree || '',
        cgpa: user.profile.cgpa || '', linkedin: user.profile.linkedin || '',
        leetcode: user.profile.leetcode || '', skills: user.profile.skills || [],
        projects: user.profile.projects || []
      });
    }
  }, [user]);

  const fetchJobs = async () => {
    try { const r = await API.get('/candidate/jobs'); setJobs(r.data.data); } catch (e) { console.error(e); }
  };
  const fetchHistory = async () => {
    try { const r = await API.get('/candidate/history'); setHistory(r.data.data || []); } catch (e) { console.error(e); }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a resume file.'); return; }
    setError(''); setLoading(true); setAnalysisResult(null);
    const fd = new FormData();
    fd.append('resume', file);
    try {
      let res;
      if (selectedJobId) {
        res = await API.post(`/candidate/analyze-job/${selectedJobId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (jobDescription) fd.append('jobDescription', jobDescription);
        res = await API.post('/candidate/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setAnalysisResult(res.data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed.');
    }
    setLoading(false);
  };

  const handleExpressInterest = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      const r = await API.post(`/candidate/express-interest/${jobId}`);
      setApplyMessage(p => ({ ...p, [jobId]: { ok: true, text: r.data.message } }));
    } catch (err) {
      setApplyMessage(p => ({ ...p, [jobId]: { ok: false, text: err.response?.data?.message || 'Failed' } }));
    }
    setApplyingJobId(null);
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true); setProfileMsg('');
    try {
      const r = await API.put('/auth/profile', { profile });
      updateUser(r.data.user);
      setProfileMsg('Profile saved!'); setProfileEdit(false);
    } catch { setProfileMsg('Save failed'); }
    setProfileSaving(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(p => ({ ...p, skills: [...p.skills, newSkill.trim()] })); setNewSkill('');
    }
  };
  const removeSkill = (i) => setProfile(p => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }));
  const addProject = () => {
    if (newProject.name.trim()) {
      setProfile(p => ({ ...p, projects: [...p.projects, { ...newProject }] }));
      setNewProject({ name: '', description: '', techStack: '', link: '' });
    }
  };
  const removeProject = (i) => setProfile(p => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));

  const scoreColor = (s) => s >= 80 ? '#059669' : s >= 60 ? '#D97706' : '#DC2626';
  const scoreTag = (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';

  // Extract keywords safely from either response shape
  const foundKw = analysisResult?.keywords?.foundKeywords || [];
  const missingKw = analysisResult?.keywords?.missingKeywords || [];
  const aiSuggestions = analysisResult?.aiSuggestions || [];

  const tabs = [
    { id: 'analyze', icon: <Upload size={15} />, label: 'Analyze' },
    { id: 'jobs', icon: <Briefcase size={15} />, label: `Jobs (${jobs.length})` },
    { id: 'profile', icon: <User size={15} />, label: 'Profile' },
  ];

  return (
    <div style={css.wrap}>
      {/* Header */}
      <div style={css.topBar}>
        <div>
          <h1 style={css.greeting}>Hi, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p style={css.greetSub}>Your AI career dashboard</p>
        </div>
        <div style={css.pills}>
          <Pill label="Scans" value={history.length} />
          <Pill label="Jobs" value={jobs.length} />
        </div>
      </div>

      {/* Tabs */}
      <div style={css.tabRow}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ ...css.tabBtn, ...(activeTab === t.id ? css.tabActive : {}) }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {error && <div style={css.alert}>{error}</div>}

      {/* ─── ANALYZE ─── */}
      {activeTab === 'analyze' && (
        <div style={{ animation: 'fadeRiseIn 350ms ease-out both' }}>
          <form onSubmit={handleAnalyze}>
            <div style={css.twoCol}>
              {/* Left: JD */}
              <Card>
                <CardHead icon={<FileText size={16} />} title="Target Job" />
                {jobs.length > 0 && (
                  <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} style={{ marginBottom: 10 }}>
                    <option value="">Custom JD (type below)</option>
                    {jobs.map(j => <option key={j._id} value={j._id}>{j.title} — {j.company}</option>)}
                  </select>
                )}
                {!selectedJobId ? (
                  <textarea rows={5} value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste a job description for targeted analysis…" style={{ resize: 'vertical', minHeight: 110 }} />
                ) : (
                  <div style={css.infoBox}>
                    <Sparkles size={14} /> Analyzing against: <b>{jobs.find(j => j._id === selectedJobId)?.title}</b>
                  </div>
                )}
              </Card>
              {/* Right: Upload */}
              <Card>
                <CardHead icon={<Upload size={16} />} title="Resume" />
                <Dropzone onFileSelect={f => setFile(f)} label="Drop your resume here" />
              </Card>
            </div>
            <div style={{ textAlign: 'center', margin: '18px 0' }}>
              <button type="submit" className="sl-btn-primary" disabled={loading}
                style={{ padding: '12px 40px', fontSize: '0.95rem', gap: 8 }}>
                <Sparkles size={16} />{loading ? 'Analyzing…' : 'Analyze Resume'}
              </button>
            </div>
          </form>

          {/* ─── Results ─── */}
          {analysisResult ? (
            <div style={css.resultsWrap}>
              {/* Scores row */}
              <div style={css.scoresRow}>
                <ScoreCircle label="Overall" score={analysisResult.scores?.overallScore} large />
                <ScoreCircle label="ATS" score={analysisResult.scores?.atsScore || 0} />
                <ScoreCircle label="Job Match" score={analysisResult.scores?.jobMatchScore || 0} />
              </div>

              {/* Job context */}
              {analysisResult.jobTitle && (
                <div style={{ ...css.card, borderLeft: '4px solid var(--sl-primary)', padding: '12px 18px', marginBottom: 14 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--sl-text-muted)' }}>Analyzed against </span>
                  <b style={{ color: 'var(--sl-ink)' }}>{analysisResult.jobTitle}</b>
                  <span style={{ color: 'var(--sl-text-muted)' }}> at {analysisResult.company}</span>
                </div>
              )}

              {/* Summary */}
              {analysisResult.summary && (
                <div style={{ ...css.card, borderLeft: '4px solid var(--sl-primary)', marginBottom: 14 }}>
                  <h4 style={css.miniHead}><Lightbulb size={14} /> AI Assessment</h4>
                  <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.86rem', lineHeight: 1.7, margin: 0 }}>{analysisResult.summary}</p>
                </div>
              )}

              {/* Skills grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {/* Matched */}
                <div style={css.card}>
                  <h4 style={{ ...css.miniHead, color: '#059669' }}><CheckCircle2 size={14} /> Matched Skills ({foundKw.length})</h4>
                  <div style={css.chipWrap}>
                    {foundKw.length > 0 ? foundKw.map((s, i) => (
                      <span key={i} style={css.chipGreen}>{s}</span>
                    )) : <span style={css.emptyNote}>No skills matched</span>}
                  </div>
                </div>
                {/* Missing */}
                <div style={css.card}>
                  <h4 style={{ ...css.miniHead, color: '#DC2626' }}><XCircle size={14} /> Missing Skills ({missingKw.length})</h4>
                  <div style={css.chipWrap}>
                    {missingKw.length > 0 ? missingKw.map((s, i) => (
                      <span key={i} style={css.chipRed}>{s}</span>
                    )) : <span style={css.emptyNote}>None — great match!</span>}
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div style={{ ...css.card, border: '1px solid var(--sl-primary-soft)', marginBottom: 14 }}>
                  <h4 style={css.miniHead}><Sparkles size={14} style={{ color: 'var(--sl-primary)' }} /> AI Suggestions to Improve</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {aiSuggestions.map((sg, i) => (
                      <div key={i} style={css.sugCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={sg.priority === 'high' ? css.badgeDanger : css.badgeWarn}>{sg.priority}</span>
                          <b style={{ fontSize: '0.85rem', color: 'var(--sl-ink)' }}>Learn {sg.skill}</b>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', margin: '0 0 4px' }}>{sg.suggestion}</p>
                        <div style={{ fontSize: '0.76rem', color: 'var(--sl-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <BookOpen size={11} /> {sg.resources}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {analysisResult.improvements?.length > 0 && (
                <div style={{ ...css.card, marginBottom: 14 }}>
                  <h4 style={css.miniHead}><TrendingUp size={14} style={{ color: 'var(--sl-warning)' }} /> Improvement Tips</h4>
                  {analysisResult.improvements.map((imp, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'var(--sl-bg-gray-50)', borderRadius: 8, marginBottom: 6 }}>
                      <span style={imp.priority === 'high' ? css.badgeDanger : css.badgeWarn}>{imp.priority}</span>
                      <b style={{ fontSize: '0.85rem', color: 'var(--sl-ink)', marginLeft: 6 }}>{imp.area}</b>
                      <p style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', margin: '2px 0 0' }}>{imp.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* History sidebar */}
              {history.length > 0 && (
                <div style={css.card}>
                  <h4 style={css.miniHead}>Recent Scans</h4>
                  {history.slice(0, 5).map((h, i) => (
                    <div key={h._id || i} style={css.histRow}>
                      <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, color: 'var(--sl-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.resumeId?.fileName || `Scan #${i + 1}`}
                      </span>
                      <span style={css.scorePill}>{h.scores?.overallScore || 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !loading && (
            <div style={{ ...css.card, textAlign: 'center', padding: '50px 20px' }}>
              <Upload size={36} style={{ color: 'var(--sl-text-subtle)', marginBottom: 10 }} />
              <h3 style={{ color: 'var(--sl-ink)', fontSize: '1.05rem', marginBottom: 4 }}>Upload & Analyze</h3>
              <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.88rem' }}>Drop your resume above and get instant AI-powered feedback.</p>
            </div>
          )}

          {loading && (
            <div style={{ ...css.card, textAlign: 'center', padding: '50px 20px' }}>
              <div style={css.spinner} />
              <p style={{ color: 'var(--sl-text-muted)', marginTop: 14 }}>Analyzing your resume with AI…</p>
            </div>
          )}
        </div>
      )}

      {/* ─── JOBS ─── */}
      {activeTab === 'jobs' && (
        <div style={{ animation: 'fadeRiseIn 350ms ease-out both' }}>
          {jobs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
              {jobs.map(job => (
                <div key={job._id} style={{ ...css.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sl-ink)', margin: 0 }}>{job.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--sl-primary)', fontWeight: 600, margin: 0 }}>{job.company}</p>
                    </div>
                    <span style={css.badgeGreen}>Open</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--sl-text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                    {job.descriptionText}
                  </p>
                  {job.extractedSkills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {job.extractedSkills.slice(0, 6).map((sk, i) => (
                        <span key={i} style={css.chipBlue}>{sk}</span>
                      ))}
                      {job.extractedSkills.length > 6 && <span style={{ fontSize: '0.7rem', color: 'var(--sl-text-subtle)' }}>+{job.extractedSkills.length - 6}</span>}
                    </div>
                  )}
                  <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--sl-border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => handleExpressInterest(job._id)} disabled={applyingJobId === job._id}
                      className="sl-btn-primary" style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem' }}>
                      {applyingJobId === job._id ? 'Applying…' : 'Express Interest'} <ChevronRight size={13} />
                    </button>
                  </div>
                  {applyMessage[job._id] && (
                    <div style={{ fontSize: '0.75rem', textAlign: 'center', color: applyMessage[job._id].ok ? '#059669' : '#DC2626' }}>
                      {applyMessage[job._id].text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...css.card, textAlign: 'center', padding: '50px' }}>
              <Briefcase size={36} style={{ color: 'var(--sl-text-subtle)' }} />
              <h3 style={{ color: 'var(--sl-ink)', marginTop: 10 }}>No Open Positions</h3>
              <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.88rem' }}>Check back later for new openings.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── PROFILE ─── */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: 780, margin: '0 auto', animation: 'fadeRiseIn 350ms ease-out both' }}>
          <div style={css.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={css.miniHead}><User size={16} /> My Profile</h3>
              <button onClick={() => profileEdit ? handleSaveProfile() : setProfileEdit(true)}
                className={profileEdit ? 'sl-btn-primary' : 'sl-btn-secondary'}
                disabled={profileSaving} style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
                {profileEdit ? (profileSaving ? 'Saving…' : <><Save size={13} /> Save</>) : <><Edit3 size={13} /> Edit</>}
              </button>
            </div>

            {profileMsg && <div style={{ padding: '8px 12px', background: profileMsg === 'Profile saved!' ? '#D1FAE5' : '#FEE2E2', borderRadius: 8, marginBottom: 14, fontSize: '0.82rem', color: profileMsg === 'Profile saved!' ? '#065F46' : '#991B1B' }}>{profileMsg}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field icon={<GraduationCap size={13} />} label="College" val={profile.college} set={v => setProfile(p => ({ ...p, college: v }))} edit={profileEdit} ph="e.g. IIT Delhi" />
              <Field label="Degree" val={profile.degree} set={v => setProfile(p => ({ ...p, degree: v }))} edit={profileEdit} ph="e.g. B.Tech CS" />
              <Field label="CGPA" val={profile.cgpa} set={v => setProfile(p => ({ ...p, cgpa: v }))} edit={profileEdit} ph="e.g. 8.5" />
              <Field icon={<ExternalLink size={13} />} label="LinkedIn" val={profile.linkedin} set={v => setProfile(p => ({ ...p, linkedin: v }))} edit={profileEdit} ph="https://linkedin.com/in/…" />
              <div style={{ gridColumn: '1/-1' }}>
                <Field icon={<Code size={13} />} label="LeetCode" val={profile.leetcode} set={v => setProfile(p => ({ ...p, leetcode: v }))} edit={profileEdit} ph="https://leetcode.com/…" />
              </div>
            </div>

            {/* Skills */}
            <div style={{ marginTop: 18 }}>
              <label style={css.fieldLbl}>Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {profile.skills.map((sk, i) => (
                  <span key={i} style={{ ...css.chipBlue, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {sk}
                    {profileEdit && <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>}
                  </span>
                ))}
                {profile.skills.length === 0 && <span style={css.emptyNote}>No skills added yet</span>}
              </div>
              {profileEdit && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill…" style={{ flex: 1 }} />
                  <button type="button" onClick={addSkill} className="sl-btn-secondary" style={{ padding: '8px 14px' }}>Add</button>
                </div>
              )}
            </div>

            {/* Projects */}
            <div style={{ marginTop: 18 }}>
              <label style={css.fieldLbl}>Projects</label>
              {profile.projects.map((proj, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--sl-bg-gray-50)', borderRadius: 10, marginBottom: 8, position: 'relative' }}>
                  <b style={{ fontSize: '0.88rem', color: 'var(--sl-ink)' }}>{proj.name}</b>
                  {proj.techStack && <span style={{ fontSize: '0.75rem', color: 'var(--sl-primary)', marginLeft: 8 }}>({proj.techStack})</span>}
                  {proj.description && <p style={{ fontSize: '0.8rem', color: 'var(--sl-text-muted)', margin: '3px 0 0' }}>{proj.description}</p>}
                  {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>{proj.link}</a>}
                  {profileEdit && <button onClick={() => removeProject(i)} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 18 }}>×</button>}
                </div>
              ))}
              {profileEdit && (
                <div style={{ padding: 14, background: 'var(--sl-bg-gray-50)', borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" />
                  <input value={newProject.techStack} onChange={e => setNewProject(p => ({ ...p, techStack: e.target.value }))} placeholder="Tech stack" />
                  <input value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" style={{ gridColumn: '1/-1' }} />
                  <input value={newProject.link} onChange={e => setNewProject(p => ({ ...p, link: e.target.value }))} placeholder="Link (optional)" />
                  <button type="button" onClick={addProject} className="sl-btn-primary" style={{ padding: 8 }}>Add Project</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tiny subcomponents ── */
function Card({ children, style }) {
  return <div style={{ background: '#fff', border: '1px solid var(--sl-border-color)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.04)', ...style }}>{children}</div>;
}
function CardHead({ icon, title }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
    <span style={{ color: 'var(--sl-primary)' }}>{icon}</span>
    <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--sl-ink)', margin: 0 }}>{title}</h3>
  </div>;
}
function Pill({ label, value }) {
  return <div style={{ textAlign: 'center', padding: '6px 16px', background: '#fff', borderRadius: 12, border: '1px solid var(--sl-border-color)' }}>
    <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: 'var(--sl-primary)' }}>{value}</span>
    <span style={{ fontSize: '0.68rem', color: 'var(--sl-text-muted)' }}>{label}</span>
  </div>;
}
function ScoreCircle({ label, score, large }) {
  const s = score || 0;
  const c = 2 * Math.PI * 38;
  const d = (s / 100) * c;
  const col = s >= 80 ? '#059669' : s >= 60 ? '#D97706' : '#DC2626';
  const tag = s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 92 92" width={large ? 100 : 78} height={large ? 100 : 78}>
        <circle cx="46" cy="46" r="38" fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle cx="46" cy="46" r="38" fill="none" stroke={col} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${d} ${c - d}`} transform="rotate(-90 46 46)" style={{ transition: 'stroke-dasharray .6s ease' }} />
        <text x="46" y="43" textAnchor="middle" style={{ fontSize: large ? '20px' : '17px', fontWeight: 800, fill: '#0F172A', fontFamily: 'Inter,sans-serif' }}>{s}</text>
        <text x="46" y="57" textAnchor="middle" style={{ fontSize: '8px', fill: '#94A3B8', fontFamily: 'Inter,sans-serif' }}>/ 100</text>
      </svg>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: col }}>{tag}</div>
      <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 1 }}>{label}</div>
    </div>
  );
}
function Field({ icon, label, val, set, edit, ph }) {
  return (
    <div>
      <label style={{ ...css.fieldLbl, display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{label}</label>
      <input value={val} onChange={e => set(e.target.value)} disabled={!edit} placeholder={ph} />
    </div>
  );
}

/* ── Styles ── */
const css = {
  wrap: { padding: '22px 20px', maxWidth: 1300, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 },
  greeting: { fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 },
  greetSub: { color: '#64748B', fontSize: '0.88rem', margin: 0 },
  pills: { display: 'flex', gap: 14 },
  tabRow: { display: 'flex', gap: 4, marginBottom: 18, background: '#fff', padding: 4, borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '8px 15px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 500, color: '#64748B', cursor: 'pointer', background: 'transparent', border: 'none', transition: 'all 150ms ease' },
  tabActive: { background: '#2563EB', color: '#fff', boxShadow: '0 2px 6px rgba(37,99,235,.3)' },
  alert: { background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 10, textAlign: 'center', marginBottom: 14, fontSize: '0.86rem' },
  twoCol: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  infoBox: { padding: '10px 14px', background: '#EFF6FF', borderRadius: 10, fontSize: '0.84rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: 6 },
  card: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.04)' },
  miniHead: { display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', margin: '0 0 10px' },
  resultsWrap: { display: 'flex', flexDirection: 'column', gap: 0 },
  scoresRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, padding: '18px 0 22px', flexWrap: 'wrap' },
  chipWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chipGreen: { display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: '#D1FAE5', color: '#065F46' },
  chipRed: { display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: '#FEE2E2', color: '#991B1B' },
  chipBlue: { display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: '#DBEAFE', color: '#2563EB' },
  sugCard: { padding: '12px 14px', background: '#EFF6FF', borderRadius: 10, borderLeft: '3px solid #2563EB' },
  badgeDanger: { display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, background: '#FEE2E2', color: '#991B1B' },
  badgeWarn: { display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E' },
  badgeGreen: { display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 600, background: '#D1FAE5', color: '#065F46' },
  histRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#F7F9FC', marginBottom: 5 },
  scorePill: { padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: '#DBEAFE', color: '#2563EB' },
  emptyNote: { fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' },
  fieldLbl: { fontSize: '0.8rem', fontWeight: 500, color: '#0F172A', marginBottom: 5, display: 'block' },
  spinner: { width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin .6s linear infinite', margin: '0 auto' },
};

export default CandidateDashboard;
