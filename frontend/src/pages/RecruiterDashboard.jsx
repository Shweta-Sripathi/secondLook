import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import Dropzone from '../components/Dropzone';
import {
  Briefcase, Users, Upload, Plus, Eye, X, CheckCircle2, XCircle,
  ChevronDown, FileText, Star, TrendingUp, MapPin, ExternalLink,
  GraduationCap, Code, Mail, User
} from 'lucide-react';

function RecruiterDashboard() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [batchFiles, setBatchFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    if (selectedJobId) fetchApplicants(selectedJobId);
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const res = await API.get('/recruiter/job-descriptions');
      setJobs(res.data.data);
      if (res.data.data.length > 0 && !selectedJobId) {
        setSelectedJobId(res.data.data[0]._id);
      }
    } catch (err) { console.error('Error fetching jobs:', err); }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const res = await API.get(`/recruiter/job-applications/${jobId}`);
      setApplicants(res.data.data);
    } catch (err) { console.error('Error fetching applicants:', err); }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    try {
      const res = await API.post('/recruiter/job-description', { title, company, descriptionText });
      setSuccessMsg(`Job posting "${res.data.data.title}" created!`);
      setTitle(''); setCompany(''); setDescriptionText('');
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job posting');
    }
  };

  const handleBatchScan = async (e) => {
    e.preventDefault();
    if (!batchFiles || batchFiles.length === 0) { setError('Please select resume files'); return; }
    setError(''); setLoading(true); setBatchResults([]);
    const formData = new FormData();
    batchFiles.forEach(file => formData.append('resumes', file));
    if (selectedJobId) formData.append('jobId', selectedJobId);
    try {
      const res = await API.post('/recruiter/batch-scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccessMsg(res.data.message);
      setBatchResults(res.data.data || []);
      setLoading(false);
      if (selectedJobId) fetchApplicants(selectedJobId);
    } catch (err) {
      setError(err.response?.data?.message || 'Batch scan failed');
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--sl-success)';
    if (score >= 60) return 'var(--sl-warning)';
    return 'var(--sl-danger)';
  };

  const getStatusBadge = (score) => {
    if (score >= 80) return { cls: 'sl-badge sl-badge-success', text: 'Strong Match' };
    if (score >= 60) return { cls: 'sl-badge sl-badge-warning', text: 'Moderate' };
    return { cls: 'sl-badge sl-badge-danger', text: 'Low Match' };
  };

  const selectedJob = jobs.find(j => j._id === selectedJobId);
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { id: 'create', label: 'Post Job', icon: <Plus size={16} /> },
    { id: 'scan', label: 'Batch Scan', icon: <Upload size={16} /> },
  ];

  return (
    <div style={st.container}>
      <header style={st.header}>
        <div>
          <h1 style={st.title}>Welcome, {user?.name || 'Recruiter'} 👋</h1>
          <p style={st.subtitle}>Manage hiring pipeline and evaluate candidates</p>
        </div>
        <div style={st.headerStats}>
          <div style={st.headerStat}>
            <span style={st.headerStatNum}>{jobs.length}</span>
            <span style={st.headerStatLabel}>Job Posts</span>
          </div>
          <div style={st.headerStat}>
            <span style={st.headerStatNum}>{applicants.length}</span>
            <span style={st.headerStatLabel}>Applicants</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={st.tabBar}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ ...st.tab, ...(activeTab === t.id ? st.tabActive : {}) }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && <div style={st.errorBox}>{error}</div>}
      {successMsg && <div style={st.successBox}>{successMsg}</div>}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', animation: 'fadeRiseIn 400ms ease-out both' }}>
          {/* Left - Job selector & candidates */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Job selector */}
            <div className="sl-card">
              <div style={st.cardHeader}>
                <Briefcase size={18} style={{ color: 'var(--sl-primary)' }} />
                <h3 style={st.cardTitle}>Your Job Postings</h3>
              </div>
              <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                {jobs.map(j => (
                  <option key={j._id} value={j._id}>{j.title} — {j.company}</option>
                ))}
              </select>
              {selectedJob && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--sl-bg-gray-50)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {selectedJob.descriptionText}
                  </div>
                  {selectedJob.extractedSkills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                      {selectedJob.extractedSkills.map((sk, i) => (
                        <span key={i} className="sl-badge sl-badge-primary" style={{ fontSize: '10px' }}>{sk}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--sl-text-subtle)', marginTop: '8px' }}>
                    {selectedJob.applications?.length || 0} applications
                  </div>
                </div>
              )}
            </div>

            {/* All jobs list */}
            <div className="sl-card">
              <h3 style={st.sectionTitle}>All Postings ({jobs.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {jobs.map((j) => (
                  <div key={j._id} onClick={() => setSelectedJobId(j._id)}
                    style={{ ...st.jobItem, ...(j._id === selectedJobId ? { borderColor: 'var(--sl-primary)', background: 'var(--sl-primary-bg)' } : {}) }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sl-ink)' }}>{j.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--sl-primary)' }}>{j.company}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="sl-badge sl-badge-info">{j.applications?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Candidate ranking */}
          <div style={{ flex: 1.5, minWidth: '400px' }}>
            <div className="sl-card">
              <div style={st.cardHeader}>
                <Users size={18} style={{ color: 'var(--sl-primary)' }} />
                <h3 style={st.cardTitle}>Interested Candidates ({applicants.length})</h3>
              </div>

              {applicants.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={st.table}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--sl-border-color)' }}>
                        <th style={st.th}>Candidate</th>
                        <th style={st.th}>Score</th>
                        <th style={st.th}>Status</th>
                        <th style={st.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map((rep, idx) => {
                        const score = rep.scores?.overallScore || 0;
                        const badge = getStatusBadge(score);
                        const cand = rep.candidateId;
                        return (
                          <tr key={rep._id} style={{ borderBottom: '1px solid var(--sl-border-light)', transition: 'background 150ms ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--sl-bg-gray-50)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={st.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={st.candidateAvatar}>{cand?.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--sl-ink)', fontSize: '0.88rem' }}>{cand?.name || `Candidate #${idx + 1}`}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--sl-text-subtle)' }}>{cand?.email || ''}</div>
                                  {cand?.profile?.college && <div style={{ fontSize: '0.72rem', color: 'var(--sl-primary)' }}>{cand.profile.college}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ ...st.td, fontWeight: 700, color: getScoreColor(score) }}>
                              <span className="sl-tabular" style={{ fontSize: '1rem' }}>{score}%</span>
                            </td>
                            <td style={st.td}><span className={badge.cls}>{badge.text}</span></td>
                            <td style={st.td}>
                              <button onClick={() => setSelectedApplicant(rep)} className="sl-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                <Eye size={14} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Users size={36} style={{ color: 'var(--sl-text-subtle)', marginBottom: '10px' }} />
                  <h4 style={{ color: 'var(--sl-ink)', marginBottom: '4px' }}>No Candidates Yet</h4>
                  <p style={{ color: 'var(--sl-text-muted)', fontSize: '0.85rem' }}>Candidates who express interest in your job will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <div style={{ maxWidth: '650px', animation: 'fadeRiseIn 400ms ease-out both' }}>
          <div className="sl-card">
            <div style={st.cardHeader}>
              <Plus size={18} style={{ color: 'var(--sl-primary)' }} />
              <h3 style={st.cardTitle}>Create Job Posting</h3>
            </div>
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={st.label}>Job Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full-Stack Software Engineer" />
              </div>
              <div>
                <label style={st.label}>Company Name</label>
                <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Technologies" />
              </div>
              <div>
                <label style={st.label}>Job Requirements / Description</label>
                <textarea rows={6} required value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} placeholder="Paste the full job description or key requirements..." />
              </div>
              <button type="submit" className="sl-btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }}>
                <Plus size={16} /> Publish Job Posting
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SCAN TAB */}
      {activeTab === 'scan' && (
        <div style={{ maxWidth: '650px', animation: 'fadeRiseIn 400ms ease-out both' }}>
          <div className="sl-card">
            <div style={st.cardHeader}>
              <Upload size={18} style={{ color: 'var(--sl-primary)' }} />
              <h3 style={st.cardTitle}>Batch Resume Scan</h3>
            </div>
            <form onSubmit={handleBatchScan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={st.label}>Target Job Posting</label>
                <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                  <option value="">General Scan (No specific job)</option>
                  {jobs.map(j => (<option key={j._id} value={j._id}>{j.title} — {j.company}</option>))}
                </select>
              </div>
              <Dropzone onFileSelect={(files) => setBatchFiles(files)} isBatch={true} label="Drag multiple resumes or browse" />
              <button type="submit" className="sl-btn-primary" disabled={loading} style={{ padding: '12px', fontSize: '0.95rem' }}>
                {loading ? 'Evaluating...' : 'Evaluate Candidates'}
              </button>
            </form>
          </div>

          {batchResults.length > 0 && (
            <div className="sl-card" style={{ marginTop: '16px' }}>
              <h3 style={st.sectionTitle}><FileText size={16} style={{ color: 'var(--sl-primary)' }} /> Results ({batchResults.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {batchResults.map((r, i) => (
                  <div key={i} style={st.batchResultItem}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--sl-ink)' }}>{r.fileName}</span>
                      {r.error && <span style={{ fontSize: '0.75rem', color: 'var(--sl-danger)', marginLeft: '8px' }}>{r.error}</span>}
                    </div>
                    {r.overallScore != null && <span className="sl-badge sl-badge-primary sl-tabular">{r.overallScore}%</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <div style={st.modalOverlay} onClick={() => setSelectedApplicant(null)}>
          <div className="sl-card" style={st.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sl-ink)' }}>Candidate Profile</h3>
              <button onClick={() => setSelectedApplicant(null)} style={{ color: 'var(--sl-text-subtle)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}><X size={20} /></button>
            </div>

            {/* Candidate info */}
            {selectedApplicant.candidateId && (
              <div style={{ padding: '16px', background: 'var(--sl-bg-gray-50)', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ ...st.candidateAvatar, width: '48px', height: '48px', fontSize: '1.1rem' }}>
                    {selectedApplicant.candidateId.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sl-ink)' }}>{selectedApplicant.candidateId.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--sl-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} /> {selectedApplicant.candidateId.email}
                    </div>
                  </div>
                </div>

                {/* Profile details */}
                {selectedApplicant.candidateId.profile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {selectedApplicant.candidateId.profile.college && (
                      <div style={st.profileField}><GraduationCap size={12} /> {selectedApplicant.candidateId.profile.college}</div>
                    )}
                    {selectedApplicant.candidateId.profile.degree && (
                      <div style={st.profileField}><Star size={12} /> {selectedApplicant.candidateId.profile.degree}</div>
                    )}
                    {selectedApplicant.candidateId.profile.cgpa && (
                      <div style={st.profileField}>📊 CGPA: {selectedApplicant.candidateId.profile.cgpa}</div>
                    )}
                    {selectedApplicant.candidateId.profile.linkedin && (
                      <a href={selectedApplicant.candidateId.profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ ...st.profileField, color: 'var(--sl-primary)' }}>
                        <ExternalLink size={12} /> LinkedIn
                      </a>
                    )}
                    {selectedApplicant.candidateId.profile.leetcode && (
                      <a href={selectedApplicant.candidateId.profile.leetcode} target="_blank" rel="noopener noreferrer" style={{ ...st.profileField, color: 'var(--sl-warning)' }}>
                        <Code size={12} /> LeetCode
                      </a>
                    )}
                  </div>
                )}

                {/* Profile skills */}
                {selectedApplicant.candidateId.profile?.skills?.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sl-text-muted)', marginBottom: '4px' }}>PROFILE SKILLS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedApplicant.candidateId.profile.skills.map((sk, i) => (
                        <span key={i} className="sl-badge sl-badge-primary" style={{ fontSize: '10px' }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile projects */}
                {selectedApplicant.candidateId.profile?.projects?.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sl-text-muted)', marginBottom: '4px' }}>PROJECTS</div>
                    {selectedApplicant.candidateId.profile.projects.map((proj, i) => (
                      <div key={i} style={{ padding: '8px', background: 'var(--sl-bg-white)', borderRadius: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.82rem' }}>{proj.name}</strong>
                        {proj.techStack && <span style={{ fontSize: '0.72rem', color: 'var(--sl-primary)', marginLeft: '8px' }}>{proj.techStack}</span>}
                        {proj.description && <p style={{ fontSize: '0.78rem', color: 'var(--sl-text-muted)', margin: '2px 0 0 0' }}>{proj.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scores */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(selectedApplicant.scores?.overallScore || 0) }} className="sl-tabular">
                  {selectedApplicant.scores?.overallScore || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sl-text-muted)' }}>Overall</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sl-ink)' }} className="sl-tabular">
                  {selectedApplicant.scores?.atsScore || selectedApplicant.scores?.formattingScore || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sl-text-muted)' }}>ATS</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sl-ink)' }} className="sl-tabular">
                  {selectedApplicant.scores?.jobMatchScore || selectedApplicant.scores?.keywordMatchScore || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sl-text-muted)' }}>Job Match</div>
              </div>
            </div>

            {/* Skills */}
            {selectedApplicant.keywords?.foundKeywords?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={st.chipGroupTitle}><CheckCircle2 size={14} style={{ color: 'var(--sl-success)' }} /> Matched</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedApplicant.keywords.foundKeywords.map((sk, i) => <span key={i} className="sl-badge sl-badge-success">{sk}</span>)}
                </div>
              </div>
            )}

            {selectedApplicant.keywords?.missingKeywords?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={st.chipGroupTitle}><XCircle size={14} style={{ color: 'var(--sl-danger)' }} /> Missing</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedApplicant.keywords.missingKeywords.map((sk, i) => <span key={i} className="sl-badge sl-badge-danger">{sk}</span>)}
                </div>
              </div>
            )}

            {selectedApplicant.summary && (
              <div style={{ background: 'var(--sl-bg-gray-50)', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--sl-text-muted)', lineHeight: 1.6, margin: 0 }}>{selectedApplicant.summary}</p>
              </div>
            )}

            <button onClick={() => setSelectedApplicant(null)} className="sl-btn-primary" style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const st = {
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
  successBox: { background: 'var(--sl-success-light)', color: 'var(--sl-success-text)', padding: '12px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px', fontSize: '0.88rem' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--sl-ink)', margin: 0 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--sl-ink)', marginBottom: '14px' },
  label: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--sl-ink)', display: 'block', marginBottom: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 12px', color: 'var(--sl-text-muted)', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px', fontSize: '0.88rem' },
  chipGroupTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
  batchResultItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'var(--sl-bg-gray-50)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' },
  modalContent: { width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeRiseIn 300ms ease-out both' },
  candidateAvatar: { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--sl-primary) 0%, #7C3AED 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 },
  jobItem: { padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--sl-border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 150ms ease' },
  profileField: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--sl-text-muted)', padding: '4px 0' },
};

export default RecruiterDashboard;
