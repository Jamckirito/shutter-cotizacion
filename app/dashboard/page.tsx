'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Cotizacion } from '@/lib/supabase'
import Link from 'next/link'

const ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  enviada:  'bg-blue-100 text-blue-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada:'bg-red-100 text-red-700'
}

export default function DashboardPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')
      const { data } = await supabase
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false })
      setCotizaciones((data ?? []) as Cotizacion[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cotización?')) return
    await supabase.from('cotizaciones').delete().eq('id', id)
    setCotizaciones(prev => prev.filter(c => c.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-brand-dark shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">Shutters del Sur EPD</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-xs hidden sm:block">{userEmail}</span>
            <button onClick={handleLogout} className="text-white/70 hover:text-white text-xs transition">Salir</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
            <p className="text-gray-500 text-sm mt-0.5">{cotizaciones.length} cotizaciones en total</p>
          </div>
          <Link
            href="/cotizaciones/nueva"
            className="bg-brand-dark hover:bg-opacity-90 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nueva cotización
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : cotizaciones.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="text-gray-400 text-sm">No hay cotizaciones aún</p>
            <Link href="/cotizaciones/nueva" className="mt-3 inline-block text-brand-dark text-sm font-semibold hover:underline">Crear la primera</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Número</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Fecha</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Estado</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cotizaciones.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5 font-mono font-medium text-brand-dark">{c.numero}</td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{c.cliente}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{c.fecha}</td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ESTADO_COLORS[c.estado] ?? ''}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/cotizaciones/${c.id}`} className="text-brand-dark hover:underline text-xs font-semibold">Ver / PDF</Link>
                        <Link href={`/cotizaciones/${c.id}/editar`} className="text-gray-400 hover:text-gray-600 text-xs">Editar</Link>
                        <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
