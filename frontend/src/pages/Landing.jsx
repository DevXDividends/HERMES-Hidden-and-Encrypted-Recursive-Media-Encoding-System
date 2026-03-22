import { useEffect, useRef } from 'react'
import LSBDemo from '../components/LSBDemo'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, Zap, Lock, Radio, Film, Music, FileText, Image } from 'lucide-react'

// ── Deep Space Background ─────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let w = canvas.width  = window.innerWidth
    let h = canvas.height = window.innerHeight
    let raf, t = 0

    // Stars — three layers for depth parallax
    const layers = [
      Array.from({ length: 120 }, () => ({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*0.8+0.1, a: Math.random()*Math.PI*2, speed: 0.0008, drift: 0.02 })),
      Array.from({ length: 80  }, () => ({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.2+0.3, a: Math.random()*Math.PI*2, speed: 0.0015, drift: 0.05 })),
      Array.from({ length: 40  }, () => ({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*2.0+0.5, a: Math.random()*Math.PI*2, speed: 0.003,  drift: 0.09 })),
    ]
    const drifts = [0.015, 0.035, 0.07]

    // Shooting stars
    const shoots = Array.from({ length: 5 }, () => newShoot(w, h))
    function newShoot(w, h) {
      return {
        x: Math.random() * w * 0.7,
        y: Math.random() * h * 0.4,
        len: Math.random() * 120 + 60,
        speed: Math.random() * 8 + 6,
        angle: Math.PI / 5 + (Math.random() - 0.5) * 0.3,
        alpha: 0,
        state: 'wait',
        wait: Math.random() * 400 + 100,
        progress: 0,
      }
    }

    // Nebula blobs — pre-computed positions
    const nebulas = [
      { x: w*0.15, y: h*0.25, rx: w*0.22, ry: h*0.18, r: 60, g: 20, b: 160 },
      { x: w*0.78, y: h*0.60, rx: w*0.20, ry: h*0.22, r: 10, g: 140, b: 130 },
      { x: w*0.50, y: h*0.80, rx: w*0.18, ry: h*0.15, r: 100, g: 30, b: 180 },
    ]

    // Data stream particles (binary feel)
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: Math.random() * 0.3 + 0.1,
      a: Math.random(),
      char: Math.random() > 0.5 ? '1' : '0',
      size: Math.floor(Math.random() * 3) + 8,
      color: Math.random() > 0.5 ? '139,92,246' : '20,184,166',
    }))

    function drawNebulas() {
      nebulas.forEach(n => {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.rx, n.ry))
        grad.addColorStop(0,   `rgba(${n.r},${n.g},${n.b},0.04)`)
        grad.addColorStop(0.5, `rgba(${n.r},${n.g},${n.b},0.02)`)
        grad.addColorStop(1,   `rgba(${n.r},${n.g},${n.b},0)`)
        ctx.save()
        ctx.scale(n.rx / Math.max(n.rx, n.ry), n.ry / Math.max(n.rx, n.ry))
        ctx.beginPath()
        ctx.arc(
          n.x * Math.max(n.rx,n.ry)/n.rx,
          n.y * Math.max(n.rx,n.ry)/n.ry,
          Math.max(n.rx, n.ry), 0, Math.PI*2
        )
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
      })
    }

    function drawStars() {
      layers.forEach((layer, li) => {
        layer.forEach(s => {
          s.a += s.speed
          s.x += drifts[li]
          if (s.x > w + 2) s.x = -2
          const brightness = (Math.sin(s.a) * 0.5 + 0.5)
          const alpha = li === 0 ? brightness * 0.5
                      : li === 1 ? brightness * 0.75
                      : brightness * 0.95
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI*2)
          // Slight color tint for far stars
          const tint = li === 0 ? `rgba(180,200,255,${alpha})`
                     : li === 1 ? `rgba(220,220,255,${alpha})`
                     : `rgba(255,255,255,${alpha})`
          ctx.fillStyle = tint
          ctx.fill()
          // Glow on bright close stars
          if (li === 2 && brightness > 0.7) {
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI*2)
            ctx.fillStyle = `rgba(180,160,255,${(brightness-0.7)*0.06})`
            ctx.fill()
          }
        })
      })
    }

    function drawShoots() {
      shoots.forEach((s, i) => {
        if (s.state === 'wait') {
          s.wait--
          if (s.wait <= 0) s.state = 'in'
        } else if (s.state === 'in') {
          s.progress += s.speed
          s.alpha = Math.min(1, s.progress / 20)
          const cx = s.x + Math.cos(s.angle) * s.progress
          const cy = s.y + Math.sin(s.angle) * s.progress
          const tx = cx - Math.cos(s.angle) * s.len
          const ty = cy - Math.sin(s.angle) * s.len
          const grad = ctx.createLinearGradient(tx, ty, cx, cy)
          grad.addColorStop(0, `rgba(255,255,255,0)`)
          grad.addColorStop(1, `rgba(255,255,255,${s.alpha * 0.8})`)
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(cx, cy)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.stroke()
          if (s.progress > s.len + 200) {
            shoots[i] = newShoot(w, h)
            shoots[i].wait = Math.random() * 600 + 200
          }
        }
      })
    }

    function drawParticles() {
      particles.forEach(p => {
        p.y += p.vy
        p.a += 0.005
        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w }
        const alpha = (Math.sin(p.a) * 0.3 + 0.15)
        ctx.font = `${p.size}px JetBrains Mono, monospace`
        ctx.fillStyle = `rgba(${p.color},${alpha})`
        ctx.fillText(p.char, p.x, p.y)
      })
    }

    // Hex data streams on the sides
    const hexStream = Array.from({ length: 12 }, (_, i) => ({
      x: i % 2 === 0 ? Math.random() * 120 : w - Math.random() * 120,
      y: Math.random() * h,
      vy: Math.random() * 0.5 + 0.2,
      text: Math.floor(Math.random() * 0xff).toString(16).padStart(2,'0'),
      a: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? '139,92,246' : '20,184,166',
    }))

    function drawHexStreams() {
      hexStream.forEach(s => {
        s.y += s.vy
        s.a += 0.008
        if (s.y > h + 20) {
          s.y = -20
          s.text = Math.floor(Math.random() * 0xff).toString(16).padStart(2,'0')
        }
        const alpha = Math.sin(s.a) * 0.06 + 0.03
        ctx.font = '10px JetBrains Mono, monospace'
        ctx.fillStyle = `rgba(${s.color},${alpha})`
        ctx.fillText(s.text, s.x, s.y)
      })
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      t++
      drawNebulas()
      drawStars()
      drawShoots()
      drawParticles()
      drawHexStreams()
      raf = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      w = canvas.width  = window.innerWidth
      h = canvas.height = window.innerHeight
      nebulas[0].x = w*0.15; nebulas[0].y = h*0.25; nebulas[0].rx = w*0.22; nebulas[0].ry = h*0.18
      nebulas[1].x = w*0.78; nebulas[1].y = h*0.60; nebulas[1].rx = w*0.20; nebulas[1].ry = h*0.22
      nebulas[2].x = w*0.50; nebulas[2].y = h*0.80; nebulas[2].rx = w*0.18; nebulas[2].ry = h*0.15
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
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${color}22`,
        borderRadius: 16,
        padding: '1.75rem',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1rem', flexShrink: 0,
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 600,
        fontSize: 15, marginBottom: '0.5rem',
        color: 'var(--text-primary)',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 13, lineHeight: 1.7,
        color: 'var(--text-secondary)', margin: 0,
      }}>
        {desc}
      </p>
    </motion.div>
  )
}

// ── Matrix badge ───────────────────────────────────────────────────────────
function MatrixBadge({ label, icon: Icon, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '0.375rem 0.875rem', borderRadius: 100,
        background: `${color}10`, border: `1px solid ${color}25`, color,
      }}
    >
      <Icon size={12} />
      <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
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

      {/* Animated ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed', top: '15%', left: '8%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0, borderRadius: '50%',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'fixed', bottom: '15%', right: '8%', width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0, borderRadius: '50%',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{
          position: 'fixed', top: '50%', left: '45%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0, borderRadius: '50%',
        }}
      />

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
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 10, fontSize: 13,
              background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600,
            }}
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
            <span style={{
              background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Hide anything.</span>
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
              style={{
                padding: '0.875rem 2.5rem', borderRadius: 14,
                fontSize: 15, fontWeight: 600,
                background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                boxShadow: '0 0 40px rgba(139,92,246,0.3)',
              }}
            >
              <span>Start Encoding →</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '0.875rem 2rem', borderRadius: 14, fontSize: 15,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
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

        {/* LSB Interactive Demo */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
          <LSBDemo />
        </div>

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
              style={{
                padding: '1rem 3rem', borderRadius: 14, fontSize: 16, fontWeight: 600,
                background: 'linear-gradient(135deg, #8b5cf6, #14b8a6)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
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