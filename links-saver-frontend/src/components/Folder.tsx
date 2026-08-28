import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const FLAP_PATH =
  'M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z'

// Map any hex color to folder theme values
function buildTheme(color: string) {
  return {
    backFill: color,
    backInsetShadow: 'inset 0 0 6px 2px rgba(255,255,255,0.25)',
    flapFill: color,
    flapFillOpacity: 0.55,
    flapStroke: 'rgba(255,255,255,0.35)',
    flapInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.10 0',
    cardFill: '#F1F1F1',
    cardStroke: '#E0E0E0',
    cardLineFill: '#D4D4D4',
    cardInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0',
  }
}

const BASE_WIDTH = 311
const BASE_HEIGHT = 280

interface FolderProps {
  color?: string
  hasLinks?: boolean
  scale?: number
  width?: number
  desktopWidth?: number
  linkCount?: number
}

export function Folder({ color = '#3b82f6', hasLinks = false, scale = 1, width, desktopWidth, linkCount = 0 }: FolderProps) {
  const theme = buildTheme(color)
  const mobileScale = width ? width / BASE_WIDTH : scale
  const desktopScale = desktopWidth ? desktopWidth / BASE_WIDTH : mobileScale
  const getScale = useCallback(() => typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopScale : Math.min(mobileScale, 0.43), [mobileScale, desktopScale])
  const [responsiveScale, setResponsiveScale] = useState(getScale)
  const [isHovered, setIsHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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
      onMouseLeave={() => { setIsHovered(false); setIsOpen(false) }}
      onClick={() => setIsOpen(o => !o)}
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
        {/* Back panel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            style={{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              borderRadius: 25,
              backgroundColor: theme.backFill,
              boxShadow: theme.backInsetShadow,
            }}
          />
        </div>

        {/* Cards inside */}
        {hasLinks && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <motion.div
              className="absolute"
              animate={{ y: isOpen ? -160 : isHovered ? -22 : -10, x: isOpen ? 70 : 40, rotate: isOpen ? 18 : isHovered ? 12 : 10, scale: isOpen ? 1.16 : isHovered ? 1.14 : 1.08 }}
              transition={{ type: 'spring', stiffness: 120, damping: 13, delay: isOpen ? 0.1 : isHovered ? 0.12 : 0 }}
            >
              <FolderCard id={1} theme={theme} />
            </motion.div>
            <motion.div
              className="absolute"
              animate={{ y: isOpen ? -180 : isHovered ? -26 : -20, x: isOpen ? 0 : 3, rotate: isOpen ? -3 : isHovered ? -1 : 2, scale: isOpen ? 1.42 : isHovered ? 1.38 : 1.28 }}
              transition={{ type: 'spring', stiffness: 120, damping: 13, delay: isOpen ? 0.05 : isHovered ? 0.06 : 0 }}
            >
              <FolderCard id={2} theme={theme} />
            </motion.div>
            <motion.div
              className="absolute"
              animate={{ y: isOpen ? -170 : isHovered ? -32 : -22, x: isOpen ? -65 : -40, rotate: isOpen ? -14 : isHovered ? -7 : -5, scale: isOpen ? 1.16 : isHovered ? 1.24 : 1.00 }}
              transition={{ type: 'spring', stiffness: 120, damping: 13 }}
            >
              <FolderCard id={3} theme={theme} />
            </motion.div>
          </div>
        )}

        <span
          className="absolute bottom-[12%] left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 font-semibold leading-none shadow-sm"
          style={{ color: '#fff', fontSize: `${Math.max(18, 18 / responsiveScale)}px` }}
        >
          {linkCount}
        </span>

        {/* Flap */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4"
          style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d', width: 321, height: 241 }}
          animate={{ rotateX: isOpen ? -55 : isHovered ? -25 : -15 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
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
              <path d={FLAP_PATH} fill={theme.flapFill} fillOpacity={theme.flapFillOpacity} />
              <path
                d="M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z"
                stroke={theme.flapStroke}
              />
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
  const filterId = `card_filter_${id}`
  const shadowId = `card_shadow_${id}`
  return (
    <svg width="164" height="214" viewBox="0 0 164 214" fill="none">
      <g filter={`url(#${filterId})`}>
        <rect width="163.078" height="213.262" rx="20" fill={theme.cardFill} />
      </g>
      <rect x="0.5" y="0.5" width="162.078" height="212.262" rx="19.5" stroke={theme.cardStroke} />
      <rect x="14.12" y="31.21" width="134.84" height="11.89" rx="5.94" fill={theme.cardLineFill} />
      {[60.99, 75.11, 89.23, 103.35, 117.47, 131.59, 145.7, 159.82, 173.94].map((y, i) => (
        <g key={i}>
          <rect width="64.52" height="5.88" rx="2.94" transform={`matrix(1 -0.000409 0.00202 1 14.83 ${y})`} fill={theme.cardLineFill} />
          <rect width="64.52" height="5.88" rx="2.94" transform={`matrix(1 -0.000461 0.00179 1 84.43 ${y - 0.03})`} fill={theme.cardLineFill} />
        </g>
      ))}
      <defs>
        <filter id={filterId} x="0" y="0" width="166.078" height="218.262" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="2" operator="erode" in="SourceAlpha" result={shadowId} />
          <feOffset dx="3" dy="5" />
          <feGaussianBlur stdDeviation="3.05" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values={theme.cardInsetColor} />
          <feBlend mode="normal" in2="shape" result={shadowId} />
        </filter>
      </defs>
    </svg>
  )
}
