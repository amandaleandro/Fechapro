#!/bin/sh
set -e

# Garante que os diretórios persistidos (volumes Docker) pertençam ao usuário da
# aplicação. Volumes nomeados criados em deploys antigos podem estar como root,
# o que impede o app de gravar/limpar a sessão do WhatsApp (Baileys) e os uploads
# — causando erros do tipo "EACCES: permission denied" ao conectar o número.
for dir in /app/uploads /app/baileys-session; do
  mkdir -p "$dir"
  chown -R nextjs:nodejs "$dir" 2>/dev/null || true
done

# Sobe a aplicação já como usuário não-root.
exec su-exec nextjs:nodejs sh -c 'node scripts/create-admin.js && node server.js'
