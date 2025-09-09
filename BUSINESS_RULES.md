
# Regras de Negócio - Sistema Kanban

Este documento define as regras de negócio, validações e comportamentos do Sistema Kanban.

## 📋 Índice

1. [Gestão de Usuários](#gestão-de-usuários)
2. [Sistema de Autenticação](#sistema-de-autenticação)
3. [Quadros (Boards)](#quadros-boards)
4. [Listas (Colunas)](#listas-colunas)
5. [Cartões (Cards)](#cartões-cards)
6. [Sistema de Membros](#sistema-de-membros)
7. [Etiquetas (Labels)](#etiquetas-labels)
8. [Comentários](#comentários)
9. [Checklists](#checklists)
10. [Dashboard e Relatórios](#dashboard-e-relatórios)
11. [Upload de Arquivos](#upload-de-arquivos)
12. [Segurança e Permissões](#segurança-e-permissões)

---

## 👥 Gestão de Usuários

### RN001 - Criação de Usuários
- **Nome de usuário** deve ser único no sistema
- **Email** deve ser único no sistema
- **Senha** deve ter no mínimo 6 caracteres
- **Nome completo** é obrigatório
- **Papel padrão** é "user" (usuário comum)
- **Data de criação** é definida automaticamente

### RN002 - Papéis de Usuário
- **Admin**: Acesso total ao sistema, pode gerenciar todos os usuários e quadros
- **User**: Acesso limitado aos próprios quadros e aqueles para os quais foi convidado

### RN003 - Primeiro Usuário
- O primeiro usuário registrado no sistema automaticamente recebe papel de "admin"
- Isso garante que sempre haja pelo menos um administrador

### RN004 - Validações de Dados
- Username: deve ser único, não pode ser vazio
- Email: deve ser único, formato válido de email
- Senha: mínimo 6 caracteres, armazenada com hash bcrypt
- Nome: não pode ser vazio

---

## 🔐 Sistema de Autenticação

### RN005 - Login
- Autenticação baseada em username/password
- Utiliza sessões seguras armazenadas no PostgreSQL
- Sessão expira após período de inatividade
- Máximo de tentativas de login não implementado (recomendação futura)

### RN006 - Registro
- Novos usuários podem se registrar livremente
- Validação de dados obrigatória antes da criação
- Hash da senha gerado automaticamente
- Primeiro usuário recebe papel de admin

### RN007 - Alteração de Senha
- Usuário pode alterar própria senha fornecendo a atual
- Admin pode alterar senha de qualquer usuário sem senha atual
- Nova senha deve ter mínimo 6 caracteres
- Hash gerado automaticamente

---

## 📋 Quadros (Boards)

### RN008 - Criação de Quadros
- Apenas usuários autenticados podem criar quadros
- Título é obrigatório
- Criador automaticamente se torna "owner" do quadro
- Data de criação definida automaticamente

### RN009 - Acesso a Quadros
- **Criador** tem acesso total (papel "owner")
- **Administradores** podem acessar qualquer quadro
- **Usuários convidados** acessam conforme permissão concedida
- **Usuários não autenticados** não têm acesso

### RN010 - Exclusão de Quadros
- Apenas o criador ou administradores podem excluir
- Exclusão remove todas as listas, cartões e dados relacionados
- Ação irreversível (sem soft delete)

### RN011 - Listagem de Quadros
- Admin vê todos os quadros do sistema
- Usuário comum vê apenas quadros próprios e aqueles para os quais foi convidado
- Busca otimizada com joins para evitar múltiplas consultas

---

## 📝 Listas (Colunas)

### RN012 - Estrutura de Listas
- Cada lista pertence a exatamente um quadro
- Título é obrigatório
- Ordem definida por campo numérico (reordenação)
- Data de criação automática

### RN013 - Ordenação de Listas
- Nova lista recebe ordem = maior ordem existente + 1
- Reordenação altera campo "order" das listas afetadas
- Ordem mantém integridade visual do quadro

### RN014 - Exclusão de Listas
- Remove todos os cartões contidos na lista
- Ação irreversível
- Apenas usuários com permissão no quadro podem excluir

---

## 🎫 Cartões (Cards)

### RN015 - Estrutura de Cartões
- Cada cartão pertence a exatamente uma lista
- Título é obrigatório
- Descrição é opcional
- Data de vencimento é opcional
- Ordem dentro da lista é controlada

### RN016 - Movimentação de Cartões
- Cartão pode ser movido entre listas do mesmo quadro
- Ordem é recalculada ao mover
- Histórico de movimentação não é mantido

### RN017 - Datas de Vencimento
- Data opcional para cada cartão
- Cartões vencidos aparecem em relatórios específicos
- Formato ISO 8601 para consistência

### RN018 - Exclusão de Cartões
- Remove todos os comentários, membros, etiquetas e checklists
- Ação irreversível
- Apenas usuários com permissão podem excluir

---

## 👥 Sistema de Membros

### RN019 - Membros de Quadro
- **Owner**: Criador ou promovido, controle total
- **Editor**: Pode modificar cartões, listas e comentar
- **Viewer**: Apenas visualização, sem edição

### RN020 - Convites para Quadros
- Apenas owner ou admin podem convidar membros
- Usuário deve existir no sistema para ser convidado
- Não há sistema de convite por email (usuário deve estar cadastrado)

### RN021 - Membros de Cartões
- Usuários podem ser atribuídos a cartões específicos
- Apenas membros do quadro podem ser atribuídos
- Um cartão pode ter múltiplos membros
- Membro pode ser removido do cartão

### RN022 - Herança de Permissões
- Membro do quadro automaticamente pode ver todos os cartões
- Permissões específicas de cartão são adicionais
- Admin sempre tem acesso total

---

## 🏷️ Etiquetas (Labels)

### RN023 - Estrutura de Etiquetas
- Cada etiqueta pertence a um quadro específico
- Nome e cor são obrigatórios
- Cores padrão: vermelho, laranja, amarelo, verde, azul, roxo
- Reutilizáveis dentro do mesmo quadro

### RN024 - Aplicação em Cartões
- Um cartão pode ter múltiplas etiquetas
- Uma etiqueta pode ser aplicada a múltiplos cartões
- Relação many-to-many através de tabela intermediária

### RN025 - Exclusão de Etiquetas
- Remove associações com todos os cartões
- Ação irreversível
- Apenas usuários com permissão no quadro podem excluir

---

## 💬 Comentários

### RN026 - Estrutura de Comentários
- Cada comentário pertence a um cartão específico
- Conteúdo é obrigatório
- Autor identificado por userId e userName
- Data de criação automática

### RN027 - Autoria de Comentários
- Apenas usuários autenticados podem comentar
- Nome do usuário armazenado para exibição rápida
- Comentários órfãos (usuário excluído) mantêm userName

### RN028 - Exclusão de Comentários
- Apenas autor ou admin podem excluir próprios comentários
- Ação irreversível
- Histórico de comentários não é mantido

---

## ✅ Checklists

### RN029 - Estrutura de Checklists
- Cada checklist pertence a um cartão específico
- Título é obrigatório
- Ordem controlada dentro do cartão
- Um cartão pode ter múltiplas checklists

### RN030 - Itens de Checklist
- Cada item pertence a uma checklist específica
- Conteúdo é obrigatório
- Status de conclusão (booleano)
- Pode ser atribuído a usuário específico
- Pode ter data de vencimento própria

### RN031 - Progresso de Checklists
- Calculado automaticamente: itens concluídos / total de itens
- Exibido como porcentagem e barra de progresso
- Atualizado em tempo real quando item é marcado/desmarcado

### RN032 - Atribuição em Itens
- Item pode ser atribuído a membro do quadro
- Atribuição é opcional
- Usuário atribuído pode ser removido

---

## 📊 Dashboard e Relatórios

### RN033 - Dashboard do Usuário
- Mostra estatísticas dos quadros acessíveis
- Contadores: total de quadros, cartões, cartões concluídos, atrasados
- Taxa de conclusão calculada automaticamente
- Atualizado em tempo real

### RN034 - Dashboard Administrativo
- Disponível apenas para administradores
- Estatísticas globais do sistema
- Gráficos de produtividade e uso
- Métricas de usuários ativos

### RN035 - Cartões Atrasados
- Identificados por data de vencimento < data atual
- Exibidos em seção específica do dashboard
- Agrupados por quadro e lista
- Link direto para o cartão

### RN036 - Progresso de Checklists
- Dashboard mostra cartões com checklists incompletas
- Progresso visual com barras e porcentagens
- Itens atrasados destacados especialmente

---

## 📁 Upload de Arquivos

### RN037 - Fotos de Perfil
- Apenas imagens permitidas (JPEG, PNG, JPG, GIF)
- Tamanho máximo: 3MB
- Nomes únicos gerados automaticamente
- Armazenamento em sistema de arquivos local

### RN038 - Permissões de Upload
- Usuário pode alterar própria foto
- Admin pode alterar foto de qualquer usuário
- Arquivo anterior não é automaticamente removido

### RN039 - Validações de Arquivo
- Tipo MIME verificado
- Tamanho verificado antes do upload
- Pasta de destino criada automaticamente se não existir

---

## 🔒 Segurança e Permissões

### RN040 - Middleware de Autenticação
- Rotas protegidas verificam se usuário está logado
- Redirecionamento automático para login se não autenticado
- Sessões verificadas em cada requisição

### RN041 - Controle de Acesso por Quadro
- Verificação de membro ou proprietário em operações sensíveis
- Admin sempre tem acesso total
- Falha de acesso retorna erro 403

### RN042 - Validação de Dados
- Todos os inputs validados com schemas Zod
- Sanitização automática de dados
- Prevenção de SQL injection através do ORM

### RN043 - Hashing de Senhas
- Bcrypt com salt único para cada senha
- Senhas nunca armazenadas em texto plano
- Verificação segura na autenticação

### RN044 - Sessões Seguras
- Armazenadas no PostgreSQL com connect-pg-simple
- Cookie com configurações de segurança
- Limpeza automática de sessões expiradas

---

## 🔄 Regras de Negócio Transversais

### RN045 - Soft Delete vs Hard Delete
- Sistema utiliza hard delete em todas as operações
- Dados são permanentemente removidos
- Relacionamentos em cascata respeitados

### RN046 - Ordenação e Posicionamento
- Todos os elementos ordenáveis (listas, cartões, checklists) utilizam campo numérico
- Nova posição = máxima posição existente + 1
- Reordenação recalcula posições conforme necessário

### RN047 - Integridade Referencial
- Foreign keys garantem consistência
- Exclusão em cascata para relacionamentos dependentes
- Constraints de banco aplicadas rigorosamente

### RN048 - Timezone e Datas
- Todas as datas armazenadas em UTC
- Conversão para timezone local no frontend
- Formato ISO 8601 para transferência de dados

### RN049 - Paginação e Performance
- Consultas otimizadas com índices apropriados
- Joins eficientes para reduzir número de queries
- Cache de queries implementado no frontend

### RN050 - Tratamento de Erros
- Validações no frontend e backend
- Mensagens de erro amigáveis ao usuário
- Logs detalhados para debugging
- Rollback automático em transações falhadas

---

## 📈 Métricas e KPIs

### RN051 - Cálculo de Produtividade
- Taxa de conclusão = cartões concluídos / total de cartões
- Cartões em listas "concluído", "pronto", "done" considerados completos
- Atualização em tempo real conforme movimentação

### RN052 - Detecção de Atraso
- Cartão atrasado = data vencimento < data atual
- Item de checklist atrasado = data vencimento < data atual E não concluído
- Contadores atualizados automaticamente

### RN053 - Estatísticas de Uso
- Contagem de quadros por usuário
- Atividade por período (criação, edição, conclusão)
- Métricas de colaboração (membros por quadro, comentários)

---

## 🚫 Limitações Conhecidas

### RN054 - Limitações Atuais
- Não há versionamento de cartões ou auditoria de alterações
- Sistema não suporta anexos além de fotos de perfil
- Notificações em tempo real não implementadas
- Backup e restore manuais
- Não há limite de tamanho para quadros ou número de cartões

### RN055 - Escalabilidade
- Sistema otimizado para uso de pequenas a médias equipes
- Performance pode degradar com muitos usuários simultâneos
- Armazenamento de arquivos local (não CDN)

---

**Versão do Documento**: 1.0  
**Última Atualização**: 31 de Janeiro de 2025  
**Responsável**: Sistema Kanban - Equipe de Desenvolvimento
