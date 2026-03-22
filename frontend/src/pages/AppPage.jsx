import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Upload, X, FileText, Image, Music, Film,
  Lock, Key, Eye, EyeOff, Download, ChevronDown,
  CheckCircle, AlertCircle, Loader2, Copy, Shield, Zap
} from 'lucide-react'
import { encodeData, decodeData, generateKeypair, downloadBlob } from '../api'

const TYPES = [
  { value: 'text',  label: 'Text',  icon: FileText, color: '#8b5cf6', accept: '.txt',     desc: 'Plain text message' },
  { value: 'image', label: 'Image', icon: Image,    color: '#14b8a6', accept: '.png,.jpg', desc: 'PNG or JPEG image' },
  { value: 'audio', label: 'Audio', icon: Music,    color: '#ec4899', accept: '.wav',      desc: 'WAV audio file' },
  { value: 'video', label: 'Video', icon: Film,     color: '#f59e0b', accept: '.mp4,.mkv', desc: 'MP4 video file' },
]

const ENC_MODES = [
  { value: 'none',     label: 'None',     icon: Eye,    desc: 'No encryption' },
  { value: 'password', label: 'Password', icon: Lock,   desc: 'AES-256-GCM' },
  { value: 'keypair',  label: 'Keypair',  icon: Shield, desc: 'RSA-OAEP' },
]

// ── Animated background ────────────────────────────────────────────────────
function AppBackground() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    let raf

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.5 + 0.2,
      a: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.002 + 0.0005,
      drift: (Math.random() - 0.5) * 0.04,
    }))

    const shoots = Array.from({ length: 3 }, () => ({
      x: Math.random() * w * 0.8, y: Math.random() * h * 0.4,
      progress: 0, len: 100 + Math.random() * 80,
      speed: 5 + Math.random() * 5, alpha: 0,
      angle: Math.PI / 5, wait: Math.random() * 500 + 200,
      state: 'wait',
    }))

    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vy: 0.15 + Math.random() * 0.25,
      a: Math.random() * Math.PI * 2,
      char: Math.random() > 0.5 ? '1' : '0',
      color: Math.random() > 0.5 ? '139,92,246' : '20,184,166',
    }))

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // Nebula blobs
      ;[[w*0.1, h*0.2, 350, '80,40,160'], [w*0.85, h*0.7, 300, '10,120,120'], [w*0.5, h*0.9, 250, '120,30,180']].forEach(([nx,ny,nr,rgb]) => {
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr)
        g.addColorStop(0, `rgba(${rgb},0.06)`)
        g.addColorStop(1, `rgba(${rgb},0)`)
        ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI*2)
        ctx.fillStyle = g; ctx.fill()
      })

      // Stars
      stars.forEach(s => {
        s.a += s.speed; s.x += s.drift
        if (s.x > w) s.x = 0; if (s.x < 0) s.x = w
        const b = Math.sin(s.a) * 0.5 + 0.5
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(200,210,255,${b * 0.6})`; ctx.fill()
        if (s.r > 1.2 && b > 0.8) {
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r*3, 0, Math.PI*2)
          ctx.fillStyle = `rgba(160,130,255,${(b-0.8)*0.08})`; ctx.fill()
        }
      })

      // Shooting stars
      shoots.forEach((s, i) => {
        if (s.state === 'wait') { if (--s.wait <= 0) s.state = 'in' }
        else {
          s.progress += s.speed
          const cx = s.x + Math.cos(s.angle)*s.progress
          const cy = s.y + Math.sin(s.angle)*s.progress
          const tx = cx - Math.cos(s.angle)*s.len
          const ty = cy - Math.sin(s.angle)*s.len
          s.alpha = Math.min(0.7, s.progress/20)
          const g = ctx.createLinearGradient(tx, ty, cx, cy)
          g.addColorStop(0, `rgba(255,255,255,0)`)
          g.addColorStop(1, `rgba(255,255,255,${s.alpha})`)
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(cx, cy)
          ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke()
          if (s.progress > s.len + 250) {
            shoots[i] = { x: Math.random()*w*0.8, y: Math.random()*h*0.4, progress: 0, len: 100+Math.random()*80, speed: 5+Math.random()*5, alpha: 0, angle: Math.PI/5, wait: Math.random()*600+300, state: 'wait' }
          }
        }
      })

      // Binary particles
      particles.forEach(p => {
        p.y += p.vy; p.a += 0.005
        if (p.y > h + 20) { p.y = -20; p.x = Math.random()*w }
        ctx.font = '9px JetBrains Mono, monospace'
        ctx.fillStyle = `rgba(${p.color},${Math.sin(p.a)*0.04+0.03})`
        ctx.fillText(p.char, p.x, p.y)
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ── TypeSelect ─────────────────────────────────────────────────────────────
function TypeSelect({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = TYPES.find(t => t.value === value)
  const Icon = selected?.icon

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: open ? 200 : 10 }}>
      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}
      </label>
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileHover={{ borderColor: 'rgba(139,92,246,0.6)' }}
        style={{
          width: '100%', padding: '0.875rem 1.125rem',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--text-primary)', transition: 'all 0.2s',
          boxShadow: open ? '0 0 20px rgba(139,92,246,0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {Icon && (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${selected.color}18`, border: `1px solid ${selected.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={15} style={{ color: selected.color }} />
            </div>
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{selected?.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected?.desc}</div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              zIndex: 9999,
              background: '#0d0d20',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1)',
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
                    width: '100%', padding: '0.875rem 1.125rem', cursor: 'pointer',
                    background: t.value === value ? 'rgba(139,92,246,0.08)' : 'transparent',
                    border: 'none', display: 'flex', alignItems: 'center', gap: 12,
                    color: 'var(--text-primary)', textAlign: 'left',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${t.color}15`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TIcon size={14} style={{ color: t.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                  {t.value === value && <CheckCircle size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />}
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
    const f = e.dataTransfer.files[0]; if (f) onFile(f)
  }, [onFile])
  const formatSize = b => b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`

  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}
      </label>
      <motion.label
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{ borderColor: dragging ? color : file ? `${color}60` : 'rgba(255,255,255,0.08)', background: dragging ? `${color}08` : file ? `${color}05` : 'rgba(255,255,255,0.02)' }}
        style={{ display: 'block', padding: file ? '1rem 1.25rem' : '2rem 1.25rem', border: '1.5px dashed rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
      >
        <input type="file" accept={accept} onChange={e => e.target.files[0] && onFile(e.target.files[0])} style={{ display: 'none' }} />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={16} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{formatSize(file.size)}</div>
              </div>
            </div>
            <motion.button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onFile(null) }} whileHover={{ background: 'rgba(239,68,68,0.15)' }}
              style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
              <X size={14} />
            </motion.button>
          </div>
        ) : (
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Upload size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span style={{ color, fontWeight: 600 }}>Click to browse</span> or drag & drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{accept}</div>
          </div>
        )}
      </motion.label>
    </div>
  )
}

// ── EncryptionPanel ────────────────────────────────────────────────────────
function EncryptionPanel({ mode, setMode, password, setPassword, operation, pubKey, setPubKey, privKey, setPrivKey, onGenerateKeypair, keypairLoading }) {
  const [showPw, setShowPw] = useState(false)
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={13} style={{ color: '#8b5cf6' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Encryption</span>
        {mode !== 'none' && (
          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 10px', borderRadius: 100, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(139,92,246,0.2)' }}>
            {mode === 'password' ? 'AES-256-GCM' : 'RSA-OAEP'}
          </span>
        )}
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
          {ENC_MODES.map(m => {
            const MIcon = m.icon
            return (
              <motion.button key={m.value} type="button" onClick={() => setMode(m.value)} whileTap={{ scale: 0.97 }}
                style={{ flex: 1, padding: '0.625rem 0.25rem', borderRadius: 10, border: `1px solid ${mode === m.value ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)'}`, background: mode === m.value ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', color: mode === m.value ? '#a78bfa' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}>
                <MIcon size={14} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{m.label}</span>
              </motion.button>
            )
          })}
        </div>
        <AnimatePresence mode="wait">
          {mode === 'none' && (
            <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0', margin: 0 }}>
              Hidden data has no encryption protection.
            </motion.p>
          )}
          {mode === 'password' && (
            <motion.div key="pw" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder={operation === 'encode' ? 'Encryption password...' : 'Decryption password...'} value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 2.75rem 0.75rem 1rem', borderRadius: 12, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </motion.div>
          )}
          {mode === 'keypair' && (
            <motion.div key="kp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{operation === 'encode' ? "Receiver's public key" : 'Your private key'}</label>
                <textarea placeholder={operation === 'encode' ? '-----BEGIN PUBLIC KEY-----\n...' : '-----BEGIN PRIVATE KEY-----\n...'} value={operation === 'encode' ? pubKey : privKey}
                  onChange={e => operation === 'encode' ? setPubKey(e.target.value) : setPrivKey(e.target.value)} rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 10, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', resize: 'vertical', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <motion.button type="button" onClick={onGenerateKeypair} disabled={keypairLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ padding: '0.625rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {keypairLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={13} />}
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
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: result.error ? 'rgba(239,68,68,0.05)' : 'rgba(20,184,166,0.05)', border: `1px solid ${result.error ? 'rgba(239,68,68,0.3)' : 'rgba(20,184,166,0.3)'}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {result.error ? <AlertCircle size={14} style={{ color: '#ef4444' }} /> : <CheckCircle size={14} style={{ color: '#14b8a6' }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: result.error ? '#ef4444' : '#14b8a6' }}>{result.error ? 'Error' : 'Success'}</span>
        <button type="button" onClick={onClear} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {result.error && <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.6, margin: 0 }}>{result.error}</p>}
        {result.type === 'text' && !result.error && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Decoded message:</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.875rem', fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 180, overflowY: 'auto' }}>{result.content}</div>
            <button type="button" onClick={() => { navigator.clipboard.writeText(result.content); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              style={{ marginTop: 10, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Copy size={12} />{copied ? 'Copied!' : 'Copy text'}
            </button>
          </div>
        )}
        {(result.type === 'file' || result.type === 'encode') && !result.error && (
          <motion.button type="button" onClick={() => downloadBlob(result.blob, result.filename)} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
            style={{ width: '100%', padding: '0.875rem', borderRadius: 12, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>
            <Download size={15} /> Download {result.filename}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ── Keypair Modal ──────────────────────────────────────────────────────────
function KeypairModal({ keypair, onClose }) {
  const [copiedPub, setCopiedPub] = useState(false)
  const [copiedPriv, setCopiedPriv] = useState(false)
  const dl = (content, filename) => { const blob = new Blob([content], { type: 'application/x-pem-file' }); downloadBlob(blob, filename) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: '#0c0c1e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 22, padding: '1.75rem', maxWidth: 500, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, margin: 0 }}>Keypair Generated</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, marginBottom: 0 }}>Download both keys immediately</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
          ⚠️ Save both files now. Once closed, the private key cannot be recovered.
        </div>
        {[
          { label: 'Public Key — share with sender', key: 'public_pem', filename: 'hermes_public.pem', color: '#14b8a6', copied: copiedPub, setCopied: setCopiedPub },
          { label: 'Private Key — keep secret!', key: 'private_pem', filename: 'hermes_private.pem', color: '#8b5cf6', copied: copiedPriv, setCopied: setCopiedPriv },
        ].map(({ label, key, filename, color, copied, setCopied }) => (
          <div key={key} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
            <pre style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.75rem', fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', overflowX: 'auto', maxHeight: 90, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
              {keypair[key]}
            </pre>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <motion.button type="button" onClick={() => dl(keypair[key], filename)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: `1px solid ${color}40`, background: `${color}10`, color, cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={12} /> Download
              </motion.button>
              <motion.button type="button" onClick={() => { navigator.clipboard.writeText(keypair[key]); setCopied(true); setTimeout(() => setCopied(false), 2000) }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                {copied ? '✓' : <Copy size={12} />}
              </motion.button>
            </div>
          </div>
        ))}
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ width: '100%', padding: '0.75rem', borderRadius: 12, fontSize: 14, background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, marginTop: 4 }}>
          Done
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
  const [encMode,     setEncMode]     = useState('none')
  const [password,    setPassword]    = useState('')
  const [pubKey,      setPubKey]      = useState('')
  const [privKey,     setPrivKey]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [keypairLoading, setKeypairLoading] = useState(false)
  const [result,      setResult]      = useState(null)
  const [keypair,     setKeypair]     = useState(null)

  const hiddenDef  = TYPES.find(t => t.value === hiddenType)
  const carrierDef = TYPES.find(t => t.value === carrierType)

  const handleGenerateKeypair = async () => {
    setKeypairLoading(true)
    try { setKeypair(await generateKeypair()) }
    catch { setResult({ error: 'Failed to generate keypair. Is the backend running?' }) }
    finally { setKeypairLoading(false) }
  }

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setResult(null)
    try {
      if (operation === 'encode') {
        const res = await encodeData({ hiddenType, carrierType, encMode, password, pubKey, coverText, secretText, carrierFile, hiddenFile })
        setResult({ type: 'encode', blob: res.blob, filename: res.filename })
      } else {
        const res = await decodeData({ hiddenType, carrierType, encMode, password, privKey, stegoFile })
        if (res.type === 'text') setResult({ type: 'text', content: res.content })
        else {
          const disposition = res.headers?.['content-disposition'] || ''
          const match = disposition.match(/filename=([^;]+)/)
          setResult({ type: 'file', blob: res.blob, filename: match ? match[1].replace(/"/g,'') : `hidden_${hiddenType}` })
        }
      }
    } catch (err) {
      const msg = err?.response?.data ? await err.response.data.text().then(t => { try { return JSON.parse(t).detail } catch { return t } }) : err.message
      setResult({ error: msg || 'Something went wrong' })
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#03030a', position: 'relative' }}>
      <AppBackground />

      {/* Ambient orbs */}
      <motion.div animate={{ scale: [1,1.2,1], opacity: [0.5,0.9,0.5] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'fixed', top: '10%', left: '5%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, borderRadius: '50%' }} />
      <motion.div animate={{ scale: [1,1.15,1], opacity: [0.4,0.8,0.4] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{ position: 'fixed', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, borderRadius: '50%' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', background: 'rgba(3,3,10,0.85)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button type="button" onClick={() => navigate('/')} whileHover={{ x: -3 }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.45rem 0.875rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back
            </motion.button>
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🛰️</div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>HERMES</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
            {['encode', 'decode'].map(op => (
              <motion.button key={op} type="button" onClick={() => { setOperation(op); setResult(null) }} whileTap={{ scale: 0.97 }}
                style={{ padding: '0.45rem 1.25rem', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: 'none', background: operation === op ? 'linear-gradient(135deg, #8b5cf6, #14b8a6)' : 'transparent', color: operation === op ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', textTransform: 'capitalize', fontFamily: 'Space Grotesk, sans-serif' }}>
                {op === 'encode' ? '🧬' : '🔍'} {op.charAt(0).toUpperCase() + op.slice(1)}
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem 4rem' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, marginBottom: '0.5rem', margin: 0 }}>
              {operation === 'encode' ? (
                <><span style={{ background: 'linear-gradient(135deg,#8b5cf6,#14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hide</span> your secret</>
              ) : (
                <><span style={{ background: 'linear-gradient(135deg,#14b8a6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reveal</span> the hidden</>
              )}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: '0.625rem' }}>
              {operation === 'encode' ? 'Choose what to hide, where to hide it, and how to protect it.' : 'Upload a stego file and extract the hidden content inside.'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.75rem', alignItems: 'start' }}>

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Type selectors */}
                {operation === 'encode' && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                      <TypeSelect label="What to hide" value={hiddenType} onChange={v => { setHiddenType(v); setHiddenFile(null); setResult(null) }} />
                      <TypeSelect label="Hide inside" value={carrierType} onChange={v => { setCarrierType(v); setCarrierFile(null); setResult(null) }} />
                    </div>
                    {/* Combination pill */}
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <hiddenDef.icon size={13} style={{ color: hiddenDef.color }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hiddenDef.label} hidden inside {carrierDef.label}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-purple)', fontSize: 10, background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                        {hiddenType.toUpperCase()} → {carrierType.toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Inputs */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {operation === 'encode' ? (
                    <>
                      {hiddenType === 'text' ? (
                        <div>
                          <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Secret message</label>
                          <textarea placeholder="Type your secret message here..." value={secretText} onChange={e => setSecretText(e.target.value)} rows={5}
                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 12, fontSize: 14, resize: 'vertical', lineHeight: 1.65, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'Space Grotesk, sans-serif' }} />
                        </div>
                      ) : (
                        <FileDropZone label={`Hidden ${hiddenDef.label}`} accept={hiddenDef.accept} file={hiddenFile} onFile={setHiddenFile} color={hiddenDef.color} />
                      )}
                      {carrierType === 'text' ? (
                        <div>
                          <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Cover text</label>
                          <textarea placeholder="The visible cover text (this is what people will see)..." value={coverText} onChange={e => setCoverText(e.target.value)} rows={5}
                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 12, fontSize: 14, resize: 'vertical', lineHeight: 1.65, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontFamily: 'Space Grotesk, sans-serif' }} />
                        </div>
                      ) : (
                        <FileDropZone label={`Carrier ${carrierDef.label}`} accept={carrierDef.accept} file={carrierFile} onFile={setCarrierFile} color={carrierDef.color} />
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <TypeSelect label="Hidden type" value={hiddenType} onChange={v => { setHiddenType(v); setResult(null) }} />
                        <TypeSelect label="Carrier type" value={carrierType} onChange={v => { setCarrierType(v); setStegoFile(null); setResult(null) }} />
                      </div>
                      <FileDropZone label="Stego file to decode" accept={carrierDef.accept} file={stegoFile} onFile={setStegoFile} color={carrierDef.color} />
                    </>
                  )}
                </motion.div>

                {/* Result */}
                <AnimatePresence>{result && <ResultPanel result={result} onClear={() => setResult(null)} />}</AnimatePresence>

                {/* Submit */}
                <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{ width: '100%', padding: '1.125rem', borderRadius: 16, fontSize: 16, fontWeight: 700, background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8b5cf6, #14b8a6)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.01em', boxShadow: loading ? 'none' : '0 0 40px rgba(139,92,246,0.25)', transition: 'box-shadow 0.3s' }}>
                  {loading
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                    : operation === 'encode'
                      ? <><Zap size={17} /> Encode & Download</>
                      : <><Eye size={17} /> Decode & Reveal</>}
                </motion.button>
              </div>

              {/* Right column */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <EncryptionPanel mode={encMode} setMode={setEncMode} password={password} setPassword={setPassword} operation={operation} pubKey={pubKey} setPubKey={setPubKey} privKey={privKey} setPrivKey={setPrivKey} onGenerateKeypair={handleGenerateKeypair} keypairLoading={keypairLoading} />

                {/* Tips */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Quick tips</div>
                  {[
                    { icon: '🎯', text: 'Video → Video is the fastest — no size limit', color: '#f59e0b' },
                    { icon: '🔒', text: 'Password mode needs same key to decode', color: '#8b5cf6' },
                    { icon: '🗝️', text: 'Receiver generates the keypair, not sender', color: '#14b8a6' },
                    { icon: '📦', text: 'Cover image must be larger than hidden data', color: '#ec4899' },
                  ].map(tip => (
                    <div key={tip.text} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{tip.icon}</span>
                      <span>{tip.text}</span>
                    </div>
                  ))}
                </div>

                {/* Encryption info badge */}
                {encMode !== 'none' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '1rem 1.25rem', borderRadius: 14, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 12, color: '#c4b5fd', lineHeight: 1.65 }}>
                    <strong style={{ display: 'block', color: '#a78bfa', marginBottom: 4 }}>
                      {encMode === 'password' ? '🔒 AES-256-GCM Active' : '🗝️ RSA-OAEP Active'}
                    </strong>
                    {encMode === 'password'
                      ? 'Your data is encrypted before hiding. Wrong password = unreadable garbage.'
                      : 'Only the private key holder can decrypt. Share only the public key.'}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>{keypair && <KeypairModal keypair={keypair} onClose={() => setKeypair(null)} />}</AnimatePresence>
    </div>
  )
}