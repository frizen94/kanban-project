
# Sistema Kanban - Projeto Completo

Sistema completo de gerenciamento de tarefas estilo Kanban desenvolvido com React, TypeScript e Node.js.

## 🚀 Funcionalidades

### Quadros e Organização
- ✅ Quadros Kanban personalizáveis
- ✅ Listas (colunas) organizáveis por drag-and-drop
- ✅ Cartões com descrições detalhadas
- ✅ Datas de vencimento com alertas visuais
- ✅ Sistema de etiquetas coloridas
- ✅ Checklists com progresso visual

### Sistema de Usuários
- ✅ Autenticação segura com Passport.js
- ✅ Controle de acesso baseado em funções (admin/user)
- ✅ Upload de fotos de perfil
- ✅ Gerenciamento de membros por quadro
- ✅ Convites e permissões granulares

### Dashboard e Métricas
- ✅ Dashboard personalizado por usuário
- ✅ Dashboard administrativo com estatísticas globais
- ✅ Acompanhamento de tarefas atrasadas
- ✅ Progresso de checklists
- ✅ Métricas de conclusão

### Colaboração
- ✅ Sistema de comentários em cartões
- ✅ Atribuição de membros a cartões
- ✅ Notificações visuais de prazo
- ✅ Histórico de atividades

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Tanstack Query** - Gerenciamento de estado servidor
- **Wouter** - Roteamento leve

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem no backend
- **Passport.js** - Autenticação
- **Multer** - Upload de arquivos
- **Express Session** - Gerenciamento de sessões

### Banco de Dados
- **PostgreSQL** - Banco principal
- **Drizzle ORM** - Object-Relational Mapping
- **Migrations** - Controle de versão do schema

### Deploy e Infraestrutura
- **Replit** - Plataforma de desenvolvimento e deploy
- **Vite** - Build tool e dev server
- **ESBuild** - Transpilação rápida

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/frizen94/kanban-project.git

# Entre no diretório
cd kanban-project

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# DATABASE_URL será configurada automaticamente no Replit

# Execute em modo desenvolvimento
npm run dev
```

## 🎯 Como usar

### Primeiros Passos
1. **Crie uma conta** - O primeiro usuário será automaticamente admin
2. **Faça login** - Use suas credenciais
3. **Crie um quadro** - Clique em "Novo Quadro"
4. **Adicione listas** - Crie colunas como "A fazer", "Em andamento", "Concluído"
5. **Crie cartões** - Adicione tarefas nas listas

### Funcionalidades Avançadas
- **Convide membros** - Compartilhe quadros com sua equipe
- **Use etiquetas** - Organize por prioridade ou categoria
- **Defina prazos** - Acompanhe deadlines importantes
- **Crie checklists** - Divida tarefas em subtarefas
- **Comente** - Colabore através de comentários

### Para Administradores
- **Gerencie usuários** - Acesse o painel administrativo
- **Veja estatísticas** - Monitore uso do sistema
- **Controle permissões** - Defina quem pode fazer o quê

## 🏗️ Arquitetura

```
kanban-project/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Hooks customizados
│   │   └── lib/           # Utilitários e contextos
├── server/                # Backend Node.js
│   ├── routes.ts          # Definição das rotas API
│   ├── auth.ts           # Sistema de autenticação
│   ├── database.ts       # Conexão com banco
│   └── storage.ts        # Camada de dados
├── shared/               # Código compartilhado
│   └── schema.ts        # Schemas do banco
└── public/              # Arquivos estáticos
```

## 🔧 API Endpoints

### Autenticação
- `POST /api/login` - Login
- `POST /api/logout` - Logout  
- `POST /api/register` - Registro
- `GET /api/user` - Dados do usuário

### Quadros
- `GET /api/boards` - Listar quadros
- `POST /api/boards` - Criar quadro
- `GET /api/boards/:id` - Detalhes do quadro
- `PATCH /api/boards/:id` - Atualizar quadro
- `DELETE /api/boards/:id` - Excluir quadro

### Listas e Cartões
- `GET /api/boards/:id/lists` - Listas do quadro
- `POST /api/lists` - Criar lista
- `GET /api/lists/:id/cards` - Cartões da lista
- `POST /api/cards` - Criar cartão

### Checklists
- `GET /api/cards/:id/checklists` - Checklists do cartão
- `POST /api/checklists` - Criar checklist
- `POST /api/checklist-items` - Criar item

## 🚀 Deploy

Este projeto está otimizado para deploy no **Replit**:

1. Fork este projeto no Replit
2. As dependências são instaladas automaticamente
3. O banco PostgreSQL é configurado automaticamente
4. A aplicação roda na porta 5000
5. Deploy automático com cada commit

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação

---

**Desenvolvido com ❤️ para gerenciamento eficiente de projetos**
