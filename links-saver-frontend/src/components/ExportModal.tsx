import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { api } from '@/lib/api'
import type { Collection, Link } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Select } from '@/components/ui/Select'

interface Props {
  collections: Collection[]
  onClose: () => void
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function alphaBlend(c: number, alpha: number, bg = 255): number {
  return Math.round(c * alpha + bg * (1 - alpha))
}

function generatePdf(links: Link[], collectionName: string, accentHex: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 16           // margin
  const CW = W - M * 2  // content width
  const [ar, ag, ab] = hexToRgb(accentHex)
  const tagBg: [number, number, number] = [alphaBlend(ar, 0.12), alphaBlend(ag, 0.12), alphaBlend(ab, 0.12)]

  let y = 0
  let pageNum = 1

  const drawHeader = () => {
    // Top accent bar
    doc.setFillColor(ar, ag, ab)
    doc.rect(0, 0, W, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text('LINKVAULT', M, 8)
    doc.setFont('helvetica', 'normal')
    doc.text(collectionName.toUpperCase(), W / 2, 8, { align: 'center' })
    doc.text(
      new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      W - M, 8, { align: 'right' }
    )
    y = 20
  }

  const drawFooter = () => {
    doc.setFillColor(248, 248, 250)
    doc.rect(0, H - 9, W, 9, 'F')
    doc.setDrawColor(220, 220, 228)
    doc.setLineWidth(0.2)
    doc.line(M, H - 9, W - M, H - 9)
    doc.setTextColor(170, 170, 185)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('LinkVault — your personal link vault', M, H - 3.5)
    doc.text(`Page ${pageNum}`, W - M, H - 3.5, { align: 'right' })
    pageNum++
  }

  drawHeader()

  // Summary card
  doc.setFillColor(alphaBlend(ar, 0.06), alphaBlend(ag, 0.06), alphaBlend(ab, 0.06))
  doc.roundedRect(M, y, CW, 14, 3, 3, 'F')
  doc.setDrawColor(ar, ag, ab)
  doc.setLineWidth(0.4)
  doc.line(M, y, M, y + 14)
  doc.setTextColor(30, 30, 45)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(collectionName, M + 5, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(120, 120, 140)
  doc.text(`${links.length} link${links.length !== 1 ? 's' : ''} exported`, M + 5, y + 11)
  y += 20

  for (const link of links) {
    const title = (link.title?.trim() || 'Untitled link')
    const desc = link.description?.trim() || ''
    const tags = (link.tags ?? []).filter(Boolean).slice(0, 6)
    const date = link.created_at
      ? new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : ''

    doc.setFontSize(10)
    const titleLines: string[] = doc.splitTextToSize(title, CW - 8)
    doc.setFontSize(8)
    const descLines: string[] = desc ? doc.splitTextToSize(desc, CW - 8).slice(0, 2) : []

    const entryH = 4 + titleLines.length * 5.2 + 5 + (descLines.length > 0 ? descLines.length * 4.5 + 3 : 0) + (tags.length > 0 ? 7 : 0) + 6

    if (y + entryH > H - 14) {
      drawFooter()
      doc.addPage()
      drawHeader()
    }

    // Accent bullet
    doc.setFillColor(ar, ag, ab)
    doc.circle(M + 2, y + 3, 1.3, 'F')

    // Title
    doc.setTextColor(18, 18, 30)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    titleLines.forEach((line: string, i: number) => doc.text(line, M + 6, y + 3.5 + i * 5.2))
    y += titleLines.length * 5.2

    // URL
    doc.setTextColor(ar, ag, ab)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    const maxUrl = CW - 8
    let urlDisplay = link.url
    while (doc.getTextWidth(urlDisplay) > maxUrl && urlDisplay.length > 10) {
      urlDisplay = urlDisplay.slice(0, -4) + '…'
    }
    doc.text(urlDisplay, M + 6, y + 4)
    y += 7

    // Description
    if (descLines.length > 0) {
      doc.setTextColor(100, 100, 118)
      doc.setFontSize(8.2)
      descLines.forEach((line: string, i: number) => doc.text(line, M + 6, y + i * 4.5))
      y += descLines.length * 4.5 + 2
    }

    // Tags + date
    if (tags.length > 0 || date) {
      let tx = M + 6
      doc.setFontSize(7)
      tags.forEach(tag => {
        const label = `#${tag}`
        const tw = doc.getTextWidth(label) + 5
        doc.setFillColor(...tagBg)
        doc.roundedRect(tx, y, tw, 5, 1.5, 1.5, 'F')
        doc.setTextColor(ar, ag, ab)
        doc.text(label, tx + 2.5, y + 3.5)
        tx += tw + 2.5
      })
      if (date) {
        doc.setTextColor(175, 175, 190)
        doc.text(date, W - M, y + 3.5, { align: 'right' })
      }
      y += 8
    }

    // Divider
    doc.setDrawColor(230, 230, 238)
    doc.setLineWidth(0.15)
    doc.line(M + 6, y, W - M, y)
    y += 5
  }

  drawFooter()

  const slug = collectionName === 'All links'
    ? 'all'
    : collectionName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  doc.save(`linkvault-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function ExportModal({ collections, onClose }: Props) {
  const [collectionId, setCollectionId] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedCol = collections.find(c => c.id === collectionId)
  const label = selectedCol?.name ?? 'All links'
  const accentHex = selectedCol?.color ?? '#2ABBF7'

  const doPdf = async () => {
    setLoading(true)
    try {
      const links = await api.getLinks(collectionId ? { collection_id: collectionId } : undefined)
      generatePdf(links, label, accentHex)
      onClose()
    } catch { toast.error('PDF export failed') }
    finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="export-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          key="export-modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xs rounded-3xl border p-5"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Export PDF</h2>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-xl text-lg leading-none"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>×</button>
          </div>

          <div className="mb-4">
            <Select
              value={collectionId}
              onChange={setCollectionId}
              options={[
                { value: '', label: 'All links' },
                ...collections.map(col => ({ value: col.id, label: col.name, color: col.color })),
              ]}
              fullWidth
            />
          </div>

          <button
            onClick={doPdf}
            disabled={loading}
            className="w-full rounded-2xl py-3 text-sm font-bold disabled:opacity-60"
            style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
          >
            {loading ? 'Generating…' : 'Export'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
