-- Run this in Supabase SQL Editor

create table cotizaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  numero text not null,
  fecha date not null default current_date,
  valido_hasta date,
  vendedor text,
  cliente text not null,
  direccion text,
  telefono text,
  correo text,
  notas text default '• Válido por 30 días a partir de la fecha de emisión.
• Adelanto del 60% y el 100% al concluir el trabajo.
• Precios en pesos dominicanos (RD$).',
  itbis_pct numeric default 0.18,
  descuento numeric default 0,
  estado text default 'borrador' check (estado in ('borrador','enviada','aprobada','rechazada')),
  created_at timestamptz default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid references cotizaciones(id) on delete cascade not null,
  orden int not null default 1,
  codigo text,
  descripcion text not null,
  cantidad numeric not null default 1,
  precio_unit numeric not null default 0
);

-- Row Level Security
alter table cotizaciones enable row level security;
alter table items enable row level security;

create policy "Users manage own cotizaciones"
  on cotizaciones for all using (auth.uid() = user_id);

create policy "Users manage own items"
  on items for all using (
    cotizacion_id in (select id from cotizaciones where user_id = auth.uid())
  );

-- Auto-increment numero per user (helper function)
create or replace function next_cot_number(uid uuid)
returns text language plpgsql as $$
declare
  n int;
begin
  select count(*) + 1 into n from cotizaciones where user_id = uid;
  return 'COT-' || lpad(n::text, 4, '0');
end;
$$;
