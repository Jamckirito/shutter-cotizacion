import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => createClientComponentClient()
export const createServerClient = () => createServerComponentClient({ cookies })

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
