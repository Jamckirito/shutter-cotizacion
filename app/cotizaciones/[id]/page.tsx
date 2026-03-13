'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { exportPDF } from '@/components/PDFExport'
import type { Cotizacion } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const ESTADO_COLORS: Record<string, string> = {
  borrador:  'bg-gray-100 text-gray-600',
  enviada:   'bg-blue-100 text-blue-700',
  aprobada:  'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700'
}

export default function CotizacionDetailPage({ params }: { params: { id: string } }) {
  const [cot, setCot] = useState<Cotizacion | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: cotData } = await supabase.from('cotizaciones').select('*').eq('id', params.id).single()
      if (!cotData) { router.push('/dashboard'); return }
      const { data: items } = await supabase.from('items').select('*').eq('cotizacion_id', params.id).order('orden')
      setCot({ ...cotData, items: items ?? [] } as Cotizacion)
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Cargando...</div>
  if (!cot) return null

  const subtotal  = cot.items.reduce((s, it) => s + it.cantidad * it.precio_unit, 0)
  const itbis     = subtotal * (cot.itbis_pct ?? 0.18)
  const descuento = cot.descuento ?? 0
  const total     = subtotal + itbis - descuento
  const fmt = (n: number) => n.toLocaleString('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-brand-dark shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-white/60 hover:text-white text-sm transition">← Dashboard</Link>
            <span className="text-white/30">/</span>
            <span className="text-white text-sm font-semibold">{cot.numero}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/cotizaciones/${cot.id}/editar`}
              className="text-white/70 hover:text-white text-sm border border-white/20 rounded-lg px-3 py-1.5 transition">
              Editar
            </Link>
            <button onClick={() => exportPDF(cot)}
              className="bg-brand-gold hover:bg-opacity-90 text-white text-sm font-semibold rounded-lg px-4 py-1.5 transition flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Exportar PDF
            </button>
          </div>
        </div>
      </nav>

      {/* Preview */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Document Header */}
          <div className="bg-brand-dark px-8 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-white font-bold text-2xl">SHUTTERS DEL SUR EPD</h1>
                <p className="text-brand-gold text-sm italic mt-0.5">Tu seguridad es nuestro compromiso</p>
                <p className="text-white/50 text-xs mt-1">+1 849-653-3941  |  info@shutterdelsur.com  |  www.shutterdelsurepd.com</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${ESTADO_COLORS[cot.estado]}`}>
                  {cot.estado}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-brand-gold py-2 px-8">
            <h2 className="text-white font-bold text-center tracking-widest text-sm">COTIZACIÓN</h2>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
            {[
              ['Número', cot.numero], ['Cliente', cot.cliente],
              ['Fecha', cot.fecha],   ['Dirección', cot.direccion ?? '—'],
              ['Válido hasta', cot.valido_hasta ?? '—'], ['Teléfono', cot.telefono ?? '—'],
              ['Vendedor', cot.vendedor ?? '—'],         ['Correo', cot.correo ?? '—'],
            ].map(([label, value], i) => (
              <div key={i} className={`flex px-8 py-2.5 border-b border-gray-50 ${i % 2 === 0 ? 'bg-brand-light/40' : 'bg-white'}`}>
                <span className="text-xs font-bold text-gray-500 w-28 shrink-0">{label}:</span>
                <span className="text-sm text-gray-800">{value}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <table className="w-full text-sm border-b border-gray-100">
            <thead>
              <tr className="bg-brand-dark">
                {['#','Código','Descripción del Producto / Servicio','Cant.','Precio Unit.','Total'].map(h => (
                  <th key={h} className="text-white font-semibold text-xs px-4 py-3 text-center first:text-center last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cot.items.map((it, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                  <td className="px-4 py-2.5 text-center text-gray-500 text-xs">{i+1}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600 font-mono text-xs">{it.codigo}</td>
                  <td className="px-4 py-2.5 text-gray-800">{it.descripcion}</td>
                  <td className="px-4 py-2.5 text-center">{it.cantidad}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{fmt(it.precio_unit)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-medium">{fmt(it.cantidad * it.precio_unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals + Notes */}
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 border-r border-gray-100">
              <p className="text-xs font-bold text-gray-500 mb-2">NOTAS / TÉRMINOS</p>
              <div className="text-xs text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3">{cot.notas}</div>
            </div>
            <div className="p-8 space-y-2">
              {[['Subtotal', fmt(subtotal)], [`ITBIS (${Math.round((cot.itbis_pct ?? 0.18)*100)}%)`, fmt(itbis)], ['Descuento', `- ${fmt(descuento)}`]].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-gray-500">{l}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center bg-brand-dark rounded-xl px-4 py-3 mt-3">
                <span className="text-white font-bold">TOTAL</span>
                <span className="text-white font-bold text-lg">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 border-t border-gray-100">
            {['Firma del Cliente', 'Firma Autorizada'].map(label => (
              <div key={label} className="px-8 py-6 text-center border-r last:border-0 border-gray-100">
                <div className="border-b border-gray-300 mb-2 pb-8 mx-8"/>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
