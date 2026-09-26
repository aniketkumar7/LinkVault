import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const FLAP_PATH =
  'M28 50Q28 0 78 0H134C151 0 163 7 172 19C179 28 185 30 196 30H243Q293 30 293 80V191Q293 241 243 241H78Q28 241 28 191V50Z'

// Map any hex color to a soft paper-folder palette.
function softenColor(color: string) {
  const hex = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16))
  const softened = channels.map(channel => Math.round(channel + (255 - channel) * 0.58))
  return `#${softened.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

function buildTheme(color: string) {
  return {
    backFill: softenColor(color),
    backInsetShadow: 'inset 0 1px 0 rgba(255,255,255,0.52), inset 0 -10px 24px rgba(90,70,30,0.08), 0 14px 24px rgba(30,25,18,0.12)',
    flapFill: softenColor(color),
    flapFillOpacity: 0.62,
    flapStroke: 'rgba(255,255,255,0.58)',
    flapInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.10 0',
    cardFill: '#FFFFFF',
    cardStroke: '#C9CDD3',
    cardLineFill: '#D2D6DC',
    cardInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0',
  }
}

const BASE_WIDTH = 311
const BASE_HEIGHT = 280

interface FolderProps {
  color?: string
  hasLinks?: boolean
  linkCount?: number
  placeholder?: boolean
  scale?: number
  width?: number
  desktopWidth?: number
}

export function Folder({ color = '#3b82f6', hasLinks = false, linkCount = 0, placeholder = false, scale = 1, width, desktopWidth }: FolderProps) {
  const theme = buildTheme(color)
  const mobileScale = width ? width / BASE_WIDTH : scale
  const desktopScale = desktopWidth ? desktopWidth / BASE_WIDTH : mobileScale
  const getScale = useCallback(() => typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopScale : Math.min(mobileScale, 0.43), [mobileScale, desktopScale])
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
      style={{ width: BASE_WIDTH * responsiveScale, height: BASE_HEIGHT * responsiveScale }}
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
          style={{ width: 321, height: 241 }}
          animate={{ rotateX: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              clipPath: `path('${FLAP_PATH}')`,
              WebkitClipPath: `path('${FLAP_PATH}')`,
            }}
          />
          <svg className="absolute inset-0" width="321" height="241" viewBox="0 0 321 241" fill="none">
            <g filter="url(#flap_filter)">
              <path d={FLAP_PATH} fill={placeholder ? 'transparent' : theme.flapFill} fillOpacity={placeholder ? 0 : theme.flapFillOpacity} />
              <path
                d={FLAP_PATH}
                stroke={placeholder ? color : theme.flapStroke}
                strokeDasharray={placeholder ? '9 8' : undefined}
                strokeWidth={placeholder ? 2.5 : undefined}
              />
              {!placeholder && <>
                <circle cx="205" cy="158" r="28" fill={theme.flapFill} stroke="rgba(255,255,255,0.92)" strokeWidth="3" />
                <circle cx="205" cy="158" r="20" fill={theme.backFill} />
                <path d="M195 158C195 153 199 149 204 149H210C214 149 217 152 217 156C217 160 214 163 210 163H205" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M215 158C215 163 211 167 206 167H200C196 167 193 164 193 160C193 156 196 153 200 153H205" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
              </>}
            </g>
            <defs>
              <filter id="flap_filter" x="-25.4" y="-25.4" width="371.8" height="291.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="2.65" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values={theme.flapInsetColor} />
              <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#4b5563" floodOpacity="0.22" />
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
      <rect x="24" y="24" width="38" height="36" rx="8" fill={theme.cardLineFill} opacity="0.92" />
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
