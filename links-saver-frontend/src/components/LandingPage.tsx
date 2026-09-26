import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, MagnifyingGlass, Sparkle, Stack, UploadSimple } from '@phosphor-icons/react'
import { Folder } from './Folder'

interface Props { onGetStarted: () => void }

const steps = [
  { number: '01', title: 'Capture the moment', text: 'Paste a URL, add a thought, and keep moving. LinkVault fills in the useful details for you.' },
  { number: '02', title: 'Give it a place', text: 'Drop links into calm, colorful collections that make sense to the way you think.' },
  { number: '03', title: 'Find it when it matters', text: 'Search titles, notes, descriptions, and URLs instead of digging through old tabs.' },
]

function DemoCard({ title, domain, color, image }: { title: string; domain: string; color: string; image?: string }) {
  return <div className="landing-demo-card">
    <div className="landing-demo-image" style={{ background: image || `linear-gradient(135deg, ${color}55, var(--color-bg-tertiary))` }}>
      {!image && <span style={{ color }}>{domain.charAt(0).toUpperCase()}</span>}
    </div>
    <div className="p-3">
      <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
      <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{domain}</p>
    </div>
  </div>
}

export function LandingPage({ onGetStarted }: Props) {
  const [activeStep, setActiveStep] = useState(1)

  return <main className="landing-page min-h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
    <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <a href="#top" className="flex items-center gap-2.5">
        <img src="/Logo.svg" alt="LinkVault" className="h-9 w-9" />
        <span className="font-brand text-2xl">LinkVault</span>
      </a>
      <div className="flex items-center gap-3">
        <button onClick={onGetStarted} className="rounded-full border px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>Sign in</button>
      </div>
    </header>

    <section id="top" className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:px-10 lg:pb-32 lg:pt-20">
      <div className="relative z-10 max-w-xl">
        <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em]" style={{ color: 'var(--color-accent)' }}><Sparkle size={15} weight="fill" /> Keep the good stuff</p>
        <h1 className="max-w-[11ch] text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-7xl">Save the link. Keep the idea.</h1>
        <p className="mt-7 max-w-lg text-lg leading-8" style={{ color: 'var(--color-text-secondary)' }}>A quieter place for the articles, tools, videos, and inspiration you know you’ll want later.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <button onClick={onGetStarted} className="group flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-1" style={{ background: 'var(--color-accent)', boxShadow: '0 14px 35px -18px var(--color-accent)' }}>Start saving for free <ArrowUpRight size={18} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No credit card. No clutter.</span>
        </div>
        <div className="mt-12 flex items-center gap-6 border-t pt-5 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-2"><Check size={16} style={{ color: 'var(--color-accent)' }} /> Rich previews</span>
          <span className="flex items-center gap-2"><Check size={16} style={{ color: 'var(--color-accent)' }} /> Fast search</span>
        </div>
      </div>

      <div className="relative min-h-[430px] sm:min-h-[500px]">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--color-accent)' }} />
        <div className="landing-workspace absolute left-1/2 top-1/2 w-full max-w-[620px] -translate-x-1/2 -translate-y-1/2 rotate-[2deg] p-3 sm:p-5">
          <div className="flex items-center justify-between border-b px-2 pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2"><img src="/Logo.svg" className="h-5 w-5" alt="" /><span className="font-brand text-lg">LinkVault</span></div>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}><MagnifyingGlass size={13} /> Search your vault</div>
          </div>
          <div className="p-2 pt-5 sm:p-5">
            <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[.18em]" style={{ color: 'var(--color-accent)' }}>Your collections</p><h2 className="mt-1 text-xl font-semibold">A home for the things worth keeping</h2></div><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>12 links</span></div>
            <div className="mb-3 grid grid-cols-3 gap-2 overflow-hidden sm:gap-4">
              {[['Design', '#df8052'], ['Watch later', '#8aa97b'], ['Read slowly', '#b8a16c']].map(([name, color]) => <div key={name} className="min-w-0 text-center"><div className="landing-folder-preview"><Folder color={color} hasLinks linkCount={name === 'Design' ? 5 : 2} width={92} desktopWidth={92} /></div><p className="truncate text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{name}</p></div>)}
            </div>
            <div className="mb-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--color-border)' }}><span className="text-xs font-semibold">Recent links</span><span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>View all</span></div>
            <div className="grid grid-cols-2 gap-3"><DemoCard title="The shape of a calm interface" domain="studio.example" color="#df8052" /><DemoCard title="A practical guide to better notes" domain="read.example" color="#8aa97b" /></div>
            <div className="mt-4 flex justify-center"><span className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px]" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}><UploadSimple size={12} /> Add link <span style={{ color: 'var(--color-border)' }}>·</span> Bulk import</span></div>
          </div>
        </div>
      </div>
    </section>

    <section className="relative border-y py-24 sm:py-32" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-14 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.2em]" style={{ color: 'var(--color-accent)' }}>Four ways in</p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-5xl">Catch the idea before it disappears.</h2>
          <p className="mt-5 max-w-lg text-lg leading-8" style={{ color: 'var(--color-text-secondary)' }}>LinkVault meets you wherever the link is—from a tab you’re reading to a screenshot you just took.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-4">
          {[
            { number: '01', title: 'Add a link to a collection', text: 'Save one URL with its note and context in seconds.', icon: <ArrowUpRight size={22} />, motion: { y: [0, -4, 0], rotate: [0, 4, 0] } },
            { number: '02', title: 'Add links in bulk', text: 'Bring a whole reading list into the right collection.', icon: <UploadSimple size={22} />, motion: { y: [0, 4, 0], x: [0, 3, 0] } },
            { number: '03', title: 'Extract links from images', text: 'Turn screenshots and visual inspiration into searchable links.', icon: <Sparkle size={22} />, motion: { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] } },
            { number: '04', title: 'Extract links from PDFs and docs', text: 'Pull useful URLs out of files and notes without retyping.', icon: <Stack size={22} />, motion: { y: [0, -3, 0], rotateY: [0, 12, 0] } },
          ].map((item, index) => <motion.div key={item.number} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ delay: index * .1, duration: .55, ease: [.16, 1, .3, 1] }} className="group relative min-h-[220px] overflow-hidden rounded-[22px] border p-5 transition-colors hover:border-[var(--color-accent)]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"><svg className="h-full w-full" viewBox="0 0 400 260" preserveAspectRatio="none" fill="none"><path d="M-20 210C100 130 130 260 240 160S370 70 430 20" stroke="var(--color-accent)" strokeOpacity=".12" strokeWidth="1" strokeDasharray="5 8"><animate attributeName="stroke-dashoffset" from="0" to="-52" dur="2.5s" repeatCount="indefinite" /></path><circle cx="76" cy="172" r="3" fill="var(--color-accent)" opacity=".5"><animate attributeName="cy" values="172;150;172" dur="2s" repeatCount="indefinite" /></circle></svg></div>
            <div className="relative flex items-start justify-between"><span className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>{item.number}</span><motion.span animate={item.motion} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}>{item.icon}</motion.span></div>
            <div className="absolute -bottom-8 -right-5 h-28 w-28 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-30" style={{ background: 'var(--color-accent)' }} />
            <div className="absolute bottom-5 left-5 right-5"><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-2 max-w-[18ch] text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</p></div>
          </motion.div>)}
        </div>
      </div>
    </section>

    <section className="border-y" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-7 sm:grid-cols-3 sm:px-8 lg:px-10">
        {[['Capture', 'Paste a URL and keep the context.'], ['Organize', 'Collections, tags, and notes that stay human.'], ['Return', 'Search it when the moment comes back.']].map(([title, text]) => <div key={title} className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full" style={{ background: 'var(--color-accent)' }} /><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{text}</p></div></div>)}
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
        <div><p className="text-xs font-bold uppercase tracking-[.2em]" style={{ color: 'var(--color-accent)' }}>A better habit</p><h2 className="mt-5 max-w-sm text-4xl font-semibold leading-tight tracking-[-.04em]">Your saved links should remember why you saved them.</h2><p className="mt-5 max-w-sm leading-7" style={{ color: 'var(--color-text-secondary)' }}>LinkVault keeps the link and the thought beside it, so your future self doesn’t have to reconstruct the moment.</p></div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>{steps.map((step, index) => <button key={step.number} onClick={() => setActiveStep(index)} className="grid w-full grid-cols-[48px_1fr_24px] gap-4 py-6 text-left transition-opacity" style={{ borderColor: 'var(--color-border)', opacity: activeStep === index ? 1 : .58 }}><span className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>{step.number}</span><span><strong className="text-xl font-semibold">{step.title}</strong><span className="mt-2 block max-w-lg text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>{step.text}</span></span><ArrowUpRight size={20} className="mt-1" /></button>)}</div>
      </div>
    </section>

    <section className="mx-5 mb-8 overflow-hidden rounded-[28px] sm:mx-8 lg:mx-auto lg:max-w-7xl">
      <div className="relative px-6 py-16 sm:px-12 lg:px-20"><div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, var(--color-bg-card), color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-card)))' }} /><div className="relative max-w-xl"><Stack size={28} weight="duotone" style={{ color: 'var(--color-accent)' }} /><h2 className="mt-5 text-4xl font-semibold tracking-[-.04em]">Make room for the next good idea.</h2><p className="mt-4 max-w-md leading-7" style={{ color: 'var(--color-text-secondary)' }}>Start with one collection. Add the links you keep reopening. Let the rest become easy.</p><button onClick={onGetStarted} className="mt-8 rounded-full px-6 py-3.5 text-sm font-bold text-white" style={{ background: 'var(--color-accent)' }}>Open your vault <ArrowUpRight size={17} className="ml-2 inline" /></button></div></div>
    </section>

    <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10" style={{ color: 'var(--color-text-muted)' }}><span className="font-brand text-xl" style={{ color: 'var(--color-text-secondary)' }}>LinkVault</span><span>Save links. Remember why. Find them later.</span></footer>
  </main>
}
