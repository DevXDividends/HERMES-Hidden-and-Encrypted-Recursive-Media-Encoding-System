import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Upload, X, FileText, Image, Music, Film,
  Lock, Key, Eye, EyeOff, Download, ChevronDown,
  CheckCircle, AlertCircle, Loader2, Copy, Shield
} from 'lucide-react'
import { encodeData, decodeData, generateKeypair, downloadBlob } from '../api'

// ── Constants ─────────────────────────────────────────────────────────────
const TYPES = [
  { value: 'text',  label: 'Text',  icon: FileText, color: '#8b5cf6', accept: '.txt',       desc: 'Plain text message' },
  { value: 'image', label: 'Image', icon: Image,    color: '#14b8a6', accept: '.png,.jpg',   desc: 'PNG or JPEG image' },
  { value: 'audio', label: 'Audio', icon: Music,    color: '#ec4899', accept: '.wav',        desc: 'WAV audio file' },
  { value: 'video', label: 'Video', icon: Film,     color: '#f59e0b', accept: '.mp4,.mkv',   desc: 'MP4 video file' },
]

const ENC_MODES = [
  { value: 'none',     label: 'None',     icon: Eye,    desc: 'No encryption — anyone can decode' },
  { value: 'password', label: 'Password', icon: Lock,   desc: 'AES-256-GCM + PBKDF2 key derivation' },
  { value: 'keypair',  label: 'Keypair',  icon: Shield, desc: 'RSA-OAEP + AES-256-GCM hybrid' },
]

// ── TypeSelect dropdown ────────────────────────────────────────────────────
function TypeSelect({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = TYPES.find(t => t.value === value)
  const Icon = selected?.icon

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}
      </label>
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileHover={{ borderColor: 'rgba(139,92,246,0.5)' }}
        style={{
          width: '100%', padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(139,92,246,0.5)' : 'var(--border-subtle)'}`,
          borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--text-primary)', transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={16} style={{ color: selected.color }} />}
          <span style={{ fontWeight: 500, fontSize: 14 }}>{selected?.label}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
              background: '#0f0f23', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            {TYPES.map(t => {
              const TIcon = t.icon
              return (
                <motion.button
                  key={t.value}
                  type="button"
                  onClick={() => { onChange(t.value); setOpen(false) }}
                  whileHover={{ background: 'rgba(139,92,246,0.1)' }}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', cursor: 'pointer',
                    background: t.value === value ? 'rgba(139,92,246,0.08)' : 'transparent',
                    border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--text-primary)', textAlign: 'left',
                  }}
                >
                  <TIcon size={15} style={{ color: t.color }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                  {t.value === value && <CheckCircle size={13} style={{ color: '#8b5cf6', marginLeft: 'auto' }} />}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── FileDropZone ───────────────────────────────────────────────────────────
function FileDropZone({ label, accept, file, onFile, color = '#8b5cf6' }) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  const handleChange = e => { if (e.target.files[0]) onFile(e.target.files[0]) }

  const formatSize = bytes => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}
      </label>
      <motion.label
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: dragging ? color : file ? `${color}50` : 'var(--border-subtle)',
          background: dragging ? `${color}08` : file ? `${color}05` : 'rgba(255,255,255,0.02)',
        }}
        style={{
          display: 'block', padding: '1.25rem',
          border: '1.5px dashed var(--border-subtle)',
          borderRadius: 12, cursor: 'pointer',
          textAlign: 'center', transition: 'all 0.2s',
        }}
      >
        <input type="file" accept={accept} onChange={handleChange} style={{ display: 'none' }} />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={15} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(file.size)}</div>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onFile(null) }}
              whileHover={{ background: 'rgba(239,68,68,0.15)' }}
              style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
            >
              <X size={14} />
            </motion.button>
          </div>
        ) : (
          <div>
            <Upload size={22} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span style={{ color, fontWeight: 500 }}>Click to browse</span> or drag & drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{accept}</div>
          </div>
        )}
      </motion.label>
    </div>
  )
}

// ── EncryptionPanel ────────────────────────────────────────────────────────
function EncryptionPanel({ mode, setMode, password, setPassword, operation,
  pubKey, setPubKey, privKey, setPrivKey, onGenerateKeypair, keypairLoading }) {
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={14} style={{ color: '#8b5cf6' }} />
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif' }}>Encryption</span>
        {mode !== 'none' && (
          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
            {mode === 'password' ? 'AES-256-GCM' : 'RSA-OAEP'}
          </span>
        )}
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
          {ENC_MODES.map(m => {
            const MIcon = m.icon
            return (
              <motion.button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: '0.5rem 0.25rem',
                  borderRadius: 8, border: `1px solid ${mode === m.value ? 'rgba(139,92,246,0.5)' : 'var(--border-subtle)'}`,
                  background: mode === m.value ? 'rgba(139,92,246,0.1)' : 'transparent',
                  cursor: 'pointer', color: mode === m.value ? '#a78bfa' : 'var(--text-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s',
                }}
              >
                <MIcon size={13} />
                <span style={{ fontSize: 10, fontWeight: 500 }}>{m.label}</span>
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'none' && (
            <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
              Hidden data has no encryption protection.
            </motion.p>
          )}

          {mode === 'password' && (
            <motion.div key="password" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={operation === 'encode' ? 'Enter encryption password...' : 'Enter decryption password...'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.875rem', borderRadius: 10, fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'keypair' && (
            <motion.div key="keypair" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {operation === 'encode' ? (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Receiver's public key (.pem)</label>
                  <textarea
                    placeholder="-----BEGIN PUBLIC KEY-----&#10;..."
                    value={pubKey}
                    onChange={e => setPubKey(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 10, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', resize: 'vertical' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Your private key (.pem)</label>
                  <textarea
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                    value={privKey}
                    onChange={e => setPrivKey(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 10, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', resize: 'vertical' }}
                  />
                </div>
              )}
              <motion.button
                type="button"
                onClick={onGenerateKeypair}
                disabled={keypairLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-ghost"
                style={{ padding: '0.5rem', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {keypairLoading ? <Loader2 size={13} className="animate-spin" /> : <Key size={13} />}
                Generate new keypair
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Result panel ───────────────────────────────────────────────────────────
function ResultPanel({ result, onClear }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
      style={{ borderColor: result.error ? 'rgba(239,68,68,0.3)' : 'rgba(20,184,166,0.3)' }}
    >
      <div style={{
        padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--border-subtle)',
        background: result.error ? 'rgba(239,68,68,0.05)' : 'rgba(20,184,166,0.05)',
      }}>
        {result.error
          ? <AlertCircle size={14} style={{ color: '#ef4444' }} />
          : <CheckCircle size={14} style={{ color: '#14b8a6' }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: result.error ? '#ef4444' : '#14b8a6' }}>
          {result.error ? 'Error' : 'Success'}
        </span>
        <button type="button" onClick={onClear} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {result.error && (
          <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.6 }}>{result.error}</p>
        )}
        {result.type === 'text' && !result.error && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Decoded message:</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.875rem', fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>
              {result.content}
            </div>
            <motion.button
              type="button"
              onClick={handleCopy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{ marginTop: 10, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Copy size={12} />
              {copied ? 'Copied!' : 'Copy text'}
            </motion.button>
          </div>
        )}
        {result.type === 'file' && !result.error && (
          <motion.button
            type="button"
            onClick={() => downloadBlob(result.blob, result.filename)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem', borderRadius: 10, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span><Download size={15} style={{ display: 'inline', marginRight: 8 }} />Download {result.filename}</span>
          </motion.button>
        )}
        {result.type === 'encode' && !result.error && (
          <motion.button
            type="button"
            onClick={() => downloadBlob(result.blob, result.filename)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem', borderRadius: 10, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span><Download size={15} style={{ display: 'inline', marginRight: 8 }} />Download {result.filename}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ── KeypairModal ───────────────────────────────────────────────────────────
function KeypairModal({ keypair, onClose }) {
  const [copiedPub, setCopiedPub]  = useState(false)
  const [copiedPriv, setCopiedPriv] = useState(false)

  const copyText = (text, setCopied) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPem = (content, filename) => {
    const blob = new Blob([content], { type: 'application/x-pem-file' })
    downloadBlob(blob, filename)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: '#0f0f23', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '1.5rem', maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17 }}>Keypair Generated</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Download both keys immediately</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.75rem', marginBottom: '1.25rem', fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
          ⚠️ Save both files now. Once you close this, the private key cannot be recovered.
        </div>

        {[
          { label: 'Public Key — share with sender', key: 'public_pem', filename: 'hermes_public.pem', color: '#14b8a6', copied: copiedPub, setCopied: setCopiedPub },
          { label: 'Private Key — keep this secret!', key: 'private_pem', filename: 'hermes_private.pem', color: '#8b5cf6', copied: copiedPriv, setCopied: setCopiedPriv },
        ].map(({ label, key, filename, color, copied, setCopied }) => (
          <div key={key} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em' }}>{label}</div>
            <pre style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0.75rem', fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', overflowX: 'auto', maxHeight: 100, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {keypair[key]}
            </pre>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <motion.button type="button" onClick={() => downloadPem(keypair[key], filename)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: `1px solid ${color}40`, background: `${color}10`, color, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Download size={12} style={{ display: 'inline', marginRight: 4 }} />Download
              </motion.button>
              <motion.button type="button" onClick={() => copyText(keypair[key], setCopied)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                {copied ? '✓' : <Copy size={12} />}
              </motion.button>
            </div>
          </div>
        ))}

        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: 10, fontSize: 14, marginTop: 4 }}>
          <span>Done</span>
        </motion.button>
      </motion.div>
    </div>
  )
}

// ── Main AppPage ───────────────────────────────────────────────────────────
export default function AppPage() {
  const navigate = useNavigate()

  const [operation,   setOperation]   = useState('encode')
  const [hiddenType,  setHiddenType]  = useState('text')
  const [carrierType, setCarrierType] = useState('image')

  const [secretText,  setSecretText]  = useState('')
  const [coverText,   setCoverText]   = useState('')
  const [hiddenFile,  setHiddenFile]  = useState(null)
  const [carrierFile, setCarrierFile] = useState(null)
  const [stegoFile,   setStegoFile]   = useState(null)

  const [encMode,   setEncMode]   = useState('none')
  const [password,  setPassword]  = useState('')
  const [pubKey,    setPubKey]    = useState('')
  const [privKey,   setPrivKey]   = useState('')

  const [loading,        setLoading]        = useState(false)
  const [keypairLoading, setKeypairLoading] = useState(false)
  const [result,         setResult]         = useState(null)
  const [keypair,        setKeypair]        = useState(null)

  const hiddenDef  = TYPES.find(t => t.value === hiddenType)
  const carrierDef = TYPES.find(t => t.value === carrierType)

  const needsCarrierFile = carrierType !== 'text'
  const needsHiddenFile  = hiddenType  !== 'text'
  const needsCoverText   = carrierType === 'text' && operation === 'encode'

  // ── Generate keypair ─────────────────────────────────────────────────────
  const handleGenerateKeypair = async () => {
    setKeypairLoading(true)
    try {
      const kp = await generateKeypair()
      setKeypair(kp)
    } catch {
      setResult({ error: 'Failed to generate keypair. Is the backend running?' })
    } finally {
      setKeypairLoading(false)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      if (operation === 'encode') {
        const res = await encodeData({
          hiddenType, carrierType, encMode,
          password, pubKey,
          coverText, secretText,
          carrierFile, hiddenFile,
        })

        const disposition = res.headers['content-disposition'] || ''
        const match = disposition.match(/filename=([^;]+)/)
        const filename = match ? match[1].replace(/"/g, '') : `hermes_output`

        setResult({ type: 'encode', blob: res.data, filename })
      } else {
        const res = await decodeData({
          hiddenType, carrierType, encMode,
          password, privKey, stegoFile,
        })

        if (res.type === 'text') {
          setResult({ type: 'text', content: res.content })
        } else {
          const disposition = res.headers?.['content-disposition'] || ''
          const match = disposition.match(/filename=([^;]+)/)
          const filename = match ? match[1].replace(/"/g, '') : `hidden_${hiddenType}`
          setResult({ type: 'file', blob: res.blob, filename })
        }
      }
    } catch (err) {
      const msg = err?.response?.data
        ? await err.response.data.text().then(t => { try { return JSON.parse(t).detail } catch { return t } })
        : err.message
      setResult({ error: msg || 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>

      {/* Ambient */}
      <div style={{ position: 'fixed', top: '30%', left: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '5%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)', background: 'rgba(3,3,10,0.8)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button type="button" onClick={() => navigate('/')} whileHover={{ x: -2 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={15} /> Back
          </motion.button>
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>🛰️ HERMES</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['encode', 'decode'].map(op => (
            <motion.button
              key={op}
              type="button"
              onClick={() => { setOperation(op); setResult(null) }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '0.4rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                border: `1px solid ${operation === op ? 'rgba(139,92,246,0.5)' : 'var(--border-subtle)'}`,
                background: operation === op ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: operation === op ? '#a78bfa' : 'var(--text-muted)',
                transition: 'all 0.2s', textTransform: 'capitalize',
              }}
            >
              {op}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '0.375rem' }}>
            {operation === 'encode' ? 'Hide your secret' : 'Reveal the hidden'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: '2rem' }}>
            {operation === 'encode'
              ? 'Choose what to hide, where to hide it, and how to protect it.'
              : 'Upload a stego file and extract the hidden content inside.'}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Type selectors */}
              {operation === 'encode' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="glass rounded-2xl" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <TypeSelect label="What to hide" value={hiddenType} onChange={v => { setHiddenType(v); setHiddenFile(null); setResult(null) }} />
                    <TypeSelect label="Hide inside" value={carrierType} onChange={v => { setCarrierType(v); setCarrierFile(null); setResult(null) }} />
                  </div>

                  {/* Combination badge */}
                  <div style={{ marginTop: '1rem', padding: '0.625rem 0.875rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <hiddenDef.icon size={12} style={{ color: hiddenDef.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{hiddenDef.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>hidden inside</span>
                    <carrierDef.icon size={12} style={{ color: carrierDef.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{carrierDef.label}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-purple)', fontSize: 10 }}>
                      {hiddenType.toUpperCase()} → {carrierType.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* File/text inputs */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass rounded-2xl" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {operation === 'encode' ? (
                  <>
                    {/* Hidden payload */}
                    {hiddenType === 'text' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Secret message</label>
                        <textarea
                          placeholder="Type your secret message here..."
                          value={secretText}
                          onChange={e => setSecretText(e.target.value)}
                          rows={4}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 10, fontSize: 14, resize: 'vertical', lineHeight: 1.6 }}
                        />
                      </div>
                    ) : (
                      <FileDropZone
                        label={`Hidden ${hiddenDef.label}`}
                        accept={hiddenDef.accept}
                        file={hiddenFile}
                        onFile={setHiddenFile}
                        color={hiddenDef.color}
                      />
                    )}

                    {/* Carrier */}
                    {carrierType === 'text' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Cover text</label>
                        <textarea
                          placeholder="Enter the visible cover text (this is what people will see)..."
                          value={coverText}
                          onChange={e => setCoverText(e.target.value)}
                          rows={4}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 10, fontSize: 14, resize: 'vertical', lineHeight: 1.6 }}
                        />
                      </div>
                    ) : (
                      <FileDropZone
                        label={`Carrier ${carrierDef.label}`}
                        accept={carrierDef.accept}
                        file={carrierFile}
                        onFile={setCarrierFile}
                        color={carrierDef.color}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <TypeSelect label="Hidden type" value={hiddenType} onChange={v => { setHiddenType(v); setResult(null) }} />
                      <TypeSelect label="Carrier type" value={carrierType} onChange={v => { setCarrierType(v); setStegoFile(null); setResult(null) }} />
                    </div>
                    <FileDropZone
                      label="Stego file to decode"
                      accept={carrierDef.accept}
                      file={stegoFile}
                      onFile={setStegoFile}
                      color={carrierDef.color}
                    />
                  </>
                )}
              </motion.div>

              {/* Result */}
              <AnimatePresence>
                {result && <ResultPanel result={result} onClear={() => setResult(null)} />}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary"
                style={{
                  width: '100%', padding: '1rem', borderRadius: 14,
                  fontSize: 15, fontWeight: 600,
                  boxShadow: '0 0 40px rgba(139,92,246,0.2)',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span>
                  {loading
                    ? <><Loader2 size={16} style={{ display: 'inline', marginRight: 8, animation: 'spin 1s linear infinite' }} />Processing...</>
                    : operation === 'encode' ? '🧬 Encode & Download' : '🔍 Decode & Reveal'}
                </span>
              </motion.button>
            </div>

            {/* Right column — encryption */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <EncryptionPanel
                mode={encMode} setMode={setEncMode}
                password={password} setPassword={setPassword}
                operation={operation}
                pubKey={pubKey} setPubKey={setPubKey}
                privKey={privKey} setPrivKey={setPrivKey}
                onGenerateKeypair={handleGenerateKeypair}
                keypairLoading={keypairLoading}
              />

              {/* Tips */}
              <div className="glass rounded-2xl" style={{ padding: '1.25rem', marginTop: '1rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Quick tips</div>
                {[
                  { icon: '🎯', text: 'Video → Video is the fastest combination' },
                  { icon: '🔒', text: 'Password mode needs same password to decode' },
                  { icon: '🗝️', text: 'Only the receiver generates the keypair' },
                  { icon: '📦', text: 'Cover image must be larger than hidden data' },
                ].map(tip => (
                  <div key={tip.text} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, fontSize: 12 }}>{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </form>
      </div>

      {/* Keypair modal */}
      <AnimatePresence>
        {keypair && <KeypairModal keypair={keypair} onClose={() => setKeypair(null)} />}
      </AnimatePresence>
    </div>
  )
}