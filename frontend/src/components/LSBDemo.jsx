import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const GRID = 8
const CELL = 26

function generatePixels() {
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => ({
      r: Math.floor(Math.random() * 80 + 100),
      g: Math.floor(Math.random() * 80 + 80),
      b: Math.floor(Math.random() * 80 + 140),
    }))
  )
}

function textToBits(text) {
  return [...text].flatMap(c => {
    const code = c.charCodeAt(0)
    return Array.from({ length: 8 }, (_, i) => (code >> (7 - i)) & 1)
  })
}

function embedBits(pixels, bits) {
  return pixels.map((row, y) =>
    row.map((px, x) => {
      const idx = (y * GRID + x) * 3
      return {
        r: bits[idx]     !== undefined ? (px.r & 0xFE) | bits[idx]     : px.r,
        g: bits[idx + 1] !== undefined ? (px.g & 0xFE) | bits[idx + 1] : px.g,
        b: bits[idx + 2] !== undefined ? (px.b & 0xFE) | bits[idx + 2] : px.b,
      }
    })
  )
}

export default function LSBDemo() {
  const canvasRef = useRef(null)
  const [mode, setMode]           = useState('before')
  const [selected, setSelected]   = useState({ x: 3, y: 2 })
  const [pixels]                  = useState(() => generatePixels())
  const [stego]                   = useState(() => null)
  const stegoRef                  = useRef(null)
  const secret                    = 'Hi'
  const bits                      = textToBits(secret)

  if (!stegoRef.current) stegoRef.current = embedBits(pixels, bits)

  const getPixel = (x, y) => {
    const src = mode === 'before' ? pixels : mode === 'after' ? stegoRef.current : null
    if (mode === 'diff') {
      const o = pixels[y][x], s = stegoRef.current[y][x]
      const diff = Math.abs(o.r - s.r) + Math.abs(o.g - s.g) + Math.abs(o.b - s.b)
      return diff > 0 ? { r: 139, g: 92, b: 246 } : { r: 15, g: 15, b: 30 }
    }
    return src[y][x]
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = GRID * CELL
    canvas.width  = size
    canvas.height = size

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const px = getPixel(x, y)
        ctx.fillStyle = `rgb(${px.r},${px.g},${px.b})`
        ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1)
      }
    }
    if (selected) {
      ctx.strokeStyle = '#14b8a6'
      ctx.lineWidth   = 2
      ctx.strokeRect(selected.x * CELL - 1, selected.y * CELL - 1, CELL + 1, CELL + 1)
    }
  }, [mode, selected, pixels])

  const handleCanvasClick = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scale = GRID / rect.width
    const x = Math.min(GRID - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scale)))
    const y = Math.min(GRID - 1, Math.max(0, Math.floor((e.clientY - rect.top)  * scale)))
    setSelected({ x, y })
  }

  const selPx   = mode === 'before' ? pixels[selected.y][selected.x] : stegoRef.current[selected.y][selected.x]
  const origPx  = pixels[selected.y][selected.x]
  const valBits = selPx.r.toString(2).padStart(8, '0')
  const origBits= origPx.r.toString(2).padStart(8, '0')

  const tabs = [
    { id: 'before', label: 'Original' },
    { id: 'after',  label: 'With secret' },
    { id: 'diff',   label: 'Difference' },
  ]

  return (
    <section style={{ padding: '5rem 2rem', maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 100,
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
          marginBottom: '1.25rem', fontSize: 11, color: '#a78bfa',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
          LIVE INTERACTIVE DEMO
        </div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginBottom: '0.75rem',
        }}>
          See the magic happen
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.75, maxWidth: 500, margin: '0 auto' }}>
          We change only the <span style={{ color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>last 1 bit</span> of each pixel channel.
          The color shifts by at most ±1 out of 255 — completely invisible to the human eye.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left — canvas */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                style={{
                  flex: 1, padding: '0.45rem 0', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${mode === t.id ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  background: mode === t.id ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: mode === t.id ? '#a78bfa' : 'var(--text-muted)',
                  fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '1.25rem', marginBottom: '1rem',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
              {GRID}×{GRID} PIXEL GRID — CLICK TO INSPECT
            </div>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                width: '100%', height: 'auto', borderRadius: 8,
                imageRendering: 'pixelated', cursor: 'crosshair', display: 'block',
              }}
            />
            {mode === 'diff' && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#8b5cf6', display: 'inline-block' }} />
                Purple = pixel was modified to store a secret bit
              </div>
            )}
          </div>

          {/* Bit inspector */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '1rem',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
              PIXEL ({selected.x},{selected.y}) — RED CHANNEL BITS
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {valBits.split('').map((b, i) => {
                const isLSB     = i === 7
                const isChanged = b !== origBits[i]
                let bg, color, border
                if (isChanged) { bg = 'rgba(20,184,166,0.2)'; color = '#2dd4bf'; border = 'rgba(20,184,166,0.4)' }
                else if (isLSB) { bg = 'rgba(139,92,246,0.15)'; color = '#a78bfa'; border = 'rgba(139,92,246,0.4)' }
                else if (b === '1') { bg = 'rgba(255,255,255,0.08)'; color = '#e2e8f0'; border = 'rgba(255,255,255,0.15)' }
                else { bg = 'rgba(255,255,255,0.03)'; color = '#475569'; border = 'rgba(255,255,255,0.06)' }
                return (
                  <div key={i} style={{
                    flex: 1, height: 32, borderRadius: 5, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                    background: bg, color, border: `1px solid ${border}`,
                    transition: 'all 0.3s',
                  }}>
                    {b}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Value: <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{selPx.r}</strong></span>
              <span>LSB: <strong style={{ color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>{selPx.r & 1}</strong></span>
              {mode !== 'before' && <span>Change: <strong style={{ color: '#2dd4bf', fontFamily: 'JetBrains Mono, monospace' }}>±{Math.abs(selPx.r - origPx.r)}</strong></span>}
            </div>
          </div>
        </motion.div>

        {/* Right — explanation */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Secret encoding */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '1.25rem',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
              SECRET ENCODED IN THIS IMAGE
            </div>
            <div style={{
              padding: '0.625rem 0.875rem', borderRadius: 8,
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: '#a78bfa',
              marginBottom: '1rem', letterSpacing: '0.1em',
            }}>
              "{secret}"
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Binary representation:</div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {bits.slice(0, 16).map((b, i) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  background: b ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  color: b ? '#a78bfa' : '#475569',
                  border: `1px solid ${b ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {b}
                </div>
              ))}
              <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-muted)' }}>...</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {[
              { val: '64', label: 'pixels modified', color: '#8b5cf6' },
              { val: '±1', label: 'max color shift', color: '#14b8a6' },
              { val: '0.4%', label: 'data overhead', color: '#ec4899' },
              { val: '100%', label: 'imperceptible', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '0.875rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Techniques */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '1.25rem',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
              HERMES TECHNIQUES
            </div>
            {[
              { emoji: '🖼️', title: 'LSB — PNG images',  desc: 'Modify last bit of each RGB channel', color: '#8b5cf6' },
              { emoji: '🎵', title: 'LSB — WAV audio',   desc: 'Embed bits in PCM audio frames',       color: '#14b8a6' },
              { emoji: '📝', title: 'Zero-width — Text', desc: 'Invisible Unicode chars in text',      color: '#ec4899' },
              { emoji: '🎬', title: 'EOF — Video',       desc: 'Append after video end-of-file',       color: '#f59e0b' },
            ].map(t => (
              <div key={t.title} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{t.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.color, marginBottom: 2 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: 12, padding: '1rem', fontSize: 12, color: '#5eead4', lineHeight: 1.7,
          }}>
            <strong style={{ display: 'block', marginBottom: 4, color: '#2dd4bf' }}>Why is it undetectable?</strong>
            Changing the LSB shifts a color by at most 1 — e.g. RGB(182, 94, 201) becomes RGB(183, 94, 201).
            Human vision cannot distinguish a 1-unit change in a 0–255 color range.
          </div>
        </motion.div>
      </div>
    </section>
  )
}