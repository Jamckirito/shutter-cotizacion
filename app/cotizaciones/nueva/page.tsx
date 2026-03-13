import CotizacionForm from '@/components/CotizacionForm'
import Link from 'next/link'

export default function NuevaCotizacionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-brand-dark shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white text-sm transition">← Dashboard</Link>
          <span className="text-white/30">/</span>
          <span className="text-white text-sm font-semibold">Nueva cotización</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <CotizacionForm mode="crear"/>
      </div>
    </div>
  )
}
