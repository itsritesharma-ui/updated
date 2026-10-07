import { useEffect, useRef } from 'react'
import styles from './IndependenceBackground.module.css'

// Colors
const SAFFRON = '#FF9933'
const WHITE = '#FFFFFF'
const GREEN = '#138808'
const CHAKRA_NAVY = '#0B0B6B'
const GOLD = '#FFD36E'

function rand(min, max) { return min + Math.random() * (max - min) }

function makeKite(w, h, i) {
  return {
    baseX: rand(-0.15, 1.15) * w,
    baseY: rand(0.06, 0.55) * h,
    speed: rand(9, 22) * (i % 2 === 0 ? 1 : 0.8),
    bobAmp: rand(14, 34),
    bobFreq: rand(0.25, 0.55),
    bobPhase: rand(0, Math.PI * 2),
    swayAmp: rand(0.18, 0.34),
    swayFreq: rand(0.3, 0.6),
    swayPhase: rand(0, Math.PI * 2),
    tilt: rand(-0.28, 0.28),
    size: rand(20, 36),
    flip: Math.random() > 0.5 ? 1 : -1,
  }
}

function drawKite(ctx, k, t, w) {
  let x = k.baseX + k.speed * t * k.flip
  // wrap around horizontally with margin
  const margin = 120
  const span = w + margin * 2
  x = ((x + margin) % span + span) % span - margin
  const y = k.baseY + Math.sin(t * k.bobFreq + k.bobPhase) * k.bobAmp
  const rot = k.tilt + Math.sin(t * k.swayFreq + k.swayPhase) * k.swayAmp
  const s = k.size
  const sway = Math.sin(t * k.swayFreq * 1.3 + k.swayPhase) * 26

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)

  // ── string, trailing down off-screen ──
  ctx.save()
  ctx.strokeStyle = 'rgba(240,237,232,0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, s * 1.35)
  ctx.quadraticCurveTo(sway, s * 5, sway * 1.6, s * 11)
  ctx.stroke()
  ctx.restore()

  // ── tail: long tapering thread with cloth bow-ties (real patang tail) ──
  ctx.save()
  const tailLen = s * 7.5
  const tailPts = []
  for (let n = 0; n <= 18; n++) {
    const ft = n / 18
    const tx = Math.sin(ft * 3.4 + t * 1.2) * (10 + ft * 22) + sway * ft * 0.9
    const ty = s * 1.35 + tailLen * ft
    tailPts.push({ x: tx, y: ty })
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(tailPts[0].x, tailPts[0].y)
  for (let n = 1; n < tailPts.length; n++) ctx.lineTo(tailPts[n].x, tailPts[n].y)
  ctx.stroke()
  const flagColors = [SAFFRON, WHITE, GREEN]
  for (let n = 2; n < tailPts.length; n += 3) {
    const p = tailPts[n]
    const p2 = tailPts[Math.min(n + 1, tailPts.length - 1)]
    const ang = Math.atan2(p2.y - p.y, p2.x - p.x)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(ang)
    const fs = 5.5 - (n / tailPts.length) * 2
    ctx.fillStyle = flagColors[(n / 3) % 3]
    ctx.beginPath()
    ctx.moveTo(0, -fs)
    ctx.lineTo(0, fs)
    ctx.lineTo(fs * 1.6, 0)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()

  // ── kite sail — bowed fabric edges (concave curves, not straight rhombus) ──
  const top = { x: 0, y: -s * 1.08 }
  const right = { x: s * 0.66, y: s * 0.04 }
  const bottom = { x: 0, y: s * 1.22 }
  const left = { x: -s * 0.66, y: s * 0.04 }
  const bow = s * 0.1

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(top.x, top.y)
  ctx.quadraticCurveTo(right.x - bow, (top.y + right.y) / 2 - bow * 0.3, right.x, right.y)
  ctx.quadraticCurveTo(right.x - bow * 0.6, (right.y + bottom.y) / 2, bottom.x, bottom.y)
  ctx.quadraticCurveTo(left.x + bow * 0.6, (bottom.y + left.y) / 2, left.x, left.y)
  ctx.quadraticCurveTo(left.x + bow, (top.y + left.y) / 2 - bow * 0.3, top.x, top.y)
  ctx.closePath()
  ctx.clip()

  const bandH = (bottom.y - top.y) / 3
  const bands = [
    { color: SAFFRON, y0: top.y },
    { color: WHITE, y0: top.y + bandH },
    { color: GREEN, y0: top.y + bandH * 2 },
  ]
  bands.forEach(b => {
    const g = ctx.createLinearGradient(0, b.y0, 0, b.y0 + bandH)
    g.addColorStop(0, b.color)
    g.addColorStop(1, shade(b.color, -10))
    ctx.fillStyle = g
    ctx.fillRect(-s, b.y0, s * 2, bandH + 1)
  })

  // diagonal paper sheen
  const sheen = ctx.createLinearGradient(-s, top.y, s, bottom.y)
  sheen.addColorStop(0, 'rgba(255,255,255,0.16)')
  sheen.addColorStop(0.35, 'rgba(255,255,255,0)')
  sheen.addColorStop(0.55, 'rgba(255,255,255,0)')
  sheen.addColorStop(0.75, 'rgba(0,0,0,0.08)')
  sheen.addColorStop(1, 'rgba(0,0,0,0.02)')
  ctx.fillStyle = sheen
  ctx.fillRect(-s, top.y, s * 2, bottom.y - top.y)

  // navy chakra dot
  ctx.fillStyle = CHAKRA_NAVY
  ctx.beginPath()
  ctx.arc(0, top.y + bandH * 1.5, s * 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 0.6
  ctx.stroke()
  ctx.restore()

  // fabric edge outline (follows the same bow)
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(top.x, top.y)
  ctx.quadraticCurveTo(right.x - bow, (top.y + right.y) / 2 - bow * 0.3, right.x, right.y)
  ctx.quadraticCurveTo(right.x - bow * 0.6, (right.y + bottom.y) / 2, bottom.x, bottom.y)
  ctx.quadraticCurveTo(left.x + bow * 0.6, (bottom.y + left.y) / 2, left.x, left.y)
  ctx.quadraticCurveTo(left.x + bow, (top.y + left.y) / 2 - bow * 0.3, top.x, top.y)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()

  // ── bamboo spars — poking past the fabric edges, classic patang look ──
  ctx.save()
  ctx.strokeStyle = 'rgba(222,196,150,0.55)'
  ctx.lineWidth = 1.1
  ctx.lineCap = 'round'
  // vertical spine (kamaan) — pokes slightly past top and bottom
  ctx.beginPath()
  ctx.moveTo(0, top.y - s * 0.16)
  ctx.lineTo(0, bottom.y + s * 0.1)
  ctx.stroke()
  // horizontal bow spar — pokes past left and right tips
  ctx.beginPath()
  ctx.moveTo(left.x - s * 0.14, left.y)
  ctx.quadraticCurveTo(0, left.y - s * 0.16, right.x + s * 0.14, right.y)
  ctx.stroke()
  ctx.restore()

  ctx.restore()
}

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)))
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)))
  return `rgb(${r},${g},${b})`
}

export default function IndependenceBackground() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const kitesRef = useRef([])
  const starsRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let w, h, dpr
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      kitesRef.current = Array.from({ length: 6 }, (_, i) => makeKite(w, h, i))
      starsRef.current = Array.from({ length: 70 }, () => ({
        x: rand(0, w), y: rand(0, h * 0.65), r: rand(0.5, 1.6),
        phase: rand(0, Math.PI * 2), speed: rand(0.4, 1.1),
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    let start = performance.now()

    const render = (now) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, w, h)

      // stars
      starsRef.current.forEach(st => {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * st.speed + st.phase))
        ctx.beginPath()
        ctx.fillStyle = `rgba(255,246,224,${tw * 0.85})`
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // kites
      kitesRef.current.forEach(k => drawKite(ctx, k, t, w))

      if (!reduceMotion) rafRef.current = requestAnimationFrame(render)
    }

    if (reduceMotion) {
      render(start)
    } else {
      rafRef.current = requestAnimationFrame(render)
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.sky} />
      <div className={styles.glowSaffron} />
      <div className={styles.glowGreen} />
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.chakraWrap}>
        <svg viewBox="0 0 100 100" className={styles.chakra}>
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="50" cy="50" r="3" fill="currentColor" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24
            return (
              <line
                key={i}
                x1="50" y1="50"
                x2={50 + 46 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 46 * Math.sin((angle * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="0.9"
              />
            )
          })}
        </svg>
      </div>
      <div className={styles.grain} />
    </div>
  )
}
