/**
 * schema.ts
 * 
 * Este arquivo define o esquema do banco de dados usando Drizzle ORM.
 * Contém todas as definições de tabelas, relacionamentos e tipos TypeScript
 * correspondentes para manter a consistência dos dados entre frontend e backend.
 */

import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Tabela de Usuários
 * 
 * Armazena todas as informações relacionadas às contas de usuário:
 * - Credenciais de autenticação (username/password)
 * - Informações pessoais (nome, email)
 * - Controle de acesso (role: admin ou user)
 * - Imagem de perfil
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  profilePicture: text("profile_picture"),
  role: text("role").notNull().default("user"), // "admin" ou "user"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de usuários
 * Utiliza createInsertSchema para gerar um esquema Zod a partir da tabela
 * - Seleciona apenas os campos específicos para inserção
 * - Define alguns campos como opcionais (partial)
 */
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
    name: true,
    profilePicture: true,
    role: true,
  })
  .partial({
    email: true,
    profilePicture: true,
    role: true,
  });

/**
 * Tipos TypeScript para usuários
 * - InsertUser: tipo para inserção de dados
 * - User: tipo para seleção de dados
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/**
 * Tipo estendido User que inclui função no quadro (board role)
 * Utilizado para mostrar qual papel um usuário tem em um quadro específico
 */
export interface UserWithBoardRole extends User {
  boardRole?: string;
}

/**
 * Tabela de Quadros (Boards)
 * 
 * Representa os quadros Kanban do sistema:
 * - Contém título do quadro
 * - Referência ao usuário criador (userId)
 * - Data de criação
 */
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de quadros
 * Define quais campos são necessários ao criar um novo quadro
 */
export const insertBoardSchema = createInsertSchema(boards).pick({
  title: true,
  description: true,
  userId: true,
});

/**
 * Tipos para quadros
 * - InsertBoard: tipo para inserção 
 * - Board: tipo para seleção
 */
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boards.$inferSelect;

/**
 * Tipo estendido do Board que inclui informações do usuário criador
 * Utilizado para exibir o nome do usuário que criou o quadro
 */
export interface BoardWithCreator extends Board {
  username?: string;
}

/**
 * Tabela de Listas
 * 
 * Representa as colunas verticais dentro de um quadro Kanban:
 * - Título da lista
 * - Referência ao quadro pai (boardId)
 * - Ordem de exibição (para arrastar e soltar)
 * - Data de criação
 */
export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de listas
 * Define campos necessários para criar uma nova lista
 */
export const insertListSchema = createInsertSchema(lists).pick({
  title: true,
  boardId: true,
  order: true,
});

/**
 * Tipos para listas
 */
export type InsertList = z.infer<typeof insertListSchema>;
export type List = typeof lists.$inferSelect;

/**
 * Tabela de Cartões
 * 
 * Representa os cartões de tarefas dentro das listas:
 * - Título e descrição da tarefa
 * - Referência à lista pai (listId)
 * - Ordem de exibição dentro da lista
 * - Data de vencimento (deadline)
 * - Data de criação
 */
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  listId: integer("list_id").references(() => lists.id).notNull(),
  order: integer("order").notNull().default(0),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Schema para inserção de cartões
 * Define os campos necessários e opcionais para criar um novo cartão
 */
export const insertCardSchema = createInsertSchema(cards).pick({
  title: true,
  description: true,
  listId: true,
  order: true,
  dueDate: true,
});

/**
 * Tipos para cartões
 */
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;

/**
 * Tabela de Etiquetas
 * 
 * Representa etiquetas coloridas que podem ser aplicadas aos cartões:
 * - Nome da etiqueta
 * - Cor (em formato hexadecimal ou nome CSS)
 * - Referência ao quadro pai (boardId) - etiquetas são específicas por quadro
 */
export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
});

/**
 * Schema para inserção de etiquetas
 */
export const insertLabelSchema = createInsertSchema(labels).pick({
  name: true,
  color: true,
  boardId: true,
});

/**
 * Tipos para etiquetas
 */
export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labels.$inferSelect;

/**
 * Tabela de Relacionamento entre Cartões e Etiquetas
 * 
 * Tabela de junção que permite associar múltiplas etiquetas a múltiplos cartões:
 * - Referência ao cartão (cardId)
 * - Referência à etiqueta (labelId)
 */
export const cardLabels = pgTable("card_labels", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  labelId: integer("label_id").references(() => labels.id).notNull(),
});

/**
 * Schema para inserção de relacionamentos cartão-etiqueta
 */
export const insertCardLabelSchema = createInsertSchema(cardLabels).pick({
  cardId: true,
  labelId: true,
});

/**
 * Tipos para relacionamento cartão-etiqueta
 */
export type InsertCardLabel = z.infer<typeof insertCardLabelSchema>;
export type CardLabel = typeof cardLabels.$inferSelect;

/**
 * Tabela de Comentários
 * 
 * Armazena comentários feitos pelos usuários nos cartões:
 * - Conteúdo do comentário
 * - Referência ao cartão (cardId)
 * - Referência ao usuário (userId)
 * - Nome do usuário para exibição rápida (userName)
 * - Data de criação
 */
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name").notNull().default("Anonymous"),
});

/**
 * Schema para inserção de comentários
 */
export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  cardId: true,
  userId: true,
  userName: true,
});

/**
 * Tipos para comentários
 */
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

/**
 * Tabela de Relacionamento entre Cartões e Membros
 * 
 * Tabela de junção que associa usuários a cartões (atribuição de tarefas):
 * - Referência ao cartão (cardId)
 * - Referência ao usuário (userId)
 * - Utiliza chave primária composta pelos dois campos
 */
export const cardMembers = pgTable("card_members", {
  cardId: integer("card_id").references(() => cards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.cardId, table.userId] }),
  };
});

/**
 * Schema para inserção de relacionamentos cartão-membro
 */
export const insertCardMemberSchema = createInsertSchema(cardMembers).pick({
  cardId: true,
  userId: true,
});

/**
 * Tipos para relacionamento cartão-membro
 */
export type InsertCardMember = z.infer<typeof insertCardMemberSchema>;
export type CardMember = typeof cardMembers.$inferSelect;

/**
 * Tabela de Checklists
 * 
 * Representa listas de verificação dentro dos cartões:
 * - Título da checklist
 * - Referência ao cartão pai (cardId) 
 * - Ordem de exibição dentro do cartão
 */
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  order: integer("order").notNull().default(0),
});

/**
 * Schema para inserção de checklists
 */
export const insertChecklistSchema = createInsertSchema(checklists).pick({
  title: true,
  cardId: true,
  order: true,
});

/**
 * Tipos para checklists
 */
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Checklist = typeof checklists.$inferSelect;

/**
 * Tabela de Itens de Checklist
 * 
 * Representa os itens individuais dentro de uma checklist:
 * - Conteúdo do item
 * - Referência à checklist pai (checklistId)
 * - Ordem de exibição dentro da checklist
 * - Status de conclusão (completed)
 * - Usuário atribuído (assignedToUserId)
 * - Data de vencimento específica para o item (dueDate)
 */
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  checklistId: integer("checklist_id").references(() => checklists.id).notNull(),
  order: integer("order").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  dueDate: timestamp("due_date"),
});

/**
 * Schema para inserção de itens de checklist
 */
export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  content: true,
  checklistId: true,
  order: true,
  completed: true,
  assignedToUserId: true,
  dueDate: true,
});

/**
 * Tipos para itens de checklist
 */
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;

/**
 * Tabela de Membros do Quadro
 * 
 * Representa o relacionamento entre usuários e quadros (convites/membros):
 * - Referência ao quadro (boardId)
 * - Referência ao usuário (userId)
 * - Função do usuário no quadro (role): "owner", "editor" ou "viewer"
 * - Data de criação do relacionamento
 * - Utiliza chave primária composta pelos campos boardId e userId
 */
export const boardMembers = pgTable("board_members", {
  boardId: integer("board_id").references(() => boards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("viewer"), // "owner", "editor" ou "viewer"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.boardId, table.userId] }),
  };
});

/**
 * Schema para inserção de membros de quadro
 */
export const insertBoardMemberSchema = createInsertSchema(boardMembers).pick({
  boardId: true,
  userId: true,
  role: true,
});

/**
 * Tipos para membros de quadro
 */
export type InsertBoardMember = z.infer<typeof insertBoardMemberSchema>;
export type BoardMember = typeof boardMembers.$inferSelect;