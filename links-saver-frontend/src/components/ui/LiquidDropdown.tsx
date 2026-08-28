import {
  createContext, useContext, useRef, useEffect, useCallback,
  useState, useId, type ReactNode, type KeyboardEvent,
} from 'react'

// ─── Math helpers ──────────────────────────────────────────────────────────────

const _lerp   = (a: number, b: number, t: number) => a + (b - a) * t
const _clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const _smooth = (e0: number, e1: number, x: number) => {
  const t = _clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
}
const _eqd = (t: number) => 1 - (1 - t) ** 2   // ease-out-quad
const _eqc = (t: number) => 1 - (1 - t) ** 3   // ease-out-cubic

// ─── Cubic-bezier solver (Newton-Raphson + binary subdivision) ─────────────────

function _bezier(x1: number, y1: number, x2: number, y2: number) {
  const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1
  const B = (a1: number, a2: number) => 3 * a2 - 6 * a1
  const C = (a1: number)             => 3 * a1
  const f  = (t: number, a1: number, a2: number) => ((A(a1,a2)*t + B(a1,a2))*t + C(a1))*t
  const df = (t: number, a1: number, a2: number) => 3*A(a1,a2)*t*t + 2*B(a1,a2)*t + C(a1)
  const TS = 11, SS = 1 / (TS - 1)
  const sv = Float32Array.from({ length: TS }, (_, i) => f(i * SS, x1, x2))
  function tForX(aX: number) {
    let is = 0, ci = 1
    for (; ci !== TS - 1 && sv[ci] <= aX; ++ci) is += SS
    --ci
    let t = is + ((aX - sv[ci]) / (sv[ci+1] - sv[ci])) * SS
    if (df(t, x1, x2) > 0.02) {
      for (let i = 0; i < 4; i++) {
        const s = df(t, x1, x2); if (!s) break
        t -= (f(t, x1, x2) - aX) / s
      }
    } else {
      let [a, b] = [is, is + SS]
      for (let i = 0; i < 10; i++) {
        t = (a + b) / 2
        const cx = f(t, x1, x2) - aX
        if (Math.abs(cx) < 1e-7) break
        cx > 0 ? (b = t) : (a = t)
      }
    }
    return t
  }
  return (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : f(tForX(x), y1, y2)
}

const _open  = _bezier(0.23, 1, 0.32, 1)
const _close = _bezier(0.25, 0.46, 0.45, 0.94)

// ─── Fixed vertical geometry ───────────────────────────────────────────────────

const TH      = 40   // trigger height px
const TR      = 11   // trigger radius px
const PT_IN   = 20   // panel top: submerged in trigger (p=0)
const PT_OUT  = 43   // panel top at full open — 3px gap, goo filter bridges it
const PH_IN   = 12   // panel height at p=0
const OPEN_MS = 190
const CLOSE_MS = 150

// ─── Context for item→dropdown close handshake ─────────────────────────────────

const Ctx = createContext<{ close: () => void } | null>(null)

// ─── LiquidDropdown ───────────────────────────────────────────────────────────

export interface LiquidDropdownProps {
  trigger: ReactNode
  children: ReactNode
  /** Trigger/panel width px. Omit to let ResizeObserver measure the container. */
  width?: number
  /** Full-open panel height px (default 146). */
  panelHeight?: number
  className?: string
  disabled?: boolean
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void
  onOpen?: () => void
  onClose?: () => void
}

export function LiquidDropdown({
  trigger, children,
  width: widthProp,
  panelHeight: PH_MAX = 146,
  className = '',
  disabled = false,
  onKeyDown,
  onOpen,
  onClose,
}: LiquidDropdownProps) {
  const uid = useId().replace(/:/g, '')
  const fid = `ld-${uid}`

  // tw: actual rendered trigger width for animation math
  const [tw, setTw] = useState(widthProp ?? 200)
  const outerRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (widthProp) { setTw(widthProp); return }
    const el = outerRef.current; if (!el) return
    const obs = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width)
      if (w > 0) setTw(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [widthProp])

  useEffect(() => { if (widthProp) setTw(widthProp) }, [widthProp])

  const [isOpen,  setIsOpen]  = useState(false)
  const [mounted, setMounted] = useState(false)

  const panelBlob  = useRef<HTMLDivElement>(null)
  const panelShad  = useRef<HTMLDivElement>(null)
  const menuRef    = useRef<HTMLDivElement>(null)

  // Animation scalars (mutated each frame, never trigger re-render)
  const pRef    = useRef(0)
  const prevP   = useRef(0)
  const prevT   = useRef(0)
  const startP  = useRef(0)
  const startT  = useRef(0)
  const durRef  = useRef(0)
  const easeFn  = useRef(_open)
  const target  = useRef(0)
  const raf     = useRef<number>(0)

  const frame = useCallback(() => {
    const now  = performance.now()
    const rawT = _clamp((now - startT.current) / durRef.current, 0, 1)
    const p    = _lerp(startP.current, target.current, easeFn.current(rawT))

    const dt  = Math.max((now - prevT.current) / 1000, 1e-4)
    const vel = (p - prevP.current) / dt
    prevP.current = p; prevT.current = now; pRef.current = p

    // Derived geometry (all drive off this single p + vel)
    const tProg  = _clamp(p / 0.45, 0, 1)
    const panTop = _lerp(PT_IN,  PT_OUT, _eqd(tProg))            // top edge
    const panH   = _lerp(PH_IN,  PH_MAX, _eqc(p))                // height
    const PW_MIN = Math.round(tw * 0.38)
    const baseW  = _lerp(PW_MIN, tw, _eqc(p))                    // width base
    const pinch  = Math.min(0.30, Math.abs(vel) / 70)             // velocity pinch
    const panW   = baseW * (1 - pinch)
    const panR   = _lerp(Math.min(panW, panH) / 2, 8, _smooth(0.3, 0.85, p))
    const panLeft = (tw - panW) / 2

    if (panelBlob.current) {
      const s = panelBlob.current.style
      s.top = `${panTop}px`; s.left = `${panLeft}px`
      s.width = `${panW}px`; s.height = `${panH}px`
      s.borderRadius = `${panR}px`
      s.opacity = p > 0.005 ? '1' : '0'
    }
    if (panelShad.current) {
      const s = panelShad.current.style
      s.top = `${panTop}px`; s.left = `${panLeft}px`
      s.width = `${panW}px`; s.height = `${panH}px`
      s.borderRadius = `${panR}px`
      s.opacity = String(_clamp(p * 1.8, 0, 1))
    }

    // Item fade: keyed to panel's own growth, not clock
    if (menuRef.current) {
      const kids = menuRef.current.children, n = kids.length
      if (n > 0) {
        const ITEM_H   = PH_MAX / n
        const panBottom = panTop + panH
        for (let i = 0; i < n; i++) {
          const mid = PT_OUT + (i + 0.5) * ITEM_H
          const rev = _clamp((panBottom - mid) / ITEM_H, 0, 1)
          ;(kids[i] as HTMLElement).style.opacity = String(_eqc(rev))
        }
      }
    }

    if (rawT < 1) {
      raf.current = requestAnimationFrame(frame)
    } else {
      pRef.current = target.current
      if (target.current === 0) setMounted(false)
    }
  }, [tw, PH_MAX])

  const startAnim = useCallback((toOpen: boolean) => {
    if (raf.current) cancelAnimationFrame(raf.current)
    startP.current = pRef.current
    target.current = toOpen ? 1 : 0
    startT.current = prevT.current = performance.now()
    prevP.current  = pRef.current
    durRef.current = toOpen ? OPEN_MS : CLOSE_MS
    easeFn.current = toOpen ? _open : _close
    raf.current    = requestAnimationFrame(frame)
  }, [frame])

  const close = useCallback(() => {
    if (!isOpen) return
    setIsOpen(false); startAnim(false); onClose?.()
  }, [isOpen, startAnim, onClose])

  const open = useCallback(() => {
    setIsOpen(true); setMounted(true); startAnim(true); onOpen?.()
  }, [startAnim, onOpen])

  const toggle = useCallback(() => (isOpen ? close : open)(), [isOpen, close, open])

  // Click-outside
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (outerRef.current && !outerRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [close])

  // Escape
  useEffect(() => {
    const h = (e: Event) => { if ((e as unknown as { key: string }).key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [close])

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current) }, [])

  const TOTAL_H = TH + PT_OUT + PH_MAX + 20
  const PW_MIN  = Math.round(tw * 0.38)

  return (
    <Ctx.Provider value={{ close }}>
      <div
        ref={outerRef}
        className={`relative block select-none ${className}`}
        style={widthProp ? { width: widthProp } : undefined}
      >
        {/* ── Filter ─────────────────────────────────────────────────────────── */}
        <svg aria-hidden focusable="false"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <filter id={fid} x="-15%" y="-10%" width="130%" height="120%"
              colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
              {/* Hard alpha threshold → merged silhouette mask */}
              <feColorMatrix in="blur" type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 30 -9"
                result="mask" />
              {/* Restore original fill colors through mask */}
              <feComposite in="SourceGraphic" in2="mask" operator="in" result="filled" />
              {/* 1.5px erosion ring for the continuous outline */}
              <feMorphology in="mask" operator="dilate" radius="1.5" result="dilated" />
              <feComposite in="dilated" in2="mask" operator="out" result="ring" />
              <feFlood floodColor="var(--color-border)" result="borderCol" />
              <feComposite in="borderCol" in2="ring" operator="in" result="border" />
              <feMerge>
                <feMergeNode in="border" />
                <feMergeNode in="filled" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* ── Shadow twins (outside filter so they don't threshold) ───────────── */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: 0, width: tw, height: TH,
          borderRadius: TR,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.04)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div ref={panelShad} aria-hidden style={{
          position: 'absolute', top: PT_IN, left: (tw - PW_MIN) / 2,
          width: PW_MIN, height: PH_IN, borderRadius: 20,
          boxShadow: '0 8px 28px -6px rgba(0,0,0,0.10)',
          pointerEvents: 'none', opacity: 0, zIndex: 0,
        }} />

        {/* ── Goo layer: both blobs through filter ─────────────────────────────── */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: 0,
          width: tw, height: TOTAL_H,
          filter: `url(#${fid})`,
          pointerEvents: 'none', zIndex: 1,
        }}>
          {/* Trigger blob */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: tw, height: TH,
            borderRadius: TR, background: 'var(--color-bg-card)',
          }} />
          {/* Panel blob — animated each frame */}
          <div ref={panelBlob} style={{
            position: 'absolute', top: PT_IN, left: (tw - PW_MIN) / 2,
            width: PW_MIN, height: PH_IN, borderRadius: 20,
            background: 'var(--color-bg-card)', opacity: 0,
          }} />
        </div>

        {/* ── Trigger button content (sits above goo) ────────────────────────── */}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={toggle}
          onKeyDown={onKeyDown}
          style={{
            position: 'relative', zIndex: 2,
            width: tw, height: TH, borderRadius: TR,
            border: 'none', background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 14px',
            color: 'var(--color-text-primary)',
            fontSize: 13, fontWeight: 500,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {trigger}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round"
            style={{
              flexShrink: 0,
              transform: `rotate(${isOpen ? 180 : 0}deg)`,
              transition: 'transform 0.18s ease',
              opacity: 0.4,
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* ── Menu panel (interactive content, above goo) ────────────────────── */}
        {mounted && (
          <div style={{
            position: 'absolute', top: PT_OUT, left: 0,
            width: tw, height: PH_MAX,
            zIndex: 3,
            pointerEvents: isOpen ? 'auto' : 'none',
            overflow: 'hidden',
          }}>
            <div ref={menuRef} style={{ padding: '4px 0' }}>
              {children}
            </div>
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}

// ─── LiquidDropdownItem ───────────────────────────────────────────────────────

interface ItemProps {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  highlighted?: boolean
  icon?: ReactNode
  color?: string
  description?: string
}

export function LiquidDropdownItem({
  children, onClick, selected, highlighted, icon, color, description,
}: ItemProps) {
  const ctx = useContext(Ctx)

  const bg = selected
    ? 'rgba(42,187,247,0.10)'
    : highlighted
    ? 'var(--color-bg-hover)'
    : 'transparent'

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => { onClick?.(); ctx?.close() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '8px 14px',
        border: 'none', background: bg,
        color: selected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        fontSize: 13, fontWeight: selected ? 600 : 400,
        cursor: 'pointer', textAlign: 'left',
        opacity: 0,   // controlled per-frame by parent's animation
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--color-bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = bg }}
    >
      {color && (
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
      )}
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
        {description && (
          <span style={{ display: 'block', fontSize: 11, opacity: 0.5, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {description}
          </span>
        )}
      </span>
      {selected && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 20 4 15" />
        </svg>
      )}
    </button>
  )
}
