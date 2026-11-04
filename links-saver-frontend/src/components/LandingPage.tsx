import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import {
  AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform,
  type MotionValue,
} from 'framer-motion'
import {
  ArrowCounterClockwise, ArrowDown, ArrowUpRight, Bell, Check, CheckSquare, ClipboardText, DeviceMobile, FilePdf, Files, Heart,
  Image as ImageIcon, LinkSimple, LockSimple, MagnifyingGlass, Moon, PencilSimple, PushPin, ShareNetwork, SpeakerHigh, Stack,
  Sun, Trash, Tray,
  WarningCircle,
} from '@phosphor-icons/react'
import { Folder } from './Folder'
import { FluidOrbAvatar } from './ui/FluidOrbAvatar'
import { useCircularTheme } from './CircularThemeProvider'
import { FOLDER_STYLES } from '@/lib/folderStyle'
import { ACCENTS, setAccent } from '@/lib/accents'
import { AVATAR_DEFAULT_FUR, DEFAULT_AVATAR_CONFIG, type ProfileAvatarId } from '@/lib/profile'

interface Props { onGetStarted: (signUp?: boolean) => void }

const EASE = [0.16, 1, 0.3, 1] as const
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const typed = (text: string, t: number) => text.slice(0, Math.round(text.length * clamp01(t)))

// Inertia scrolling for the landing page only; the app keeps native scrolling.
function useLenis(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -72 }, lerp: 0.09 })
    return () => lenis.destroy()
  }, [enabled])
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setDesktop(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return desktop
}

/** Cycles 0..length-1 every `ms` while the element is on screen (static when reduced motion). */
function useLoop(length: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    const timer = setInterval(() => setIndex(i => (i + 1) % length), ms)
    return () => clearInterval(timer)
  }, [inView, reduce, length, ms])
  return [ref, index] as const
}

const SEARCH_DEMOS = [
  { query: 'typography', result: '6 results across 3 folders' },
  { query: 'readme', result: '2 results in Read later' },
  { query: 'figma.com', result: '11 results in Design' },
]

function SearchDemo() {
  const [ref, index] = useLoop(SEARCH_DEMOS.length, 2600)
  const demo = SEARCH_DEMOS[index]
  return (
    <div ref={ref} className="mt-6 flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-bg-tertiary)' }}>
      <MagnifyingGlass size={15} className="shrink-0" style={{ color: 'var(--color-accent)' }} />
      <AnimatePresence mode="wait">
        <motion.span key={demo.query} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="min-w-0 truncate">
          “{demo.query}” <span style={{ color: 'var(--color-text-muted)' }}>· {demo.result}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function ShareDemo() {
  const [ref, index] = useLoop(2, 2200)
  const copied = index === 1
  return (
    <div ref={ref} className="mt-6 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 font-mono text-xs" style={{ borderColor: copied ? 'var(--color-accent)' : 'var(--color-border)', background: 'var(--color-bg-tertiary)', transition: 'border-color .3s' }}>
      <span className="truncate">bookmarky.app/s/9f3kq2…</span>
      <AnimatePresence mode="wait">
        <motion.span key={copied ? 'copied' : 'copy'} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex shrink-0 items-center gap-1 font-sans font-semibold" style={{ color: 'var(--color-accent)' }}>
          {copied ? <><Check size={13} weight="bold" /> Copied</> : 'Copy'}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function SectionIntro({ kicker, title, text }: { kicker: string; title: React.ReactNode; text: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="landing-serif text-xl" style={{ color: 'var(--color-accent)' }}>{kicker}</p>
      <h2 className="mt-2 text-balance text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.045em] sm:mt-3 sm:text-6xl">{title}</h2>
      <p className="mt-4 max-w-[56ch] text-pretty text-base leading-7 sm:mt-5 sm:text-lg sm:leading-8" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
    </Reveal>
  )
}

/* ─────────────────────────────── Hero ─────────────────────────────── */

// sx: start x in "folder column widths" from centre; sy: start y in px from the top of the stage
const HERO_LINKS = [
  { title: 'How to do great work', domain: 'paulgraham.com', sx: -0.95, sy: 70, rotate: -7, folder: 1 },
  { title: 'Auto layout, explained', domain: 'figma.com', sx: -0.15, sy: 10, rotate: 4, folder: 0 },
  { title: 'Lo-fi beats for deep focus', domain: 'youtube.com', sx: 0.85, sy: 55, rotate: -3, folder: 2 },
  { title: 'The art of the README', domain: 'github.com', sx: -0.6, sy: 140, rotate: 5, folder: 1 },
  { title: 'Spacing systems that scale', domain: 'smashingmagazine.com', sx: 0.45, sy: 125, rotate: -5, folder: 0 },
]
const HERO_FOLDERS = [
  { name: 'Design', color: '#e0805a', count: 14 },
  { name: 'Read later', color: '#84a98c', count: 27 },
  { name: 'Watch', color: '#9983d7', count: 9 },
]

function HeroChip({ link, index, progress, colWidth, dropY }: {
  link: (typeof HERO_LINKS)[number]; index: number; progress: MotionValue<number>; colWidth: MotionValue<number>; dropY: MotionValue<number>
}) {
  const start = 0.03 + index * 0.05
  const end = start + 0.3
  const segment = (p: number) => easeOut(clamp01((p - start) / (end - start)))
  // Each chip slides from its scattered spot into its folder, then disappears inside it
  const x = useTransform([progress, colWidth], ([p, w]: number[]) => {
    const t = segment(p)
    return (link.sx + ((link.folder - 1) - link.sx) * t) * w
  })
  const y = useTransform([progress, dropY], ([p, drop]: number[]) => link.sy + (drop - link.sy) * segment(p))
  const rotate = useTransform(progress, [start, end], [link.rotate, 0])
  const scale = useTransform(progress, [start, end], [1, 0.5])
  const opacity = useTransform(progress, [end - 0.05, end], [1, 0])

  return (
    <motion.div className="absolute left-1/2 top-0 z-20 -ml-[5.5rem] sm:-ml-28" style={{ x, y, rotate, scale, opacity }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6 + index * 0.08, duration: 0.7, ease: EASE }}
        className="landing-chip flex w-44 items-center gap-2.5 p-2 pr-3 sm:w-56"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--color-accent) 16%, transparent)', color: 'var(--color-accent)' }}>
          {link.domain.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold">{link.title}</span>
          <span className="block truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{link.domain}</span>
        </span>
      </motion.div>
    </motion.div>
  )
}

function Hero({ onGetStarted }: Props) {
  const ref = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const colWidth = useMotionValue(250)
  const dropY = useMotionValue(260)
  const headline = ['Save', 'the', 'link.', 'Keep', 'the']

  // Measure the folder row so chips land on the folders at any screen width
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const measure = () => {
      colWidth.set(row.offsetWidth / 3)
      dropY.set(row.offsetTop + 24)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [colWidth, dropY])

  return (
    <section ref={ref} id="top" className="relative pt-28 sm:pt-40">
      <div className="landing-container text-center">
        <h1 className="mx-auto max-w-[13ch] text-balance text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
          {headline.map((word, i) => (
            <motion.span key={i} className="inline-block pr-[0.22em]" initial={{ opacity: 0, y: '0.6em', filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.05 + i * 0.07, duration: 0.8, ease: EASE }}>
              {word}
            </motion.span>
          ))}
          <motion.span className="landing-serif inline-block font-normal tracking-[-0.03em]" style={{ color: 'var(--color-accent)' }} initial={{ opacity: 0, y: '0.6em', filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.45, duration: 0.9, ease: EASE }}>
            idea.
          </motion.span>
        </h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: EASE }} className="mx-auto mt-5 max-w-[46ch] text-pretty text-base leading-7 sm:mt-7 sm:text-xl sm:leading-8" style={{ color: 'var(--color-text-secondary)' }}>
          Bookmarky turns links, screenshots and files into tidy folders you can actually search. Save in a second, find it months later.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.8, ease: EASE }} className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:mt-9">
          <MagneticButton onClick={() => onGetStarted(true)}>Start saving, it’s free</MagneticButton>
          <a href="#story" className="group flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            See how it works <ArrowDown size={15} weight="bold" className="transition-transform group-hover:translate-y-0.5" />
          </a>
        </motion.div>
      </div>

      {/* Links drop into folders as you scroll */}
      <div className="landing-container relative mt-8 h-[320px] sm:mt-16 sm:h-[440px]">
        <div className="relative mx-auto h-full max-w-[760px]">
          {HERO_LINKS.map((link, i) => <HeroChip key={link.title} link={link} index={i} progress={scrollYProgress} colWidth={colWidth} dropY={dropY} />)}
          <div ref={rowRef} className="absolute inset-x-0 bottom-0 grid grid-cols-3 items-end">
            {HERO_FOLDERS.map((folder, i) => (
              <motion.div key={folder.name} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.9, ease: EASE }} className="flex flex-col items-center">
                <Folder color={folder.color} hasLinks linkCount={folder.count} width={100} desktopWidth={210} />
                <p className="mt-2 text-sm font-semibold">{folder.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 250, damping: 18 })
  const springY = useSpring(y, { stiffness: 250, damping: 18 })
  const onMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (reduce || event.pointerType !== 'mouse') return
    const box = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - box.left - box.width / 2) * 0.25)
    y.set((event.clientY - box.top - box.height / 2) * 0.35)
  }
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={() => { x.set(0); y.set(0) }}
      whileTap={{ scale: 0.97 }}
      style={{ x: springX, y: springY, background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)', boxShadow: '0 18px 40px -20px var(--color-accent)' }}
      className="group flex items-center gap-2.5 rounded-full px-7 py-4 text-[15px] font-semibold"
    >
      {children}
      <ArrowUpRight size={18} weight="bold" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </motion.button>
  )
}

/* ──────────────────────── Pinned story: capture → organize → find ──────────────────────── */

const STORY = [
  { key: 'capture', title: 'Capture', text: 'Paste a link and Bookmarky fetches the title, description, preview image and icon for you, so every save is recognisable at a glance.' },
  { key: 'organize', title: 'Organize', text: 'Drop it into a colorful folder. Smart folders keep All links, Favorites and Unsorted one click away.' },
  { key: 'find', title: 'Find', text: 'Search titles, URLs and descriptions across every folder at once. Press Ctrl K from anywhere.' },
]
const STORY_TITLE = 'Three moves. That’s the whole habit.'
const STORY_URL = 'paulgraham.com/greatwork.html'
const SEARCH_ROWS = ['Auto layout, explained', 'How to do great work', 'Spacing systems that scale', 'The art of the README']

function AppMock({ step, local }: { step: number; local: number }) {
  const searchQuery = step === 2 ? typed('great work', local * 1.4) : ''
  return (
    <div className="landing-window w-full overflow-hidden">
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
        <span className="flex gap-1.5">{[0, 1, 2].map(i => <i key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-border-hover)' }} />)}</span>
        <div className="ml-3 flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5 text-xs" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
          <MagnifyingGlass size={13} />
          {searchQuery ? <span style={{ color: 'var(--color-text-primary)' }}>{searchQuery}<span className="landing-caret" /></span> : 'Search all links…'}
          <kbd className="ml-auto rounded border px-1 text-[10px]" style={{ borderColor: 'var(--color-border)' }}>Ctrl K</kbd>
        </div>
      </div>

      <div className="relative h-[340px] p-5">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="capture" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Add a link</p>
              <div className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-bg-tertiary)' }}>
                <LinkSimple size={15} style={{ color: 'var(--color-accent)' }} />
                <span className="truncate">https://{typed(STORY_URL, local * 1.6)}<span className="landing-caret" /></span>
              </div>
              <motion.div animate={{ opacity: local > 0.62 ? 1 : 0, y: local > 0.62 ? 0 : 14 }} transition={{ duration: 0.45, ease: EASE }} className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
                <div className="h-24" style={{ background: 'linear-gradient(120deg, color-mix(in srgb, var(--color-accent) 30%, transparent), color-mix(in srgb, var(--color-accent) 6%, transparent))' }} />
                <div className="p-4">
                  <p className="font-semibold">How to Do Great Work</p>
                  <p className="mt-1 text-xs leading-5" style={{ color: 'var(--color-text-secondary)' }}>If you collected lists of techniques for doing great work in a lot of different fields, what would the intersection look like?</p>
                  <p className="mt-3 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>paulgraham.com · saved just now</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="organize" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="flex h-full flex-col">
              <div className="flex gap-2 text-[11px] font-semibold">
                {['All links', 'Favorites', 'Unsorted'].map(name => <span key={name} className="rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{name}</span>)}
              </div>
              <motion.div animate={{ y: local * 150, scale: 1 - local * 0.45, opacity: local > 0.8 ? 0 : 1 }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} className="mx-auto mt-4 w-60 rounded-xl border p-2.5 text-xs font-semibold" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
                How to Do Great Work
                <span className="block text-[10px] font-normal" style={{ color: 'var(--color-text-muted)' }}>paulgraham.com</span>
              </motion.div>
              <div className="mt-auto grid grid-cols-3 items-end">
                {HERO_FOLDERS.map((folder, i) => (
                  <div key={folder.name} className="flex flex-col items-center">
                    <Folder color={folder.color} hasLinks linkCount={i === 1 && local > 0.75 ? folder.count + 1 : folder.count} width={96} desktopWidth={120} />
                    <p className="mt-1 text-[11px] font-semibold">{folder.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="find" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="space-y-2">
              {SEARCH_ROWS.map(row => {
                const query = searchQuery.trim().toLowerCase()
                const match = !query || row.toLowerCase().includes(query)
                const at = query ? row.toLowerCase().indexOf(query) : -1
                return (
                  <motion.div key={row} animate={{ opacity: match ? 1 : 0.18, scale: match && query ? 1.02 : 1 }} transition={{ duration: 0.3 }} className="flex items-center gap-3 rounded-xl border p-3 text-sm" style={{ borderColor: match && query ? 'var(--color-accent)' : 'var(--color-border)', background: 'var(--color-bg-card)' }}>
                    <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }} />
                    <span className="truncate">
                      {at >= 0 ? <>{row.slice(0, at)}<mark className="landing-mark">{row.slice(at, at + query.length)}</mark>{row.slice(at + query.length)}</> : row}
                    </span>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Phones: stacked steps, each mock in its finished state
function StoryStacked() {
  return (
    <section id="story" className="landing-container space-y-12 py-14">
      <SectionIntro kicker="How it works" title={STORY_TITLE} text="Capture it, give it a home, find it again. Each step takes seconds." />
      {STORY.map((item, i) => (
        <Reveal key={item.key}>
          <p className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>0{i + 1}</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{item.title}</h3>
          <p className="mb-5 mt-2 leading-7" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</p>
          <AppMock step={i} local={1} />
        </Reveal>
      ))}
    </section>
  )
}

// Desktop: the section pins for ~3 screens while scroll drives the app mock
function StoryPinned() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [state, setState] = useState({ step: 0, local: 0 })
  useMotionValueEvent(scrollYProgress, 'change', value => {
    const scaled = clamp01(value) * STORY.length
    const step = Math.min(STORY.length - 1, Math.floor(scaled))
    setState({ step, local: clamp01(scaled - step) })
  })

  return (
    <section ref={ref} id="story" className="relative" style={{ height: `${STORY.length * 100 + 60}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] items-center">
        <div className="landing-container grid w-full grid-cols-[0.85fr_1.15fr] items-center gap-16">
          <div>
            <p className="landing-serif text-xl" style={{ color: 'var(--color-accent)' }}>How it works</p>
            <h2 className="mt-3 text-5xl font-semibold leading-[1.02] tracking-[-0.045em]">{STORY_TITLE}</h2>
            <ol className="mt-10 space-y-2">
              {STORY.map((item, i) => {
                const active = i === state.step
                return (
                  <li key={item.key} className="relative rounded-2xl p-5 transition-colors duration-500" style={{ background: active ? 'var(--color-bg-card)' : 'transparent' }}>
                    <div className="flex items-baseline gap-4">
                      <span className="font-mono text-xs" style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>0{i + 1}</span>
                      <div>
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] transition-opacity duration-500" style={{ opacity: active ? 1 : 0.4 }}>{item.title}</h3>
                        <motion.div initial={false} animate={{ height: active ? 'auto' : 0, opacity: active ? 1 : 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                          <p className="pt-2 leading-7" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</p>
                        </motion.div>
                      </div>
                    </div>
                    {active && (
                      <span className="absolute bottom-0 left-5 right-5 h-px overflow-hidden" style={{ background: 'var(--color-border)' }}>
                        <span className="block h-full origin-left" style={{ background: 'var(--color-accent)', transform: `scaleX(${state.local})` }} />
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
          <AppMock step={state.step} local={state.local} />
        </div>
      </div>
    </section>
  )
}

function Story() {
  const desktop = useIsDesktop()
  const reduce = useReducedMotion()
  return desktop && !reduce ? <StoryPinned /> : <StoryStacked />
}

/* ─────────────────────────── Every way in (capture bento) ─────────────────────────── */

function Tile({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className={`landing-tile relative overflow-hidden p-5 sm:p-6 ${className}`}>
      {children}
    </Reveal>
  )
}

function TileText({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <motion.span whileHover={{ rotate: -8, scale: 1.08 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)' }}>{icon}</motion.span>
        <h3 className="text-lg font-semibold leading-tight tracking-[-0.025em] sm:text-xl">{title}</h3>
      </div>
      <p className="mt-3 max-w-[46ch] text-[15px] leading-6" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
    </div>
  )
}

const SCAN_LINKS = [
  { url: 'linear.app/method', folder: 'Work', color: '#72afd0' },
  { url: 'refactoringui.com', folder: 'Design', color: '#e0805a' },
  { url: 'craftinginterpreters.com', folder: 'Read later', color: '#84a98c' },
]

function ScreenshotTile() {
  const reduce = useReducedMotion()
  return (
    <Tile className="lg:col-span-4 lg:row-span-2">
      <TileText icon={<ImageIcon size={18} weight="bold" />} title="Screenshots become links" text="Drop up to five screenshots. AI reads every URL in them and suggests the folder each one belongs in." />
      <div className="relative mt-6 grid gap-4 sm:mt-8 sm:grid-cols-[0.9fr_1.1fr] sm:gap-5">
        <div className="relative overflow-hidden rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
          <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>screenshot.png</p>
          {SCAN_LINKS.map(link => (
            <div key={link.url} className="mt-3 space-y-1.5">
              <span className="block h-2 w-3/4 rounded-full" style={{ background: 'var(--color-border)' }} />
              <span className="block font-mono text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{link.url}</span>
            </div>
          ))}
          {!reduce && (
            <motion.span aria-hidden className="absolute inset-x-0 h-12" style={{ background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-accent) 28%, transparent), transparent)' }} animate={{ top: ['-15%', '100%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }} />
          )}
        </div>
        <div className="space-y-2.5">
          {SCAN_LINKS.map((link, i) => (
            <motion.div key={link.url} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.25, duration: 0.6, ease: EASE }} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
              <span className="truncate font-mono text-[12px]">{link.url}</span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, ${link.color} 18%, transparent)` }}>
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: link.color }} /> {link.folder}
              </span>
            </motion.div>
          ))}
          <p className="pt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Suggested folders · review before saving</p>
        </div>
      </div>
    </Tile>
  )
}

function WaysIn() {
  return (
    <section id="capture" className="landing-container py-14 sm:py-28">
      <SectionIntro kicker="Every way in" title="However the link reaches you, it ends up in one place." text="A tab, a pasted list, an old bookmarks file, a screenshot, a PDF, something shared from your phone. Bookmarky takes all of it." />
      <div className="mt-8 grid gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-6">
        <ScreenshotTile />
        <Tile className="lg:col-span-2" delay={0.05}>
          <TileText icon={<ClipboardText size={18} weight="bold" />} title="Paste anywhere" text="Copy a URL, press Ctrl V on the home screen, and the save form opens already filled in." />
          <div className="mt-6 flex items-center gap-2">
            {['Ctrl', 'V'].map(key => <kbd key={key} className="landing-key">{key}</kbd>)}
          </div>
        </Tile>
        <Tile className="lg:col-span-2" delay={0.1}>
          <TileText icon={<LinkSimple size={18} weight="bold" />} title="Rich previews, automatically" text="Title, description, image and icon are fetched for you. Duplicates are caught before they’re saved." />
        </Tile>
        <Tile className="lg:col-span-2" delay={0.05}>
          <TileText icon={<Tray size={18} weight="bold" />} title="Bulk paste" text="Paste a whole reading list, up to 100 links at once, straight into a collection." />
        </Tile>
        <Tile className="lg:col-span-2" delay={0.1}>
          <TileText icon={<Files size={18} weight="bold" />} title="Import your files" text="Bring in browser bookmarks, CSV, plain text or PDFs. Every URL inside is pulled out for you." />
          <div className="mt-5 flex flex-wrap gap-1.5">
            {['bookmarks.html', '.csv', '.pdf', '.txt'].map(ext => <span key={ext} className="rounded-md border px-2 py-1 font-mono text-[11px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{ext}</span>)}
          </div>
        </Tile>
        <Tile className="lg:col-span-2" delay={0.15}>
          <TileText icon={<DeviceMobile size={18} weight="bold" />} title="Share from your phone" text="Install Bookmarky to your home screen, then share links, images or PDFs to it from any app." />
        </Tile>
      </div>
    </section>
  )
}

/* ─────────────────────────── Organize ─────────────────────────── */

const MORPH_COLORS = ['#e0805a', '#84a98c', '#9983d7', '#72afd0', '#e5a94d', '#e9937d']

function Organize() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (reduce || paused) return
    const timer = setInterval(() => setIndex(i => (i + 1) % FOLDER_STYLES.length), 1800)
    return () => clearInterval(timer)
  }, [reduce, paused])
  const style = FOLDER_STYLES[index]

  const points = [
    { icon: <Heart size={16} weight="bold" />, text: 'Smart folders for All links, Favorites and Unsorted' },
    { icon: <PushPin size={16} weight="bold" />, text: 'Pin the collections you open every day' },
    { icon: <CheckSquare size={16} weight="bold" />, text: 'Select many links, then move or delete them in one go' },
    { icon: <ArrowCounterClockwise size={16} weight="bold" />, text: 'Deleted something by mistake? Undo it' },
  ]

  return (
    <section id="organize" className="landing-band">
      <div className="landing-container grid items-center gap-8 py-14 sm:gap-16 sm:py-28 lg:grid-cols-2">
        <div>
          <SectionIntro kicker="Organize" title="Folders that look like folders." text="Every collection is a folder you can color from 54 shades and dress in six styles. Pick what feels like yours." />
          <ul className="mt-7 space-y-3 sm:mt-10 sm:space-y-4">
            {points.map((point, i) => (
              <motion.li key={point.text} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ delay: i * 0.07, duration: 0.6, ease: EASE }} className="flex items-center gap-3 text-[15px]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: 'var(--color-bg-card)', color: 'var(--color-accent)' }}>{point.icon}</span>
                {point.text}
              </motion.li>
            ))}
          </ul>
        </div>
        <Reveal className="flex flex-col items-center">
          <div className="relative grid h-[220px] w-full place-items-center sm:h-[340px]">
            <AnimatePresence mode="popLayout">
              <motion.div key={style.key} initial={{ opacity: 0, scale: 0.9, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.05, rotate: 3 }} transition={{ duration: 0.55, ease: EASE }}>
                <Folder color={MORPH_COLORS[index % MORPH_COLORS.length]} hasLinks linkCount={12} width={150} desktopWidth={300} previewStyle={style.key} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Folder styles">
            {FOLDER_STYLES.map((item, i) => (
              <button key={item.key} type="button" aria-pressed={i === index} onClick={() => { setIndex(i); setPaused(true) }} className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors" style={{ background: i === index ? 'var(--color-accent-fill)' : 'var(--color-bg-card)', color: i === index ? 'var(--color-on-accent)' : 'var(--color-text-secondary)' }}>
                {item.label}
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Handled for you: manage, undo, inbox ─────────────────────────── */

const MANAGE_ROWS = [
  { name: 'Design', color: '#e0805a', count: 14 },
  { name: 'Read later', color: '#84a98c', count: 27 },
  { name: 'Watch', color: '#9983d7', count: 9 },
]

/** Same-height stage under each "Handled" tile so the three demos line up. */
function DemoStage({ children, stageRef }: { children: React.ReactNode; stageRef: React.Ref<HTMLDivElement> }) {
  return <div ref={stageRef} className="mt-5 flex h-[232px] flex-col justify-center">{children}</div>
}

function ManageDemo() {
  // 0: list · 1: "Read later" pinned → jumps to top · 2: new "Recipes" collection arrives
  const [ref, phase] = useLoop(3, 1900)
  const pinned = phase >= 1
  const rows = pinned ? [MANAGE_ROWS[1], MANAGE_ROWS[0], MANAGE_ROWS[2]] : MANAGE_ROWS
  const withNew = phase === 2 ? [...rows, { name: 'Recipes', color: '#e5a94d', count: 0 }] : rows

  return (
    <DemoStage stageRef={ref}>
      <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
        <MagnifyingGlass size={13} /> Search collections
      </div>
      <motion.ul layout className="space-y-1">
        <AnimatePresence initial={false}>
          {withNew.map(row => {
            const isPinned = pinned && row.name === 'Read later'
            const isNew = row.name === 'Recipes'
            return (
              <motion.li
                key={row.name}
                layout
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px]"
                style={{ background: isNew ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-tertiary))' : 'var(--color-bg-tertiary)' }}
              >
                <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />
                <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                {isNew && <span className="rounded px-1.5 py-px text-[10px] font-semibold" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}>New</span>}
                <span className="w-5 text-right text-[11px] tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{row.count}</span>
                <motion.span animate={{ rotate: isPinned ? -30 : 0, scale: isPinned ? 1.15 : 1 }} style={{ color: isPinned ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                  <PushPin size={13} weight={isPinned ? 'fill' : 'regular'} />
                </motion.span>
                <PencilSimple size={13} style={{ color: 'var(--color-text-muted)' }} />
              </motion.li>
            )
          })}
        </AnimatePresence>
      </motion.ul>
    </DemoStage>
  )
}

function UndoDemo() {
  // 0: link deleted, toast counts down · 1: undone, link back
  const [ref, phase] = useLoop(2, 2800)
  const deleted = phase === 0
  return (
    <DemoStage stageRef={ref}>
      <div className="space-y-1.5">
        {['Auto layout, explained', 'The art of the README', 'Spacing systems that scale'].map((title, i) => {
          const target = i === 1
          return (
            <motion.div key={title} animate={target ? { opacity: deleted ? 0.3 : 1, x: deleted ? 8 : 0 } : {}} transition={{ duration: 0.35 }} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px]" style={{ background: 'var(--color-bg-tertiary)', textDecoration: target && deleted ? 'line-through' : 'none' }}>
              <span className="h-5 w-5 shrink-0 rounded-md" style={{ background: 'var(--color-border)' }} />
              <span className="truncate">{title}</span>
            </motion.div>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={deleted ? 'deleted' : 'restored'} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }} className="mt-3 overflow-hidden rounded-xl border shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
            <span className="flex items-center gap-2">
              {deleted ? <Trash size={14} /> : <Check size={14} weight="bold" style={{ color: 'var(--color-accent)' }} />}
              {deleted ? 'Link deleted' : 'Link restored'}
            </span>
            {deleted && <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}>Undo</span>}
          </div>
          {deleted && <motion.div className="h-0.5 origin-left" style={{ background: 'var(--color-accent)' }} initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 2.6, ease: 'linear' }} />}
        </motion.div>
      </AnimatePresence>
    </DemoStage>
  )
}

const OLDER_NOTIFICATION = { id: 'older', title: 'Import partially completed', message: '12 saved · 2 couldn’t be imported', time: '2d ago' }
const NEW_NOTIFICATION = { id: 'new', title: 'Import complete', message: '42 links saved · 3 duplicates skipped', time: 'just now' }

function InboxDemo() {
  // 0: quiet · 1: bell rings, new unread item slides in · 2: "Mark all read" clears it
  const [ref, phase] = useLoop(3, 1900)
  const items = phase >= 1 ? [NEW_NOTIFICATION, OLDER_NOTIFICATION] : [OLDER_NOTIFICATION]
  const unread = phase === 1

  return (
    <DemoStage stageRef={ref}>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: 'var(--color-border)' }}>
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <motion.span animate={phase === 1 ? { rotate: [0, -18, 14, -10, 6, 0] } : { rotate: 0 }} transition={{ duration: 0.7 }} className="relative">
              <Bell size={15} weight="bold" />
              <AnimatePresence>
                {unread && <motion.i initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} className="absolute -right-1 -top-1 h-2 w-2 rounded-full" style={{ background: 'var(--color-accent-fill)' }} />}
              </AnimatePresence>
            </motion.span>
            Notifications
          </span>
          <motion.span animate={{ opacity: unread ? 1 : 0.4, color: phase === 2 ? 'var(--color-accent)' : 'var(--color-text-muted)' }} className="text-[11px] font-semibold">Mark all read</motion.span>
        </div>
        <motion.ul layout className="p-1.5">
          <AnimatePresence initial={false}>
            {items.map(item => {
              const isUnread = unread && item.id === 'new'
              return (
                <motion.li key={item.id} layout initial={{ opacity: 0, y: -16, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }} className="overflow-hidden">
                  <div className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors duration-500" style={{ background: isUnread ? 'var(--color-bg-tertiary)' : 'transparent' }}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)' }}>
                      <Tray size={14} weight="bold" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                        <span className="truncate">{item.title}</span>
                        {isUnread && <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--color-accent-fill)' }} />}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: 'var(--color-text-secondary)' }}>{item.message}</span>
                    </span>
                    <span className="shrink-0 text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>{item.time}</span>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </motion.ul>
      </div>
    </DemoStage>
  )
}

function Handled() {
  return (
    <section id="handled" className="landing-container py-14 sm:py-28">
      <SectionIntro kicker="Handled for you" title="Tidy up in seconds, take back mistakes." text="Rename, recolor, pin or remove collections from one panel. Deleted the wrong thing? Undo. Big imports report back to your inbox when they finish." />
      <div className="mt-8 grid gap-3 sm:mt-14 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tile>
          <TileText icon={<Stack size={18} weight="bold" />} title="Manage collections" text="Search, rename, recolor, pin and delete every collection from one panel." />
          <ManageDemo />
        </Tile>
        <Tile delay={0.08}>
          <TileText icon={<ArrowCounterClockwise size={18} weight="bold" />} title="Undo, not “are you sure?”" text="Delete in one click. A toast gives you a few seconds to take it back." />
          <UndoDemo />
        </Tile>
        <Tile className="md:col-span-2 lg:col-span-1" delay={0.12}>
          <TileText icon={<Bell size={18} weight="bold" />} title="Import results, not noise" text="The inbox only tells you how big imports went: what landed, what failed, what was a duplicate." />
          <InboxDemo />
        </Tile>
      </div>
    </section>
  )
}

/* ─────────────────────────── Find & share ─────────────────────────── */

function FindAndShare() {
  return (
    <section id="find" className="landing-container py-14 sm:py-28">
      <SectionIntro kicker="Find & share" title="Months later, it’s still one search away." text="Search everything at once, spot links that have died, share a collection, or take it all with you as a PDF." />
      <div className="mt-8 grid gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-5">
        <Tile className="lg:col-span-3">
          <TileText icon={<MagnifyingGlass size={18} weight="bold" />} title="Search everything you saved" text="Titles, URLs and descriptions across every folder. Ctrl K from anywhere, Esc to clear." />
          <SearchDemo />
        </Tile>
        <Tile className="lg:col-span-2" delay={0.08}>
          <TileText icon={<ShareNetwork size={18} weight="bold" />} title="Share a collection" text="Send a public link to any folder. Stop sharing whenever you like and the link stops working." />
          <ShareDemo />
        </Tile>
        <Tile className="lg:col-span-2" delay={0.05}>
          <TileText icon={<WarningCircle size={18} weight="bold" />} title="Dead-link check" text="See which saved pages still load and which have quietly disappeared." />
          <div className="mt-6 space-y-2 text-sm">
            {[['figma.com/blog', 'Live', '#7fbf98'], ['old-portfolio.dev', 'Gone', '#e9937d']].map(([url, label, color]) => (
              <div key={url} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--color-bg-tertiary)' }}>
                <span className="font-mono text-xs">{url}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                  <span className="relative grid h-1.5 w-1.5 place-items-center">
                    {label === 'Live' && <motion.i className="absolute h-1.5 w-1.5 rounded-full" style={{ background: color }} animate={{ scale: [1, 2.6], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} />}
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  </span>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Tile>
        <Tile className="lg:col-span-3" delay={0.1}>
          <TileText icon={<FilePdf size={18} weight="bold" />} title="Export to PDF" text="A clean, multi-page PDF of your links with clickable titles. Print it, archive it, send it." />
          <div className="mt-6 flex gap-3">
            {[0, 1].map(page => (
              <div key={page} className="h-28 w-20 rounded-md border p-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)', transform: `rotate(${page ? 4 : -3}deg)` }}>
                {[70, 90, 55, 80, 60].map((w, i) => <span key={i} className="mt-1.5 block h-1 rounded-full" style={{ width: `${w}%`, background: i === 0 ? 'var(--color-accent)' : 'var(--color-border)' }} />)}
              </div>
            ))}
          </div>
        </Tile>
      </div>
    </section>
  )
}

/* ─────────────────────────── Make it yours ─────────────────────────── */

const SHOWCASE_AVATARS: ProfileAvatarId[] = ['penguin', 'fox', 'cat', 'frog', 'owl', 'lion', 'vibegif-redpanda', 'vibegif-jellyfish']

function MakeItYours() {
  const { theme, triggerTransition } = useCircularTheme()
  const [accent, setAccentState] = useState(() => document.documentElement.getAttribute('data-accent') || 'sun')

  return (
    <section id="yours" className="landing-band">
      <div className="landing-container py-14 sm:py-28">
        <SectionIntro kicker="Make it yours" title="Try it right here. Pick a color." text="Eleven accent colors, light and dark themes, avatars that blink and wave, and soft sound effects if you like them. This page changes as you click." />
        <Reveal className="mt-7 flex flex-wrap items-center gap-2.5 sm:mt-12 sm:gap-3">
          {ACCENTS.map(item => (
            <button
              key={item.key}
              type="button"
              aria-label={`${item.label} accent`}
              aria-pressed={accent === item.key}
              onClick={() => { setAccent(item.key); setAccentState(item.key) }}
              className="h-9 w-9 rounded-full transition-transform hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
              style={{ background: item.swatch, boxShadow: accent === item.key ? '0 0 0 3px var(--color-bg-secondary), 0 0 0 5px var(--color-text-primary)' : 'none' }}
            />
          ))}
          <span className="mx-2 h-8 w-px" style={{ background: 'var(--color-border)' }} />
          <button type="button" onClick={event => triggerTransition(event)} className="flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
            {theme === 'dark' ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </Reveal>
        <Reveal className="mt-8 flex flex-wrap items-center gap-3 sm:mt-14 sm:gap-4" delay={0.1}>
          {SHOWCASE_AVATARS.map((character, i) => (
            <motion.span key={character} className="block size-16 sm:size-20" whileHover={{ y: -6, rotate: i % 2 ? 6 : -6 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
              <FluidOrbAvatar avatar={{ ...DEFAULT_AVATAR_CONFIG, character, furColor: AVATAR_DEFAULT_FUR[character] }} />
            </motion.span>
          ))}
          <span className="ml-2 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}><SpeakerHigh size={16} /> 23 avatars · sound effects optional</span>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Trust + CTA ─────────────────────────── */

function Trust() {
  const items = [
    { title: 'Yours alone', text: 'Every link and folder is tied to your account. Nobody else can see them.' },
    { title: 'Private until you share', text: 'Collections stay private by default. Share one with a link, and stop sharing anytime.' },
    { title: 'No lock-in', text: 'Export everything as a PDF whenever you want.' },
  ]
  return (
    <section className="landing-container grid gap-7 py-12 sm:grid-cols-3 sm:gap-10 sm:py-20">
      {items.map((item, i) => (
        <Reveal key={item.title} delay={i * 0.08}>
          <LockSimple size={20} weight="bold" style={{ color: 'var(--color-accent)' }} />
          <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
          <p className="mt-1 leading-7" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</p>
        </Reveal>
      ))}
    </section>
  )
}

function FinalCta({ onGetStarted }: Props) {
  return (
    <section className="landing-container pb-16 pt-4 text-center sm:pb-32 sm:pt-10">
      <Reveal>
        <h2 className="mx-auto max-w-[14ch] text-balance text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
          Make room for the next good <span className="landing-serif font-normal" style={{ color: 'var(--color-accent)' }}>idea.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[44ch] text-base leading-7 sm:mt-6 sm:text-lg sm:leading-8" style={{ color: 'var(--color-text-secondary)' }}>Start with one folder. Add the links you keep reopening. It takes less than a minute.</p>
        <div className="mt-8 flex justify-center sm:mt-10">
          <MagneticButton onClick={() => onGetStarted(true)}>Create your free account</MagneticButton>
        </div>
      </Reveal>
    </section>
  )
}

/* ─────────────────────────── Page ─────────────────────────── */

export function LandingPage({ onGetStarted }: Props) {
  const reduce = useReducedMotion()
  useLenis(!reduce)
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', value => setScrolled(value > 24))

  return (
    <div className="landing-page min-h-[100dvh]" style={{ color: 'var(--color-text-primary)' }}>
      <a href="#main" className="landing-skip">Skip to content</a>
      <header className={`fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color] duration-300 ${scrolled ? 'landing-nav-scrolled' : 'border-transparent'}`}>
        <nav className="landing-container flex h-16 items-center justify-between" aria-label="Main">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/Logo.svg" alt="" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-[-0.03em]">Bookmarky</span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: 'var(--color-text-secondary)' }}>
            {[['How it works', '#story'], ['Capture', '#capture'], ['Organize', '#organize'], ['Find & share', '#find']].map(([label, href]) => (
              <a key={href} href={href} className="transition-colors hover:text-[var(--color-text-primary)]">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onGetStarted(false)} className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-bg-tertiary)]">Sign in</button>
            <button type="button" onClick={() => onGetStarted(true)} className="hidden rounded-full px-4 py-2 text-sm font-semibold transition-transform active:scale-[0.97] sm:block" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}>Get started</button>
          </div>
        </nav>
      </header>

      <main id="main">
        <Hero onGetStarted={onGetStarted} />
        <Story />
        <WaysIn />
        <Organize />
        <Handled />
        <FindAndShare />
        <MakeItYours />
        <Trust />
        <FinalCta onGetStarted={onGetStarted} />
      </main>

      <footer className="landing-container flex flex-col gap-4 border-t py-8 text-sm sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-2"><img src="/Logo.svg" alt="" className="h-5 w-5" /> Bookmarky · Save links, remember why.</span>
        <button type="button" onClick={() => onGetStarted(false)} className="text-left font-medium hover:text-[var(--color-text-primary)] sm:text-right">Sign in</button>
      </footer>
    </div>
  )
}
