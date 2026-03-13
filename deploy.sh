#!/bin/bash
# =============================================================================
# Script de deploy para hospedagem Node.js (BrasilWebHost / cPanel / DirectAdmin)
# =============================================================================
# Uso: ./deploy.sh
# 
# Este script:
#   1. Faz o build da aplicação Next.js em modo standalone
#   2. Monta a pasta 'deploy/' com a estrutura correta
#   3. A pasta 'deploy/' é o que deve ser enviado ao servidor
# =============================================================================

set -e

echo "🔨 Iniciando build..."
npm run build

echo "📦 Montando pasta de deploy..."

# Limpa pasta anterior
rm -rf deploy
mkdir -p deploy

# 1. Copia o standalone (server.js + node_modules mínimos + .next/server)
cp -r .next/standalone/* deploy/
# Copia também os dotfiles do standalone (como .env se existir)
cp -r .next/standalone/.next deploy/.next 2>/dev/null || true

# 2. Copia os assets estáticos (CSS, JS do client-side)
cp -r .next/static deploy/.next/static

# 3. Copia os arquivos públicos (imagens, favicon, etc.)
if [ -d "public" ]; then
  cp -r public deploy/public
fi

# 4. Copia o app.js (arquivo de entrada que o provedor espera)
cp app.js deploy/app.js

# 5. Copia o schema do Prisma (necessário para prisma generate/migrate)
mkdir -p deploy/prisma
cp prisma/schema.prisma deploy/prisma/schema.prisma

# 6. Copia o .env (se existir e não estiver no .gitignore)
if [ -f ".env" ]; then
  cp .env deploy/.env
  echo "⚠️  Arquivo .env copiado. Verifique se as variáveis estão corretas para produção."
fi

# Exibe o tamanho final
echo ""
echo "✅ Deploy montado com sucesso!"
echo ""
echo "📊 Tamanho da pasta deploy:"
du -sh deploy/
echo ""
echo "📁 Estrutura:"
echo "  deploy/"
echo "  ├── app.js           ← Arquivo de inicialização (configure no provedor)"
echo "  ├── server.js        ← Servidor Next.js standalone"
echo "  ├── package.json"
echo "  ├── node_modules/    ← Somente dependências de produção"
echo "  ├── .next/"
echo "  │   ├── static/      ← Assets do client-side"
echo "  │   └── server/      ← Código do servidor"
echo "  ├── public/          ← Arquivos estáticos"
echo "  ├── prisma/"
echo "  │   └── schema.prisma"
echo "  └── .env"
echo ""
echo "🚀 Próximos passos:"
echo "   1. Suba a pasta 'deploy/' para o servidor (FTP, rsync, git, etc.)"
echo "   2. No painel Node.js do provedor, configure:"
echo "      - Arquivo de inicialização: app.js"
echo "      - Versão Node.js: 20.x"
echo "   3. Reinicie a aplicação no painel"
