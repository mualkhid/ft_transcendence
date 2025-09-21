#!/bin/sh
set -e

echo "🔄 Running Prisma generate..."
npx prisma generate

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "🚀 prisma migrate deploy (applying committed migrations)"
  npx prisma migrate deploy
else
  echo "⚠️  No migrations found. Bootstrapping schema with 'prisma db push' (SQLite only)."
  echo "    (Consider creating and committing an initial migration later: 'prisma migrate dev --name init')"
  npx prisma db push
fi

echo "✅ Starting application..."
exec node server.js
