'use client'
import type { Cotizacion } from '@/lib/supabase'

export function exportPDF(cot: Cotizacion) {
  // Dynamic import to avoid SSR issues
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, M = 14

      // ── Colors ──
      const DARK  = [27, 58, 92]   as [number,number,number]
      const GOLD  = [201,168,76]   as [number,number,number]
      const LGRAY = [245,245,245]  as [number,number,number]
      const MGRAY = [221,221,221]  as [number,number,number]
      const WHITE = [255,255,255]  as [number,number,number]
      const BLACK = [26,26,26]     as [number,number,number]

      // ── Header ──
      doc.setFillColor(...DARK)
      doc.rect(0, 0, W, 32, 'F')

      // Company name
      doc.setFont('helvetica','bold')
      doc.setFontSize(16)
      doc.setTextColor(...WHITE)
      doc.text('SHUTTERS DEL SUR  EPD', M, 13)

      // Slogan
      doc.setFont('helvetica','italic')
      doc.setFontSize(9)
      doc.setTextColor(...GOLD)
      doc.text('Tu seguridad es nuestro compromiso', M, 20)

      // Contact
      doc.setFont('helvetica','normal')
      doc.setFontSize(7.5)
      doc.setTextColor(180,180,180)
      doc.text('+1 849-653-3941  |  info@shutterdelsur.com  |  www.shutterdelsurepd.com', M, 26)

      // ── Title band ──
      doc.setFillColor(...GOLD)
      doc.rect(0, 32, W, 9, 'F')
      doc.setFont('helvetica','bold')
      doc.setFontSize(11)
      doc.setTextColor(...WHITE)
      doc.text('COTIZACIÓN', W/2, 38.5, { align:'center' })

      // ── Info grid ──
      let y = 47
      const col1 = M, col2 = 75, col3 = 115, col4 = 155

      const infoRows = [
        ['Número:', cot.numero,       'Cliente:',  cot.cliente],
        ['Fecha:',  cot.fecha,        'Dirección:',cot.direccion ?? ''],
        ['Válido hasta:', cot.valido_hasta ?? '', 'Teléfono:', cot.telefono ?? ''],
        ['Vendedor:', cot.vendedor ?? '', 'Correo:', cot.correo ?? ''],
      ]

      infoRows.forEach((row, i) => {
        const bg = i % 2 === 0 ? LGRAY : WHITE
        doc.setFillColor(...bg)
        doc.rect(M, y, 182, 7, 'F')

        doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...BLACK)
        doc.text(row[0], col1 + 1, y + 4.8)
        doc.setFont('helvetica','normal')
        doc.text(row[1].slice(0, 28), col2, y + 4.8)

        doc.setFont('helvetica','bold')
        doc.text(row[2], col3 + 1, y + 4.8)
        doc.setFont('helvetica','normal')
        doc.text(row[3].slice(0, 24), col4, y + 4.8)
        y += 7
      })

      // ── Items table ──
      y += 4
      const items = cot.items ?? []
      const tableData = items
        .filter(it => it.descripcion?.trim())
        .map((it, i) => [
          i + 1,
          it.codigo ?? '',
          it.descripcion,
          it.cantidad,
          `RD$ ${Number(it.precio_unit).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
          `RD$ ${(it.cantidad * it.precio_unit).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
        ])

      ;(doc as any).autoTable({
        startY: y,
        head: [['#', 'Código', 'Descripción', 'Cant.', 'Precio Unit.', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 9, halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 22 },
          2: { cellWidth: 82 },
          3: { halign: 'center', cellWidth: 14 },
          4: { halign: 'right', cellWidth: 28 },
          5: { halign: 'right', cellWidth: 26 },
        },
        alternateRowStyles: { fillColor: LGRAY },
        bodyStyles: { fontSize: 8.5, textColor: BLACK },
        margin: { left: M, right: M },
      })

      y = (doc as any).lastAutoTable.finalY + 4

      // ── Totals ──
      const subtotal  = items.reduce((s, it) => s + (it.cantidad || 0) * (it.precio_unit || 0), 0)
      const itbis     = subtotal * (cot.itbis_pct ?? 0.18)
      const descuento = cot.descuento ?? 0
      const total     = subtotal + itbis - descuento

      const totRows = [
        ['Subtotal',     subtotal],
        [`ITBIS (${Math.round((cot.itbis_pct ?? 0.18) * 100)}%)`, itbis],
        ['Descuento',   -descuento],
      ]

      totRows.forEach(([lbl, val]) => {
        doc.setFillColor(...LGRAY)
        doc.rect(130, y, 66, 7, 'F')
        doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...BLACK)
        doc.text(String(lbl), 132, y + 4.8)
        doc.setFont('helvetica','normal')
        const valStr = `RD$ ${Number(val).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
        doc.text(valStr, 195, y + 4.8, { align: 'right' })
        y += 7
      })

      // Total row
      doc.setFillColor(...DARK)
      doc.rect(130, y, 66, 9, 'F')
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...WHITE)
      doc.text('TOTAL', 132, y + 6.3)
      const totalStr = `RD$ ${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
      doc.text(totalStr, 195, y + 6.3, { align: 'right' })
      y += 14

      // ── Notes ──
      if (cot.notas) {
        doc.setFillColor(...GOLD)
        doc.rect(M, y, 182, 7, 'F')
        doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...WHITE)
        doc.text('NOTAS / TÉRMINOS', M + 1, y + 4.8)
        y += 7

        doc.setFillColor(...LGRAY)
        const lines = cot.notas.split('\n').filter(Boolean)
        const noteH = lines.length * 5.5 + 4
        doc.rect(M, y, 182, noteH, 'F')
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...BLACK)
        lines.forEach((line, i) => { doc.text(line, M + 2, y + 5 + i * 5.5) })
        y += noteH + 6
      }

      // ── Signatures ──
      if (y > 240) { doc.addPage(); y = 20 }
      doc.setDrawColor(...MGRAY)
      doc.line(M,      y + 12, 90,      y + 12)
      doc.line(115,    y + 12, 195,     y + 12)
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(150,150,150)
      doc.text('Firma del Cliente',  50, y + 16, { align: 'center' })
      doc.text('Firma Autorizada',   155, y + 16, { align: 'center' })

      doc.save(`${cot.numero ?? 'cotizacion'}_${cot.cliente.replace(/\s+/g,'-')}.pdf`)
    })
  })
}
