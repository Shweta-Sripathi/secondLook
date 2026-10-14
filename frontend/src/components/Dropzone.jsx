import React, { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

function Dropzone({ onFileSelect, isBatch = false, label = "Upload Resume (.pdf or .docx)" }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragleave") {
      setDragActive(e.type === "dragenter");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
      onFileSelect(isBatch ? files : files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      onFileSelect(isBatch ? files : files[0]);
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(isBatch ? newFiles : (newFiles[0] || null));
  };

  return (
    <div
      style={{
        ...styles.dropzone,
        borderColor: dragActive ? 'var(--sl-primary)' : 'var(--sl-border-color)',
        backgroundColor: dragActive ? 'var(--sl-primary-bg)' : 'var(--sl-bg-gray-50)',
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={isBatch ? "resume-batch-input" : "resume-file-input"}
        multiple={isBatch}
        accept=".pdf,.docx,.doc"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <label htmlFor={isBatch ? "resume-batch-input" : "resume-file-input"} style={styles.label}>
        <div style={styles.iconWrap}>
          <Upload size={24} style={{ color: 'var(--sl-primary)' }} />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--sl-ink)', marginBottom: '4px', fontSize: '0.9rem' }}>{label}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--sl-text-muted)' }}>
          Drag & drop or <span style={{ color: 'var(--sl-primary)', fontWeight: 600, cursor: 'pointer' }}>browse</span>
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--sl-text-subtle)', marginTop: '4px' }}>
          Supports PDF, DOCX (max 10MB)
        </p>
      </label>
      {selectedFiles.length > 0 && (
        <div style={styles.fileList}>
          {selectedFiles.map((f, i) => (
            <div key={i} style={styles.fileItem}>
              <FileText size={14} style={{ color: 'var(--sl-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--sl-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--sl-text-subtle)', flexShrink: 0 }}>
                {Math.round(f.size / 1024)} KB
              </span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); removeFile(i); }}
                style={styles.removeBtn}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  dropzone: {
    border: '2px dashed var(--sl-border-color)',
    borderRadius: '12px',
    padding: '24px 20px',
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
  },
  label: {
    cursor: 'pointer',
    display: 'block',
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--sl-primary-bg)',
    marginBottom: '12px',
  },
  fileList: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    borderRadius: '8px',
    background: 'var(--sl-bg-white)',
    border: '1px solid var(--sl-border-light)',
  },
  removeBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    color: 'var(--sl-text-subtle)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    flexShrink: 0,
  },
};

export default Dropzone;
