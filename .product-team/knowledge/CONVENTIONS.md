# Convencoes - FechaPro

## Codigo
- Usar TypeScript em novas rotas, componentes e helpers.
- Manter regras de dominio reutilizaveis em `lib/`.
- Preservar nomes de dominio em portugues na interface: proposta, cliente, servico, marca, aceite, plano.
- Em API Routes, validar sessao com `requireSession()` quando a rota for privada.
- Aplicar `rateLimit()` em endpoints sensiveis, especialmente auth, uploads, suporte, IA e pagamentos.
- Evitar expor segredos; ler configuracoes por variaveis de ambiente.
- Preferir Prisma para acesso ao banco.

## Frontend
- Seguir o App Router do Next.js.
- Usar componentes existentes de `app/components/` antes de criar novos padroes.
- Manter a experiencia orientada a trabalho: formularios claros, estados de carregamento, feedback de erro e textos em pt-BR.
- Evitar mudancas visuais amplas sem necessidade da feature.

## Banco
- Atualizar `prisma/schema.prisma` quando a feature precisar persistir novos dados.
- Considerar indices quando consultas filtrarem por usuario, status, slug ou datas.
- Evitar alterar enums de planos/status sem revisar fluxos de billing, admin e proposta publica.

## Testes
- Usar Vitest para helpers e regras de dominio em `lib/__tests__/`.
- Cobrir funcoes que manipulam limites, tokens, sessoes, rate limiting e regras financeiras.
- Para rotas criticas, testar pelo menos validacoes e estados de erro quando viavel.

## Git
- O repositorio pode ter alteracoes locais em andamento; nao reverter trabalho nao relacionado.
- Commits de checkpoint do Timovi devem acontecer apenas quando o modo de git permitir.

> Este arquivo sera refinado conforme o time produzir codigo.
