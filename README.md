# UsArchive

Espacio privado para parejas: cada persona construye, con el tiempo, un
archivo de todo lo que descubre sobre la otra.

## Estructura

```
usarchive/
├── backend/    Node.js + TypeScript + Express + Prisma (PostgreSQL)
└── frontend/   React + TypeScript + Vite + Tailwind
```

## Arquitectura y decisiones (resumen)

- **Permisos server-side reales**: cada `Profile` ("lo que sé sobre mi
  pareja") tiene un `ownerId` (quien escribe) y un `subjectMemberId` (sobre
  quién trata). Todo endpoint valida esto contra la base en
  `authorization.service.ts` — nunca confía en IDs que vengan del cliente.
- **Auth**: contraseñas con bcrypt (cost 12), JWT de acceso de vida corta
  (15 min) + refresh token rotable en cookie httpOnly, sesiones revocables
  desde el Privacy Center.
- **Confianza del dato**: cada entry tiene un `confidence` (creo /
  probablemente / confirmado / me lo contó / lo viví), para no mezclar
  suposiciones con hechos.
- **Quiz**: se genera solo a partir de entries ya confirmados — nunca
  inventa información.
- **8 universos visuales** como variables CSS (`theme.css`), no como
  paleta rosa/celeste.

## Cómo correrlo local

### Backend
```
cd backend
cp .env.example .env     # completar DATABASE_URL con tu Postgres
npm install
npm run prisma:migrate
npm run dev               # http://localhost:4000
```

### Frontend
```
cd frontend
npm install
echo "VITE_API_URL=http://localhost:4000/api" > .env
npm run dev                # http://localhost:5173
```

## Cómo publicarlo gratis (sin tocar consola, todo desde el navegador)

**1. Base de datos — Neon (gratis)**
1. Creá cuenta en neon.tech.
2. Creá un proyecto → copiá el `DATABASE_URL` que te da.

**2. Backend — Render (gratis)**
1. Subí la carpeta `backend/` a un repositorio de GitHub.
2. En render.com → "New Web Service" → conectá el repo.
3. Root directory: `backend`. Build command: `npm install && npm run build && npm run prisma:generate`. Start command: `npm start`.
4. En "Environment", pegá las variables de `.env.example` con tus valores reales (`DATABASE_URL` de Neon, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` con strings random largos, `CLIENT_ORIGIN` con la URL que te va a dar GitHub Pages).
5. Deploy. Una vez arriba, corré la migración: Render tiene una consola "Shell" en el dashboard del servicio → `npm run prisma:migrate`.

**3. Frontend — GitHub Pages (gratis)**
1. Subí la carpeta `frontend/` al mismo repo (o uno aparte).
2. En `frontend/.env.production` poné `VITE_API_URL=https://tu-backend.onrender.com/api`.
3. En GitHub → Settings → Pages → activar "GitHub Actions" como fuente, o usar `npm run build` y publicar la carpeta `dist/` con la acción `gh-pages`.
4. Listo: tu app queda en `https://tu-usuario.github.io/tu-repo`.

Puedo dejarte armado el workflow de GitHub Actions para que el paso 3 sea
automático (cada vez que subís código, se publica solo) — avisame y lo
agrego.
