#!/bin/sh
set -e

echo "→ Ejecutando migraciones de Prisma..."
prisma migrate deploy

echo "→ Ejecutando seed (si no hay admin existente)..."
npx tsx /app/prisma/seed.ts

echo "→ Iniciando servidor Next.js..."
exec node server.js
