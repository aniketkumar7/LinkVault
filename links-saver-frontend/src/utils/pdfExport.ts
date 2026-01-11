import { jsPDF } from 'jspdf'
import type { Link, Collection } from '@/lib/api'

interface ExportOptions {
  links: Link[]
  collections: Collection[]
  collectionId?: string
  collectionName?: string
}

// Convert logo to base64 for embedding in PDF
const LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiMyQUJCRjciLz4KPHBhdGggZD0iTTIwIDI0TDMyIDM2TDQ0IDI0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjAgMzZMMzIgNDhMNDQgMzYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='

export async function generatePDF({ links, collections, collectionId, collectionName }: ExportOptions): Promise<string> {
  const exportLinks = collectionId 
    ? links.filter(l => l.collection_id === collectionId)
    : links
  
  const title = collectionName || 'All Links'
  
  if (exportLinks.length === 0) {
    throw new Error('No links to export')
  }
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  
  // Colors
  const accent: [number, number, number] = [42, 187, 247]
  const accentDark: [number, number, number] = [28, 159, 216]
  const dark: [number, number, number] = [15, 23, 42]
  const muted: [number, number, number] = [100, 116, 139]
  const light: [number, number, number] = [241, 245, 249]
  const white: [number, number, number] = [255, 255, 255]
  
  // ============================================
  // COVER PAGE
  // ============================================
  
  // Dark background
  doc.setFillColor(...dark)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Large decorative circle top-right
  doc.setFillColor(...accent)
  doc.circle(pageWidth + 20, -20, 100, 'F')
  
  // Small decorative circle bottom-left
  doc.setFillColor(...accentDark)
  doc.circle(-20, pageHeight + 20, 80, 'F')
  
  // Accent line top
  doc.setFillColor(...accent)
  doc.rect(0, 0, pageWidth, 4, 'F')
  
  // Logo placeholder (cyan square with rounded corners simulation)
  const logoX = margin
  const logoY = 35
  const logoSize = 24
  
  // Draw logo background
  doc.setFillColor(...accent)
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 4, 4, 'F')
  
  // Draw chevrons in logo
  doc.setDrawColor(...white)
  doc.setLineWidth(1.5)
  // Top chevron
  doc.line(logoX + 6, logoY + 8, logoX + logoSize/2, logoY + 14)
  doc.line(logoX + logoSize/2, logoY + 14, logoX + logoSize - 6, logoY + 8)
  // Bottom chevron
  doc.line(logoX + 6, logoY + 13, logoX + logoSize/2, logoY + 19)
  doc.line(logoX + logoSize/2, logoY + 19, logoX + logoSize - 6, logoY + 13)
  
  // Brand name next to logo
  doc.setFontSize(28)
  doc.setTextColor(...white)
  doc.text('LinkVault', logoX + logoSize + 8, logoY + 17)
  
  // Collection/Export title
  doc.setFontSize(14)
  doc.setTextColor(...accent)
  doc.text(title.toUpperCase(), logoX, logoY + 45)
  
  // Decorative line under title
  doc.setDrawColor(...accent)
  doc.setLineWidth(3)
  doc.line(logoX, logoY + 50, logoX + 50, logoY + 50)
  
  // Stats section
  const statsY = 120
  
  // Stats container
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(margin, statsY, contentWidth, 70, 8, 8, 'F')
  
  // Inner accent border
  doc.setDrawColor(...accent)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin + 2, statsY + 2, contentWidth - 4, 66, 6, 6, 'S')
  
  const statWidth = contentWidth / 3
  const statCenterY = statsY + 35
  
  // Stat 1: Links
  doc.setFontSize(36)
  doc.setTextColor(...accent)
  doc.text(String(exportLinks.length), margin + statWidth * 0.5, statCenterY, { align: 'center' })
  doc.setFontSize(11)
  doc.setTextColor(...muted)
  doc.text('LINKS', margin + statWidth * 0.5, statCenterY + 15, { align: 'center' })
  
  // Divider
  doc.setDrawColor(51, 65, 85)
  doc.setLineWidth(0.5)
  doc.line(margin + statWidth, statsY + 15, margin + statWidth, statsY + 55)
  
  // Stat 2: Favorites
  const favCount = exportLinks.filter(l => l.is_favorite).length
  doc.setFontSize(36)
  doc.setTextColor(...accent)
  doc.text(String(favCount), margin + statWidth * 1.5, statCenterY, { align: 'center' })
  doc.setFontSize(11)
  doc.setTextColor(...muted)
  doc.text('FAVORITES', margin + statWidth * 1.5, statCenterY + 15, { align: 'center' })
  
  // Divider
  doc.line(margin + statWidth * 2, statsY + 15, margin + statWidth * 2, statsY + 55)
  
  // Stat 3: Tags
  const tagCount = new Set(exportLinks.flatMap(l => l.tags)).size
  doc.setFontSize(36)
  doc.setTextColor(...accent)
  doc.text(String(tagCount), margin + statWidth * 2.5, statCenterY, { align: 'center' })
  doc.setFontSize(11)
  doc.setTextColor(...muted)
  doc.text('TAGS', margin + statWidth * 2.5, statCenterY + 15, { align: 'center' })
  
  // Export info section
  const infoY = statsY + 90
  
  doc.setFontSize(10)
  doc.setTextColor(...muted)
  doc.text('EXPORTED ON', margin, infoY)
  
  doc.setFontSize(14)
  doc.setTextColor(...white)
  doc.text(
    new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), 
    margin, 
    infoY + 12
  )
  
  // Footer on cover
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text('Your personal link vault', margin, pageHeight - 20)
  doc.text('linkvault.app', pageWidth - margin, pageHeight - 20, { align: 'right' })
  
  // ============================================
  // LINK PAGES
  // ============================================
  doc.addPage()
  
  // White background for content pages
  doc.setFillColor(...white)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Header bar on content pages
  doc.setFillColor(...dark)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setFontSize(12)
  doc.setTextColor(...white)
  doc.text(`${title} · ${exportLinks.length} links`, margin, 16)
  
  let y = 40
  const rowHeight = 26
  
  exportLinks.forEach((link, index) => {
    if (y + rowHeight > pageHeight - 25) {
      doc.addPage()
      // Header on new page
      doc.setFillColor(...white)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      doc.setFillColor(...dark)
      doc.rect(0, 0, pageWidth, 25, 'F')
      doc.setFontSize(12)
      doc.setTextColor(...white)
      doc.text(`${title} · ${exportLinks.length} links`, margin, 16)
      y = 40
    }
    
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(...light)
      doc.roundedRect(margin - 5, y - 5, contentWidth + 10, rowHeight - 2, 3, 3, 'F')
    }
    
    // Number badge
    doc.setFillColor(...accent)
    doc.circle(margin + 6, y + 7, 6, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...white)
    doc.text(String(index + 1), margin + 6, y + 10, { align: 'center' })
    
    // Favorite star
    if (link.is_favorite) {
      doc.setFontSize(10)
      doc.setTextColor(251, 191, 36)
      doc.text('★', margin + 18, y + 9)
    }
    
    // Title
    doc.setFontSize(10)
    doc.setTextColor(...dark)
    const maxTitleLen = 55
    const titleText = (link.title || 'Untitled')
    const displayTitle = titleText.length > maxTitleLen 
      ? titleText.substring(0, maxTitleLen) + '...' 
      : titleText
    doc.text(displayTitle, margin + 28, y + 8)
    
    // URL
    doc.setFontSize(7)
    doc.setTextColor(...accent)
    const maxUrlLen = 75
    const displayUrl = link.url.length > maxUrlLen 
      ? link.url.substring(0, maxUrlLen) + '...' 
      : link.url
    doc.text(displayUrl, margin + 28, y + 16)
    
    // Tags on right side
    if (link.tags.length > 0) {
      doc.setFontSize(7)
      doc.setTextColor(...muted)
      const tagText = link.tags.slice(0, 3).map(t => `#${t}`).join('  ')
      doc.text(tagText, pageWidth - margin, y + 8, { align: 'right' })
    }
    
    // Collection badge on right
    if (link.collection_id) {
      const col = collections.find(c => c.id === link.collection_id)
      if (col && !collectionId) { // Only show if exporting all
        doc.setFontSize(6)
        doc.setTextColor(...muted)
        doc.text(`📁 ${col.name}`, pageWidth - margin, y + 16, { align: 'right' })
      }
    }
    
    y += rowHeight
  })
  
  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    if (i === 1) {
      // Cover page already has footer
      continue
    }
    
    // Footer line
    doc.setDrawColor(...light)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    
    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(...muted)
    doc.text('LinkVault Export', margin, pageHeight - 8)
    doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, pageHeight - 8, { align: 'right' })
  }
  
  // Generate filename
  const filename = collectionId 
    ? `linkvault-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
    : `linkvault-all-${new Date().toISOString().split('T')[0]}.pdf`
  
  // Save
  doc.save(filename)
  
  return filename
}

