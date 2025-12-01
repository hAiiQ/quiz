#!/usr/bin/env sh
set -euo pipefail

printf "\n▶︎ Installing dependencies...\n"
npm install

printf "\n▶︎ Generating Prisma Client...\n"
npx prisma generate

printf "\n▶︎ Applying database migrations...\n"
npx prisma migrate deploy

printf "\n▶︎ Seeding baseline data...\n"
npm run prisma:seed || printf "ℹ️  Seed step failed (likely already seeded). Continuing...\n"

printf "\n▶︎ Building Next.js app...\n"
npm run build

printf "\n✅ Render build script finished.\n"
