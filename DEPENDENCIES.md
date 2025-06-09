
# Dependências do Projeto

Este documento lista as principais dependências do projeto e suas finalidades.

## Dependências de Produção

### Framework e Backend
- **express**: Framework web para Node.js
- **tsx**: Runtime TypeScript para execução direta de arquivos .ts
- **passport** + **passport-local**: Autenticação local com sessões
- **express-session**: Gerenciamento de sessões
- **connect-pg-simple**: Store de sessões para PostgreSQL

### Banco de Dados
- **drizzle-orm**: ORM TypeScript-first para SQL
- **@neondatabase/serverless**: Driver para Neon PostgreSQL
- **postgres**: Cliente PostgreSQL para Node.js
- **pg**: Driver PostgreSQL nativo

### Frontend - React e UI
- **react** + **react-dom**: Biblioteca principal do React
- **@tanstack/react-query**: Gerenciamento de estado servidor
- **wouter**: Roteamento leve para React
- **@radix-ui/***: Componentes primitivos acessíveis
- **lucide-react**: Ícones
- **framer-motion**: Animações
- **react-beautiful-dnd**: Drag and drop

### Estilização
- **tailwindcss**: Framework CSS utilitário
- **class-variance-authority**: Utilitário para variantes de classe
- **tailwind-merge**: Merge inteligente de classes Tailwind
- **tailwindcss-animate**: Animações para Tailwind

### Validação e Formulários
- **zod**: Validação de esquemas TypeScript
- **react-hook-form**: Gerenciamento de formulários
- **@hookform/resolvers**: Resolvers para validação

### Utilitários
- **date-fns**: Manipulação de datas
- **multer**: Upload de arquivos
- **ws**: WebSockets
- **crypto**: Criptografia

## Dependências de Desenvolvimento

### TypeScript e Build
- **typescript**: Compilador TypeScript
- **@types/***: Definições de tipos
- **esbuild**: Bundler rápido para produção
- **vite**: Ferramenta de desenvolvimento

### Drizzle ORM
- **drizzle-kit**: CLI para migrações e gerenciamento do banco
- **drizzle-zod**: Integração Drizzle + Zod

### Tailwind CSS
- **autoprefixer**: Plugin PostCSS
- **postcss**: Processador CSS
- **@tailwindcss/typography**: Plugin de tipografia

### Vite Plugins
- **@vitejs/plugin-react**: Plugin React para Vite
- **@replit/vite-plugin-***: Plugins específicos do Replit

## Scripts Principais

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Verificar tipos TypeScript
npm run check

# Sincronizar schema do banco
npm run db:push
```

## Configuração do Ambiente

### Variáveis de Ambiente Necessárias
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `SESSION_SECRET`: Chave secreta para sessões
- `REPLIT`: Detecta ambiente Replit (automático)

### Portas
- **Desenvolvimento**: 5000
- **Produção**: Porta configurada pela plataforma

## Banco de Dados

O projeto usa **Neon PostgreSQL** como banco de dados principal com:
- **Drizzle ORM** para queries type-safe
- **Migrações automáticas** via `drizzle-kit`
- **Connection pooling** configurado
- **Retry logic** para endpoints que dormem

## Estrutura do Projeto

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Esquemas compartilhados
├── public/          # Arquivos estáticos
└── package.json     # Configuração de dependências
```

Para instalar todas as dependências:
```bash
npm install
```
