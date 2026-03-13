import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export type Cotizacion = {
  id: string
  numero: string
  fecha: string
  valido_hasta: string
  vendedor: string
  cliente: string
  direccion: string
  telefono: string
  correo: string
  notas: string
  itbis_pct: number
  descuento: number
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
  created_at: string
  user_id: string
  items: Item[]
}

export type Item = {
  id?: string
  cotizacion_id?: string
  orden: number
  codigo: string
  descripcion: string
  cantidad: number
  precio_unit: number
}
