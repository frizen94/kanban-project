
# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-31

### 🎉 Lançamento Inicial

#### Adicionado
- Sistema completo de autenticação com Passport.js
- Gestão de usuários com papéis (admin/user)
- Sistema de quadros Kanban com permissões
- Criação e organização de listas (colunas)
- Cartões com título, descrição e prazos
- Sistema de etiquetas coloridas
- Comentários em cartões
- Checklists avançadas com:
  - Itens marcáveis
  - Atribuição a usuários
  - Prazos individuais
  - Acompanhamento de progresso
- Sistema de membros para quadros e cartões
- Dashboard com estatísticas e gráficos
- Upload de fotos de perfil
- Interface responsiva com Tailwind CSS
- Componentes UI baseados em Radix UI

#### Funcionalidades Principais
- **Autenticação**: Login, registro e gerenciamento de sessões
- **Quadros**: Criação, edição, exclusão e compartilhamento
- **Listas**: Organização de cartões em colunas customizáveis
- **Cartões**: Tarefas com descrições, prazos e responsáveis
- **Colaboração**: Sistema de convites e permissões granulares
- **Dashboard**: Métricas de produtividade e visualizações
- **Checklists**: Subdivisão de tarefas em itens verificáveis

#### Tecnologias Implementadas
- Frontend: React 18, TypeScript, Tailwind CSS, React Query
- Backend: Node.js, Express.js, TypeScript, Drizzle ORM
- Banco de dados: PostgreSQL com Neon
- Autenticação: Passport.js com estratégia local
- Upload: Multer para arquivos de imagem
- Validação: Zod para validação de dados
- UI: Radix UI para componentes acessíveis
- Gráficos: Recharts para visualizações

#### Segurança
- Hash de senhas com bcrypt
- Sessões seguras com express-session
- Validação de entrada com Zod
- Controle de acesso baseado em papéis (RBAC)
- Upload seguro de arquivos com validação de tipo
- Sanitização de dados de entrada

#### Performance
- Lazy loading de componentes
- Cache de queries com React Query
- Otimização de imagens
- Bundle splitting automático
- Compressão de assets em produção

## [0.9.0] - 2024-01-28

### Adicionado
- Sistema de checklists com itens atribuíveis
- Dashboard do usuário com métricas pessoais
- Gráficos de produtividade no dashboard admin
- Sistema de notificação de prazos vencidos
- Filtros avançados no dashboard

### Modificado
- Melhorias na interface do dashboard
- Otimização das consultas de banco de dados
- Reorganização dos componentes UI

### Corrigido
- Problemas de performance em quadros grandes
- Bugs na atribuição de membros
- Correções de validação de formulários

## [0.8.0] - 2024-01-25

### Adicionado
- Sistema de membros para quadros
- Permissões granulares (owner, editor, viewer)
- Convites para colaboração
- Gerenciamento de usuários para administradores

### Modificado
- Refatoração do sistema de autenticação
- Melhoria na estrutura de rotas da API
- Atualização dos middlewares de segurança

## [0.7.0] - 2024-01-22

### Adicionado
- Upload e gerenciamento de fotos de perfil
- Configurações de conta do usuário
- Validação avançada de formulários
- Sistema de toasts para feedback

### Modificado
- Interface das configurações de usuário
- Melhorias na responsividade mobile
- Otimização do sistema de upload

### Corrigido
- Problemas de validação de email
- Bugs na atualização de perfil
- Correções de acessibilidade

## [0.6.0] - 2024-01-19

### Adicionado
- Sistema de comentários em cartões
- Histórico de atividades
- Busca e filtros avançados
- Exportação de dados

### Modificado
- Reorganização da estrutura de componentes
- Melhorias na performance das consultas
- Atualização da documentação da API

## [0.5.0] - 2024-01-16

### Adicionado
- Sistema de etiquetas coloridas
- Filtros por etiquetas
- Drag and drop para reorganização
- Prazos e alertas de vencimento

### Modificado
- Interface dos cartões aprimorada
- Melhor organização visual das listas
- Otimização do sistema de arrastrar e soltar

### Corrigido
- Bugs na reordenação de itens
- Problemas de sincronização
- Correções de CSS em diferentes navegadores

## [0.4.0] - 2024-01-13

### Adicionado
- Sistema de listas (colunas) personalizáveis
- Reordenação de listas e cartões
- Validação completa de dados
- Middleware de autorização

### Modificado
- Estrutura do banco de dados otimizada
- API REST mais robusta
- Melhorias na tipagem TypeScript

## [0.3.0] - 2024-01-10

### Adicionado
- Sistema básico de cartões
- CRUD completo para cartões
- Interface de criação de cartões
- Validação de formulários

### Modificado
- Melhorias na arquitetura do frontend
- Refatoração dos hooks customizados
- Atualização das dependências

### Corrigido
- Problemas de estado no React Query
- Bugs na navegação entre páginas
- Correções de layout responsivo

## [0.2.0] - 2024-01-07

### Adicionado
- Sistema de quadros (boards)
- Interface para criação de quadros
- Dashboard básico
- Sistema de navegação

### Modificado
- Estrutura de roteamento aprimorada
- Componentes UI padronizados
- Melhorias na experiência do usuário

## [0.1.0] - 2024-01-04

### Adicionado
- Configuração inicial do projeto
- Sistema de autenticação básico
- Estrutura do banco de dados
- Setup do frontend e backend
- Configuração do Drizzle ORM
- Implementação do Tailwind CSS
- Componentes base do Radix UI

### Tecnologias Configuradas
- React com TypeScript
- Express.js com TypeScript
- PostgreSQL com Drizzle ORM
- Tailwind CSS para estilização
- Vite para build e desenvolvimento
- ESLint e Prettier para qualidade de código

---

## Tipos de Mudanças

- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Descontinuado** para funcionalidades que serão removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correção de bugs
- **Segurança** para vulnerabilidades corrigidas

## Links

- [Unreleased]: Comparação com a versão atual
- [1.0.0]: Release principal com todas as funcionalidades
