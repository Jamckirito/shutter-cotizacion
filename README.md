# 🛡️ Shutters del Sur EPD — Sistema de Cotizaciones

App web para crear, gestionar y exportar cotizaciones en PDF.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Auth + Base de datos PostgreSQL)
- **Tailwind CSS**
- **jsPDF** (exportación PDF en el cliente)
- **Vercel** (hosting)

---

## ⚙️ Configuración paso a paso

### 1. Supabase (base de datos y login)

1. Ve a [supabase.com](https://supabase.com) → crea una cuenta gratis
2. Crea un nuevo proyecto (anota la contraseña)
3. Ve a **SQL Editor** → copia y pega el contenido de `supabase-schema.sql` → ejecuta
4. Ve a **Project Settings → API**:
   - Copia `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - Copia `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. Crea tu usuario: **Authentication → Users → Add user**
   - Escribe tu email y contraseña

### 2. Clonar y configurar localmente

```bash
# Clona el repo
git clone https://github.com/TU_USUARIO/shutter-cotizaciones.git
cd shutter-cotizaciones

# Instala dependencias
npm install

# Crea el archivo de variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Arranca en desarrollo
npm run dev
```

Abre http://localhost:3000

### 3. GitHub

```bash
# Si no tienes el repo en GitHub todavía:
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/shutter-cotizaciones.git
git push -u origin main
```

### 4. Vercel (deploy online)

1. Ve a [vercel.com](https://vercel.com) → inicia sesión con GitHub
2. Click en **"Add New Project"** → importa `shutter-cotizaciones`
3. En **Environment Variables** agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   ```
4. Click **Deploy** → en 1-2 minutos tienes la URL pública 🎉

Cada vez que hagas `git push`, Vercel redespliega automáticamente.

---

## 📱 Funcionalidades

| Función | Descripción |
|---|---|
| Login | Email + contraseña via Supabase Auth |
| Dashboard | Lista de cotizaciones con estado y búsqueda |
| Nueva cotización | Formulario completo con hasta 20 ítems |
| Editar | Modifica cualquier cotización guardada |
| Exportar PDF | Genera PDF profesional con logo y diseño de marca |
| Estados | Borrador / Enviada / Aprobada / Rechazada |
| ITBIS | Configurable 0% o 18% |
| Descuento | Campo de descuento en RD$ |

---

## 🔒 Seguridad

- Cada usuario solo ve sus propias cotizaciones (Row Level Security en Supabase)
- Las rutas están protegidas por middleware — sin sesión redirige a login

---

## 📞 Soporte

Shutters del Sur EPD · +1 849-653-3941 · info@shutterdelsur.com
