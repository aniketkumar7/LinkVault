import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { api } from '@/lib/api'
import type { Collection, Link } from '@/lib/api'
import type { ProfileAvatarConfig } from '@/lib/profile'
import { toast } from '@/lib/toast'
import { Select } from '@/components/ui/Select'
import { FluidOrbAvatar } from '@/components/ui/FluidOrbAvatar'
import { renderToStaticMarkup } from 'react-dom/server'
import { Drawer } from '@/components/ui/Drawer'

interface Props {
  collections: Collection[]
  avatar: ProfileAvatarConfig
  onClose: () => void
  onBack?: () => void
}

const BRAND: [number, number, number] = [245, 203, 92]
const INK: [number, number, number] = [30, 33, 38]
const MUTED: [number, number, number] = [103, 110, 119]
const LINK_BLUE: [number, number, number] = [25, 83, 145]

function normalizeWebUrl(value: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function loadLogoPng(): Promise<string | null> {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const context = canvas.getContext('2d')
        if (!context) return resolve(null)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = new URL('/Logo.svg', window.location.origin).toString()
  })
}

function loadAvatarPng(avatar: ProfileAvatarConfig): Promise<string | null> {
  try {
    const markup = renderToStaticMarkup(<FluidOrbAvatar avatar={avatar} />)
      .replace('<svg ', '<svg width="256" height="256" ')

    return new Promise(resolve => {
      const image = new Image()
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 256
          canvas.height = 256
          const context = canvas.getContext('2d')
          if (!context) return resolve(null)
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/png'))
        } catch {
          resolve(null)
        }
      }
      image.onerror = () => resolve(null)
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
    })
  } catch {
    return Promise.resolve(null)
  }
}

function generatePdf(
  links: Link[],
  collectionName: string,
  collections: Collection[],
  logo: string | null,
  avatar: string | null,
  appUrl: string,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  const contentBottom = pageHeight - 22
  const dateLabel = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  const collectionNames = new Map(collections.map(collection => [collection.id, collection.name]))
  const appLabel = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')

  doc.setProperties({
    title: `${collectionName} · Bookmarky`,
    subject: `Exported links from ${collectionName}`,
    author: 'Bookmarky',
    creator: 'Bookmarky',
  })

  let y = 0
  let pageNumber = 1

  const drawMasthead = (firstPage: boolean) => {
    if (logo) {
      doc.addImage(logo, 'PNG', margin, 11, 9, 9, undefined, 'FAST')
    } else {
      doc.setFillColor(...BRAND)
      doc.roundedRect(margin, 11, 9, 9, 2, 2, 'F')
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.7)
      doc.line(margin + 2.1, 15.6, margin + 4.1, 13.5)
      doc.line(margin + 4.1, 13.5, margin + 6.8, 16.3)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    doc.text('Bookmarky', margin + 12, 17)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text(firstPage ? 'LINK LIBRARY' : collectionName, pageWidth - margin, 16.5, { align: 'right' })

    doc.setDrawColor(225, 228, 232)
    doc.setLineWidth(0.25)
    doc.line(margin, 25, pageWidth - margin, 25)

    if (firstPage) {
      const dotsLeft = pageWidth - margin - 43
      const dotsTop = 30
      doc.setFillColor(237, 231, 219)
      for (let x = dotsLeft; x <= pageWidth - margin; x += 4.5) {
        for (let dotY = dotsTop; dotY <= 72; dotY += 4.5) {
          doc.circle(x, dotY, 0.34, 'F')
        }
      }
      if (avatar) doc.addImage(avatar, 'PNG', pageWidth - margin - 34, 34, 29, 29, undefined, 'FAST')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(23)
      doc.setTextColor(...INK)
      const titleWidth = avatar ? contentWidth - 47 : contentWidth
      const titleLines: string[] = doc.splitTextToSize(collectionName, titleWidth).slice(0, 2)
      if (titleLines.length === 2) titleLines[1] = `${titleLines[1].slice(0, -1)}…`
      titleLines.forEach((line, index) => doc.text(line, margin, 39 + index * 10))

      const subtitleY = 39 + titleLines.length * 10 + 1
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...MUTED)
      const subtitle = `${links.length} saved link${links.length === 1 ? '' : 's'}  ·  Exported ${dateLabel}`
      const subtitleLines: string[] = doc.splitTextToSize(subtitle, titleWidth)
      const subtitleText = subtitleLines.length > 1
        ? `${subtitleLines[0].slice(0, -1)}…`
        : subtitle
      doc.text(subtitleText, margin, subtitleY)

      doc.setFillColor(...BRAND)
      doc.roundedRect(margin, subtitleY + 7, 18, 1.1, 0.55, 0.55, 'F')
      y = subtitleY + 17
    } else {
      y = 35
    }
  }

  const drawFooter = () => {
    doc.setDrawColor(225, 228, 232)
    doc.setLineWidth(0.25)
    doc.line(margin, pageHeight - 17, pageWidth - margin, pageHeight - 17)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('Saved with Bookmarky', margin, pageHeight - 10)
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.setTextColor(...LINK_BLUE)
    doc.text(appLabel, pageWidth - margin, pageHeight - 10, { align: 'right' })
    const appLabelWidth = doc.getTextWidth(appLabel)
    doc.link(pageWidth - margin - appLabelWidth, pageHeight - 14, appLabelWidth, 5, { url: appUrl })
    doc.setDrawColor(...LINK_BLUE)
    doc.setLineWidth(0.12)
    doc.line(pageWidth - margin - appLabelWidth, pageHeight - 9.55, pageWidth - margin, pageHeight - 9.55)
  }

  const startNextPage = () => {
    drawFooter()
    doc.addPage()
    pageNumber += 1
    drawMasthead(false)
  }

  const drawClickableLine = (text: string, x: number, baseline: number, href: string | null, lineHeight: number) => {
    doc.text(text, x, baseline)
    if (!href) return
    const textWidth = Math.min(doc.getTextWidth(text), contentWidth)
    doc.link(x, baseline - lineHeight + 0.8, textWidth, lineHeight, { url: href })
    doc.setDrawColor(...LINK_BLUE)
    doc.setLineWidth(0.12)
    doc.line(x, baseline + 0.45, x + textWidth, baseline + 0.45)
  }

  drawMasthead(true)

  for (const link of links) {
    const href = normalizeWebUrl(link.url)
    const title = link.title?.trim() || (() => {
      try { return new URL(href ?? link.url).hostname }
      catch { return 'Untitled link' }
    })()
    const description = link.description?.trim() ?? ''
    const tags = (link.tags ?? []).filter(Boolean).slice(0, 4)
    const groupName = collectionName === 'All links'
      ? collectionNames.get(link.collection_id ?? '') ?? 'Unsorted'
      : ''
    const savedDate = link.created_at
      ? new Date(link.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : ''

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    const titleLines: string[] = doc.splitTextToSize(title, contentWidth).slice(0, 3)
    if (doc.splitTextToSize(title, contentWidth).length > 3) titleLines[2] = `${titleLines[2].slice(0, -1)}…`

    const displayUrl = href ?? link.url
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const urlLines: string[] = doc.splitTextToSize(displayUrl, contentWidth)
    if (urlLines.length > 3) {
      urlLines.length = 3
      urlLines[2] = `${urlLines[2].slice(0, -1)}…`
    }

    const allDescriptionLines: string[] = description ? doc.splitTextToSize(description, contentWidth) : []
    const descriptionLines = allDescriptionLines.slice(0, 3)
    if (allDescriptionLines.length > 3 && descriptionLines.length) {
      const last = descriptionLines.length - 1
      descriptionLines[last] = `${descriptionLines[last].slice(0, -1)}…`
    }

    const metadataHeight = tags.length || groupName || savedDate ? 6 : 0
    const entryHeight = titleLines.length * 5.8 + urlLines.length * 4.8 + descriptionLines.length * 4.7 + metadataHeight + 13
    if (y + entryHeight > contentBottom) startNextPage()

    const titleY = y + 4.2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...INK)
    titleLines.forEach((line, index) => drawClickableLine(line, margin, titleY + index * 5.8, href, 5.4))

    const urlY = titleY + titleLines.length * 5.8 + 0.7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...LINK_BLUE)
    urlLines.forEach((line, index) => drawClickableLine(line, margin, urlY + index * 4.8, href, 4.5))

    let nextY = urlY + urlLines.length * 4.8 + 1.2
    if (descriptionLines.length) {
      doc.setFontSize(9)
      doc.setTextColor(74, 80, 88)
      descriptionLines.forEach((line, index) => doc.text(line, margin, nextY + index * 4.7))
      nextY += descriptionLines.length * 4.7 + 1.4
    }

    if (tags.length || groupName || savedDate) {
      doc.setFontSize(7.7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...MUTED)
      const metadata = [groupName, ...tags.map(tag => `#${tag}`)].filter(Boolean).join('   ·   ')
      if (metadata) doc.text(doc.splitTextToSize(metadata, contentWidth - 27)[0] ?? '', margin, nextY + 3.5)
      if (savedDate) doc.text(savedDate, pageWidth - margin, nextY + 3.5, { align: 'right' })
      nextY += 6
    }

    doc.setDrawColor(230, 232, 235)
    doc.setLineWidth(0.2)
    doc.line(margin, nextY + 1, pageWidth - margin, nextY + 1)
    y = nextY + 5
  }

  drawFooter()
  const slug = collectionName === 'All links'
    ? 'all'
    : collectionName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      doc.save(`bookmarky-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function ExportModal({ collections, avatar, onClose, onBack }: Props) {
  const [collectionId, setCollectionId] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedCol = collections.find(collection => collection.id === collectionId)
  const label = selectedCol?.name ?? 'All links'

  const doPdf = async () => {
    setLoading(true)
    try {
      const links = await api.getLinks(collectionId ? { collection_id: collectionId } : undefined)
      const logo = await loadLogoPng()
      const avatarPng = await loadAvatarPng(avatar)
      generatePdf(links, label, collections, logo, avatarPng, window.location.origin)
      onClose()
    } catch {
      toast.error('PDF export failed')
    } finally {
      setLoading(false)
    }
  }

  return <Drawer open onClose={onClose} onBack={onBack} title="Export PDF">
          <div className="space-y-4">
          <div>
            <Select
              value={collectionId}
              onChange={setCollectionId}
              options={[
                { value: '', label: 'All links' },
                ...collections.map(collection => ({ value: collection.id, label: collection.name, color: collection.color })),
              ]}
              fullWidth
            />
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Branded, multi-page PDF with clickable link titles and URLs.
          </p>

          <button
            onClick={doPdf}
            disabled={loading}
            className="w-full rounded-2xl py-3 text-sm font-bold disabled:opacity-60"
            style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}
          >
            {loading ? 'Generating…' : 'Export PDF'}
          </button>
          </div>
        </Drawer>
}
