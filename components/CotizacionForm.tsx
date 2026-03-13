'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Cotizacion, Item } from '@/lib/supabase'

type Props = { initial?: Partial<Cotizacion>; mode: 'crear' | 'editar' }

const emptyItem = (): Item => ({ orden: 1, codigo: '', descripcion: '', cantidad: 1, precio_unit: 0 })

export default function CotizacionForm({ initial, mode }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [form, setForm] = useState({
    numero:      initial?.numero      ?? '',
    fecha:       initial?.fecha       ?? new Date().toISOString().slice(0, 10),
    valido_hasta:initial?.valido_hasta ?? '',
    vendedor:    initial?.vendedor    ?? '',
    cliente:     initial?.cliente     ?? '',
    direccion:   initial?.direccion   ?? '',
    telefono:    initial?.telefono    ?? '',
    correo:      initial?.correo      ?? '',
    notas:       initial?.notas       ?? '• Válido por 30 días a partir de la fecha de emisión.\n• Adelanto del 60% y el 100% al concluir el trabajo.\n• Precios en pesos dominicanos (RD$).',
    itbis_pct:   initial?.itbis_pct   ?? 0.18,
    descuento:   initial?.descuento   ?? 0,
    estado:      initial?.estado      ?? 'borrador' as const,
  })

  const [items, setItems] = useState<Item[]>(
    initial?.items?.length ? initial.items : [emptyItem(), emptyItem(), emptyItem()]
  )

  const f = (field: string, val: string | number) => setForm(prev => ({ ...prev, [field]: val }))

  const updateItem = (i: number, field: keyof Item, val: string | number) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  // Calculations
  const subtotal = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unit) || 0), 0)
  const itbis    = subtotal * form.itbis_pct
  const descuento= Number(form.descuento) || 0
  const total    = subtotal + itbis - descuento

  const fmt = (n: number) => n.toLocaleString('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sesión expirada'); setSaving(false); return }

    let cotId = initial?.id
    const cotData = { ...form, user_id: user.id, itbis_pct: Number(form.itbis_pct), descuento: Number(form.descuento) }

    if (mode === 'crear') {
      // Auto-generate number if empty
      if (!cotData.numero) {
        const { count } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        cotData.numero = `COT-${String((count ?? 0) + 1).padStart(4, '0')}`
      }
      const { data, error: e } = await supabase.from('cotizaciones').insert(cotData).select().single()
      if (e) { setError(e.message); setSaving(false); return }
      cotId = data.id
    } else {
      const { error: e } = await supabase.from('cotizaciones').update(cotData).eq('id', cotId)
      if (e) { setError(e.message); setSaving(false); return }
      await supabase.from('items').delete().eq('cotizacion_id', cotId)
    }

    // Save items
    const validItems = items.filter(it => it.descripcion.trim())
    if (validItems.length) {
      const { error: e } = await supabase.from('items').insert(
        validItems.map((it, idx) => ({ ...it, cotizacion_id: cotId, orden: idx + 1 }))
      )
      if (e) { setError(e.message); setSaving(false); return }
    }

    router.push(`/cotizaciones/${cotId}`)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* DATOS DEL DOCUMENTO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-brand-dark px-6 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h2 className="text-white font-semibold text-sm">Datos del Documento</h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="No. Cotización" value={form.numero} onChange={v => f('numero', v)} placeholder="Auto (COT-0001)"/>
          <Field label="Fecha *" type="date" value={form.fecha} onChange={v => f('fecha', v)} required/>
          <Field label="Válido hasta" type="date" value={form.valido_hasta} onChange={v => f('valido_hasta', v)}/>
          <Field label="Vendedor" value={form.vendedor} onChange={v => f('vendedor', v)} placeholder="Nombre"/>
        </div>
      </div>

      {/* DATOS DEL CLIENTE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-brand-gold px-6 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <h2 className="text-white font-semibold text-sm">Datos del Cliente</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cliente / Empresa *" value={form.cliente} onChange={v => f('cliente', v)} required placeholder="Nombre o razón social"/>
          <Field label="Dirección" value={form.direccion} onChange={v => f('direccion', v)} placeholder="Calle, ciudad"/>
          <Field label="Teléfono" value={form.telefono} onChange={v => f('telefono', v)} placeholder="+1 809-000-0000"/>
          <Field label="Correo / RNC" value={form.correo} onChange={v => f('correo', v)} placeholder="email@ejemplo.com"/>
        </div>
      </div>

      {/* PRODUCTOS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-brand-dark px-6 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <h2 className="text-white font-semibold text-sm">Productos y Servicios</h2>
        </div>

        {/* Table header */}
        <div className="px-6 pt-4 hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-2">Código</div>
          <div className="col-span-5">Descripción</div>
          <div className="col-span-1 text-center">Cant.</div>
          <div className="col-span-2 text-right">Precio Unit.</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1"></div>
        </div>

        <div className="px-6 py-2 space-y-2">
          {items.map((item, i) => {
            const total = (Number(item.cantidad) || 0) * (Number(item.precio_unit) || 0)
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-gray-50 last:border-0">
                <input value={item.codigo} onChange={e => updateItem(i, 'codigo', e.target.value)}
                  className="col-span-12 md:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                  placeholder="Código"/>
                <input value={item.descripcion} onChange={e => updateItem(i, 'descripcion', e.target.value)}
                  className="col-span-12 md:col-span-5 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                  placeholder="Descripción del producto / servicio"/>
                <input type="number" min="0" value={item.cantidad} onChange={e => updateItem(i, 'cantidad', Number(e.target.value))}
                  className="col-span-4 md:col-span-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-brand-gold focus:border-transparent"/>
                <input type="number" min="0" step="0.01" value={item.precio_unit} onChange={e => updateItem(i, 'precio_unit', Number(e.target.value))}
                  className="col-span-4 md:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-brand-gold focus:border-transparent"/>
                <div className="col-span-3 md:col-span-1 text-right text-sm font-medium text-gray-700 pr-1">
                  {total > 0 ? total.toLocaleString('es-DO', { minimumFractionDigits: 2 }) : '—'}
                </div>
                <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-gray-300 hover:text-red-400 transition flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>

        <div className="px-6 pb-4">
          <button type="button" onClick={addItem}
            className="text-brand-dark border border-dashed border-brand-dark/30 hover:border-brand-dark/60 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition mt-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Agregar ítem
          </button>
        </div>
      </div>

      {/* TOTALES + NOTAS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Notas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notas / Términos</label>
          <textarea value={form.notas} onChange={e => f('notas', e.target.value)} rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent resize-none"/>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select value={form.estado} onChange={e => f('estado', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent">
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        {/* Totales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">ITBIS</span>
              <select value={form.itbis_pct} onChange={e => f('itbis_pct', Number(e.target.value))}
                className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:ring-2 focus:ring-brand-gold focus:border-transparent">
                <option value={0}>0%</option>
                <option value={0.18}>18%</option>
              </select>
            </div>
            <span className="font-medium">{fmt(itbis)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500">Descuento (RD$)</span>
            <input type="number" min="0" step="0.01" value={form.descuento}
              onChange={e => f('descuento', Number(e.target.value))}
              className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right focus:ring-2 focus:ring-brand-gold focus:border-transparent"/>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold text-gray-800 text-base">TOTAL</span>
            <span className="font-bold text-brand-dark text-base">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm">{error}</div>}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm transition">← Cancelar</button>
        <button type="submit" disabled={saving}
          className="bg-brand-dark hover:bg-opacity-90 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition disabled:opacity-60 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {saving ? 'Guardando...' : 'Guardar cotización'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '' }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"/>
    </div>
  )
}
