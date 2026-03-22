import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, Zap, Lock, Radio, Film, Music, FileText, Image } from 'lucide-react'

// ── Star particle canvas ───────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let w = canvas.width  = window.innerWidth
    let h = canvas.height = window.innerHeight
    let raf

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.003 + 0.001,
      drift: (Math.random() - 0.5) * 0.08,
    }))

    function draw() {
      ctx.clearRect(0, 0, w, h)
      stars.forEach(s => {
        s.a += s.speed
        s.x += s.drift
        if (s.x > w) s.x = 0
        if (s.x < 0) s.x = w
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${Math.abs(Math.sin(s.a)) * 0.7})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      w = canvas.width  = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

// ── Satellite SVG ──────────────────────────────────────────────────────────
function SatelliteIcon() {
  return (
    <motion.div
      animate={{ rotate: [0, 5, -5, 0], y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'inline-block' }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="58" stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="60" cy="60" r="40" stroke="rgba(20,184,166,0.1)" strokeWidth="1" />
        {/* Body */}
        <rect x="46" y="46" width="28" height="28" rx="6" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="1.5" />
        {/* Solar panels */}
        <rect x="14" y="52" width="28" height="16" rx="3" fill="rgba(20,184,166,0.2)" stroke="#14b8a6" strokeWidth="1" />
        <rect x="78" y="52" width="28" height="16" rx="3" fill="rgba(20,184,166,0.2)" stroke="#14b8a6" strokeWidth="1" />
        {/* Panel dividers */}
        <line x1="21" y1="52" x2="21" y2="68" stroke="#14b8a6" strokeWidth="0.5" opacity="0.5" />
        <line x1="28" y1="52" x2="28" y2="68" stroke="#14b8a6" strokeWidth="0.5" opacity="0.5" />
        <line x1="35" y1="52" x2="35" y2="68" stroke="#14b8a6" strokeWidth="0.5" opacity="0.5" />
        <line x1="85" y1="52" x2="85" y2="68" stroke="#14b8a6" strokeWidth="0.5" opacity="0.5" />
        <line x1="92" y1="52" x2="92" y2="68" stroke="#14b8a6" strokeWidth="0.5" opacity="0.5" />
        <line x1="99" y1="52" x2="99" y2="68" stroke="#14b8a6" strokeWidth="0.5" opacity="0.5" />
        {/* Antenna */}
        <line x1="60" y1="46" x2="60" y2="28" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="60" cy="25" r="4" fill="#8b5cf6" />
        {/* Signal rings */}
        <circle cx="60" cy="25" r="8" stroke="rgba(139,92,246,0.4)" strokeWidth="1" fill="none" />
        <circle cx="60" cy="25" r="13" stroke="rgba(139,92,246,0.2)" strokeWidth="1" fill="none" strokeDasharray="2 2" />
        {/* Center dot */}
        <circle cx="60" cy="60" r="4" fill="#14b8a6" />
      </svg>
    </motion.div>
  )
}

// ── Feature card ───────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass rounded-2xl p-6 cursor-default"
      style={{ borderColor: `${color}22` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </motion.div>
  )
}

// ── Matrix badge ───────────────────────────────────────────────────────────
function MatrixBadge({ label, icon: Icon, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: `${color}10`, border: `1px solid ${color}25`, color }}
    >
      <Icon size={12} />
      <span className="text-xs font-medium">{label}</span>
    </motion.div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  const features = [
    { icon: Lock,   title: 'AES-256-GCM Encryption',   desc: 'Military-grade encryption with PBKDF2 key derivation. Your secrets are mathematically unbreakable.',   color: '#8b5cf6', delay: 0 },
    { icon: Shield, title: 'RSA Keypair Mode',          desc: 'Asymmetric encryption — no shared secrets. Only the receiver\'s private key can unlock the message.',  color: '#14b8a6', delay: 0.1 },
    { icon: Eye,    title: 'Perfect Steganography',     desc: 'Hidden data is invisible to the human eye and ear. The carrier file looks and plays exactly the same.', color: '#ec4899', delay: 0.2 },
    { icon: Zap,    title: '16 Carrier Combinations',   desc: 'Hide anything in anything — Text, Image, Audio, or Video as both payload and carrier. Full 4×4 matrix.', color: '#f59e0b', delay: 0.3 },
    { icon: Radio,  title: 'Zero Server Storage',       desc: 'Files are processed in memory and never stored. Your data never touches a database.',                    color: '#06b6d4', delay: 0.4 },
    { icon: Film,   title: 'Fast EOF Encoding',         desc: 'Video carriers use blazing-fast EOF appending. No size limits, no RAM issues, no waiting.',             color: '#10b981', delay: 0.5 },
  ]

  const types = [
    { label: 'Text',  icon: FileText, color: '#8b5cf6' },
    { label: 'Image', icon: Image,    color: '#14b8a6' },
    { label: 'Audio', icon: Music,    color: '#ec4899' },
    { label: 'Video', icon: Film,     color: '#f59e0b' },
  ]

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <StarField />

      {/* Ambient glow orbs */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '10%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 2.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(3,3,10,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>🛰️</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '0.05em' }}>HERMES</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/app')}
            className="btn-primary"
            style={{ padding: '0.5rem 1.25rem', borderRadius: 10, fontSize: 13 }}
          >
            <span>Launch App →</span>
          </motion.button>
        </nav>

        {/* Hero */}
        <section style={{ padding: '7rem 2rem 5rem', textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ marginBottom: '2.5rem' }}
          >
            <SatelliteIcon />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.375rem 1rem', borderRadius: 100,
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              marginBottom: '2rem', fontSize: 12, color: '#a78bfa',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
            v2.0 · React + FastAPI · AES-256-GCM + RSA
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
            }}
          >
            <span className="gradient-text">Hide anything.</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>Encrypt everything.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            style={{
              fontSize: '1.125rem', lineHeight: 1.75,
              color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 2.5rem',
            }}
          >
            HERMES combines military-grade encryption with invisible steganography —
            hide secret data inside ordinary files that look completely normal.
          </motion.p>

          {/* Type badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '3rem' }}
          >
            {types.map(t => <MatrixBadge key={t.label} {...t} />)}
            <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center' }}>× 4 carriers = 16 combinations</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/app')}
              className="btn-primary"
              style={{
                padding: '0.875rem 2.5rem', borderRadius: 14,
                fontSize: 15, fontWeight: 600,
                boxShadow: '0 0 40px rgba(139,92,246,0.3)',
              }}
            >
              <span>Start Encoding →</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="btn-ghost"
              style={{ padding: '0.875rem 2rem', borderRadius: 14, fontSize: 15 }}
            >
              Learn more
            </motion.button>
          </motion.div>
        </section>

        {/* Divider */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(20,184,166,0.3), transparent)' }} />
        </div>

        {/* How it works strip */}
        <section style={{ padding: '4rem 2rem', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            {[
              { step: '01', title: 'Choose types', desc: 'Pick what to hide and where to hide it' },
              { step: '02', title: 'Upload files', desc: 'Drag-drop your payload and carrier' },
              { step: '03', title: 'Set encryption', desc: 'Password or keypair — optional but powerful' },
              { step: '04', title: 'Download', desc: 'Get your stego file instantly' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  flex: 1, padding: '1.5rem', position: 'relative',
                  borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-purple)', marginBottom: 8, letterSpacing: '0.1em' }}>{s.step}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section id="features" style={{ padding: '4rem 2rem 6rem', maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              Built different.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Every feature designed with security and usability in mind.
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </section>

        {/* CTA footer */}
        <section style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(139,92,246,0.03)',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1rem' }}>
              Ready to go dark?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Keep it secret. Keep it safe. 🛰️
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/app')}
              className="btn-primary"
              style={{
                padding: '1rem 3rem', borderRadius: 14, fontSize: 16, fontWeight: 600,
                boxShadow: '0 0 60px rgba(139,92,246,0.25)',
              }}
            >
              <span>Launch HERMES →</span>
            </motion.button>
          </motion.div>

          <div style={{ marginTop: '4rem', color: 'var(--text-muted)', fontSize: 13 }}>
            Built with ❤️ by Aditya · Kartik · Vikrant · Janhavi · Pranali
          </div>
        </section>

      </div>
    </div>
  )
}