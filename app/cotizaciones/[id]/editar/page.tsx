'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CotizacionForm from '@/components/CotizacionForm'
import type { Cotizacion } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function EditarPage({ params }: { params: { id: string } }) {
  const [cot, setCot] = useState<Cotizacion | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('cotizaciones').select('*').eq('id', params.id).single()
      if (!data) { router.push('/dashboard'); return }
      const { data: items } = await supabase.from('items').select('*').eq('cotizacion_id', params.id).order('orden')
      setCot({ ...data, items: items ?? [] } as Cotizacion)
    }
    load()
  }, [params.id])

  if (!cot) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-brand-dark shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/cotizaciones/${params.id}`} className="text-white/60 hover:text-white text-sm transition">← Ver cotización</Link>
          <span className="text-white/30">/</span>
          <span className="text-white text-sm font-semibold">Editar {cot.numero}</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <CotizacionForm initial={cot} mode="editar"/>
      </div>
    </div>
  )
}
