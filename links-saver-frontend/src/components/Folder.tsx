import { useCallback, useEffect, useId, useState } from 'react'
import { motion } from 'framer-motion'
import { useFolderStyle, type FolderStyle } from '@/lib/folderStyle'

const FLAP_PATH =
  'M28 50Q28 0 78 0H134C151 0 163 7 172 19C179 28 185 30 196 30H243Q293 30 293 80V191Q293 241 243 241H78Q28 241 28 191V50Z'

// Mix a hex color toward white (amount > 0) or black (amount < 0).
function shade(color: string, amount: number) {
  const hex = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color
  const target = amount > 0 ? 255 : 0
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16))
  const mixed = channels.map(channel => Math.round(channel + (target - channel) * Math.abs(amount)))
  return `#${mixed.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

function isLight(color: string) {
  const hex = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return true
  const [r, g, b] = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16))
  return r * 0.299 + g * 0.587 + b * 0.114 > 150
}

// Paper cards inside the folder (shared by every style).
function buildTheme(color: string) {
  return {
    cardAccent: shade(color, 0.35),
    cardFill: `color-mix(in srgb, ${color} 9%, var(--color-bg-card))`,
    cardStroke: 'color-mix(in srgb, var(--color-border) 72%, var(--color-text-muted))',
    cardLineFill: `color-mix(in srgb, ${color} 22%, var(--color-border))`,
  }
}

// Folder front per style. `fill`/`stroke` are CSS paints; ids are filled in at render.
function buildLook(style: FolderStyle, color: string, ids: { grad: string; edge: string; pattern: string }) {
  const whiteBadge = { badgeFill: 'rgba(255,255,255,0.95)', badgeText: shade(color, -0.6) }
  switch (style) {
    case 'paper':
      return { ...whiteBadge, fill: `url(#${ids.pattern})`, fillOpacity: 1, blur: undefined, stroke: '#d6d0c4', strokeWidth: 2, sheen: false, tabLine: false, edgeStops: [0, 0], shadowColor: '#6b6256', shadowOpacity: 0.16, tilt: 0, iconColor: color }
    case 'outline':
      return { badgeFill: color, badgeText: isLight(color) ? '#151514' : '#FFFFFF', fill: `url(#${ids.pattern})`, fillOpacity: 0.82, blur: undefined, stroke: color, strokeWidth: 2.5, sheen: false, tabLine: true, edgeStops: [0, 0], shadowColor: color, shadowOpacity: 0.12, tilt: 0, iconColor: color }
    case 'solid': // macOS Big Sur: one solid mid-tone, 1px light top edge, neutral shadow
      return { ...whiteBadge, fill: shade(color, 0.1), fillOpacity: 1, blur: undefined, stroke: `url(#${ids.edge})`, strokeWidth: 2, sheen: false, tabLine: false, edgeStops: [0.85, 0], shadowColor: '#000', shadowOpacity: 0.22, tilt: 0 }
    case 'neutral': // neutral frosted glass, colour only on tab line, border and badge
      return { badgeFill: color, badgeText: isLight(color) ? '#151514' : '#FFFFFF', fill: 'var(--color-bg-card)', fillOpacity: 0.72, blur: 'blur(14px) saturate(1.3)', stroke: `${color}8c`, strokeWidth: 1.5, sheen: false, tabLine: true, edgeStops: [0, 0], shadowColor: '#000', shadowOpacity: 0.2, tilt: 0, iconColor: color }
    case 'glossy': // gradient glass with specular sheen and hover tilt
      return { ...whiteBadge, fill: `url(#${ids.grad})`, fillOpacity: 0.88, blur: 'blur(14px) saturate(1.4)', stroke: `url(#${ids.edge})`, strokeWidth: 1.5, sheen: true, tabLine: false, edgeStops: [0.95, 0.15], shadowColor: shade(color, -0.55), shadowOpacity: 0.28, tilt: -12 }
    default: // original: flat soft pastel frosted glass
      return { ...whiteBadge, fill: shade(color, 0.45), fillOpacity: 0.7, blur: 'blur(6px)', stroke: 'rgba(255,255,255,0.58)', strokeWidth: 1, sheen: false, tabLine: false, edgeStops: [0, 0], shadowColor: '#4b5563', shadowOpacity: 0.22, tilt: 0 }
  }
}

const TAB_PATH = 'M28 50Q28 0 78 0H134C151 0 163 7 172 19C179 28 185 30 196 30'

const BASE_WIDTH = 311
// Empty space each side of the flap art inside BASE_WIDTH; trimmed from the layout box so folders align with page edges
const ART_INSET = 23
const BASE_HEIGHT = 280

interface FolderProps {
  color?: string
  hasLinks?: boolean
  linkCount?: number
  placeholder?: boolean
  scale?: number
  width?: number
  desktopWidth?: number
  previewStyle?: FolderStyle
}

export function Folder({ color = '#f5cb5c', hasLinks = false, linkCount = 0, placeholder = false, scale = 1, width, desktopWidth, previewStyle }: FolderProps) {
  const theme = buildTheme(color)
  const folderStyle = previewStyle ?? useFolderStyle()
  const uid = useId().replace(/:/g, '')
  const flapGradientId = `folder_flap_${uid}`
  const sheenId = `folder_sheen_${uid}`
  const edgeId = `folder_edge_${uid}`
  const filterId = `folder_filter_${uid}`
  const iconTintId = `folder_icon_${uid}`
  const patternId = `folder_pattern_${uid}`
  const look: ReturnType<typeof buildLook> & { iconColor?: string } = buildLook(folderStyle, color, { grad: flapGradientId, edge: edgeId, pattern: patternId })
  const mobileScale = width ? width / BASE_WIDTH : scale
  const desktopScale = desktopWidth ? desktopWidth / BASE_WIDTH : mobileScale
  const getScale = useCallback(() => typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopScale : Math.min(mobileScale, 0.50), [mobileScale, desktopScale])
  const [responsiveScale, setResponsiveScale] = useState(getScale)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const updateScale = () => setResponsiveScale(getScale())
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [getScale])

  return (
    <div
      className="folder-root relative cursor-pointer select-none"
      style={{ width: (BASE_WIDTH - ART_INSET * 2) * responsiveScale, height: BASE_HEIGHT * responsiveScale }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${responsiveScale})`,
          perspective: 800 * responsiveScale,
        }}
      >
        {hasLinks && (
          <div className="absolute left-1/2 top-[12%] z-0 h-[214px] w-[174px] -translate-x-1/2">
            {Array.from({ length: Math.min(Math.max(linkCount, 1), 3) }).map((_, index, cards) => (
              <motion.div
                key={index}
                className="absolute left-0 top-0"
                animate={{ y: isHovered ? -56 - index * 4 : -42 - index * 4, x: (index - (cards.length - 1) / 2) * 20 + (cards.length === 1 ? -8 : 0), rotate: isHovered ? (index - (cards.length - 1) / 2) * 6 + (cards.length === 1 ? -3 : 0) : (index - (cards.length - 1) / 2) * 5 + (cards.length === 1 ? -3 : 0), scale: isHovered ? 1.06 : responsiveScale >= 0.35 ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14, delay: index * 0.04 }}
              >
                <FolderCard id={index + 1} theme={theme} />
              </motion.div>
            ))}
          </div>
        )}
        {/* Flap */}
        <motion.div
          className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 321, height: 241, transformOrigin: '50% 100%' }}
          animate={{ rotateX: isHovered && !placeholder ? look.tilt : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: placeholder ? undefined : look.blur,
              WebkitBackdropFilter: placeholder ? undefined : look.blur,
              clipPath: `path('${FLAP_PATH}')`,
              WebkitClipPath: `path('${FLAP_PATH}')`,
            }}
          />
          <svg className="absolute inset-0" width="321" height="241" viewBox="0 0 321 241" fill="none">
            <g filter={`url(#${filterId})`}>
              <path d={FLAP_PATH} style={{ fill: placeholder ? 'transparent' : look.fill, fillOpacity: placeholder ? 0 : look.fillOpacity }} />
              {!placeholder && look.sheen && <path d={FLAP_PATH} fill={`url(#${sheenId})`} />}
              <path
                d={FLAP_PATH}
                style={{ stroke: placeholder ? color : look.stroke }}
                strokeDasharray={placeholder ? '9 8' : undefined}
                strokeWidth={placeholder ? 2.5 : look.strokeWidth}
              />
              {!placeholder && look.tabLine && <path d={TAB_PATH} stroke={color} strokeWidth="4" strokeLinecap="round" />}
              {!placeholder && <>
                <image href="/icons/netbird-dark.svg" x="60" y="30" width="60" height="60" filter={look.iconColor ? `url(#${iconTintId})` : undefined} opacity={look.iconColor ? 0.85 : undefined} />
                <circle cx="238" cy="186" r="24" fill="#000" opacity="0.12" />
                <circle cx="238" cy="184" r="24" fill={look.badgeFill} />
                <text x="238" y="190" textAnchor="middle" fill={look.badgeText} fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif">{linkCount}</text>
              </>}
            </g>
            <defs>
              <linearGradient id={flapGradientId} x1="0" y1="0" x2="0" y2="241" gradientUnits="userSpaceOnUse">
                <stop stopColor={shade(color, 0.5)} />
                <stop offset="1" stopColor={shade(color, 0.22)} />
              </linearGradient>
              {/* Specular sheen: light catching the upper glass */}
              <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="241" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0.55" />
                <stop offset="0.42" stopColor="white" stopOpacity="0.08" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={edgeId} x1="0" y1="0" x2="0" y2="241" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity={look.edgeStops[0]} />
                <stop offset={look.sheen ? 1 : 0.15} stopColor="white" stopOpacity={look.edgeStops[1]} />
              </linearGradient>
              <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
                <rect width="24" height="24" fill="var(--color-bg-card)" />
                <path d="M-6 6 6-6M0 24 24 0M18 30 30 18" stroke={color} strokeOpacity=".18" strokeWidth="3" />
                <circle cx="6" cy="6" r="1.5" fill={color} fillOpacity=".18" />
              </pattern>
              {/* Recolors the black bird icon (Neutral style, readable on dark glass) */}
              {look.iconColor && (
                <filter id={iconTintId}>
                  <feFlood floodColor={look.iconColor} />
                  <feComposite in2="SourceAlpha" operator="in" />
                </filter>
              )}
              <filter id={filterId} x="-25.4" y="-25.4" width="371.8" height="291.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="2.65" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.10 0" />
              <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
              <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor={look.shadowColor} floodOpacity={look.shadowOpacity} />
              </filter>
            </defs>
          </svg>
        </motion.div>
      </div>
    </div>
  )
}

type ThemeType = ReturnType<typeof buildTheme>

function FolderCard({ id, theme }: { id: number; theme: ThemeType }) {
  const filterId = `paper_filter_${id}`
  return (
    <svg width="174" height="214" viewBox="0 0 174 214" fill="none">
      <g filter={`url(#${filterId})`}>
        <rect width="174" height="214" rx="18" fill={theme.cardFill} />
      </g>
      <rect width="174" height="214" rx="18" stroke={theme.cardStroke} strokeWidth="2" />
      <rect x="24" y="24" width="38" height="36" rx="8" fill={theme.cardAccent} />
      <rect x="72" y="26" width="78" height="8" rx="4" fill={theme.cardLineFill} opacity="0.9" />
      <rect x="72" y="42" width="55" height="6" rx="3" fill={theme.cardLineFill} opacity="0.62" />
      <rect x="24" y="74" width="126" height="7" rx="3.5" fill={theme.cardLineFill} opacity="0.76" />
      <rect x="24" y="91" width="92" height="6" rx="3" fill={theme.cardLineFill} opacity="0.58" />
      <rect x="24" y="113" width="42" height="6" rx="3" fill={theme.cardLineFill} opacity="0.65" />
      <rect x="74" y="113" width="34" height="6" rx="3" fill={theme.cardLineFill} opacity="0.65" />
      <rect x="116" y="113" width="34" height="6" rx="3" fill={theme.cardLineFill} opacity="0.65" />
      <defs>
        <filter id={filterId} x="-8" y="-8" width="190" height="230" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#6c6c6c" floodOpacity="0.18" />
        </filter>
      </defs>
    </svg>
  )
}
