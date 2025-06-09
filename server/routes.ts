/**
 * routes.ts
 * 
 * Este arquivo define todas as rotas da API REST do sistema Kanban.
 * Implementa os endpoints para gerenciamento de quadros, listas, cartões,
 * etiquetas, comentários, usuários e outras funcionalidades.
 * 
 * Características principais:
 * - Autenticação e autorização em rotas protegidas
 * - Validação de dados com Zod
 * - Upload de arquivos (fotos de perfil) com Multer
 * - Controle de acesso baseado em papéis (admin, user)
 * - Implementação de permissões granulares por quadro
 * 
 * Grupos de endpoints:
 * 1. Autenticação: login, logout, registro, informações do usuário
 * 2. Quadros: criação, leitura, atualização, exclusão
 * 3. Listas: gerenciamento de colunas dentro de quadros 
 * 4. Cartões: tarefas individuais com descrições, datas, etc.
 * 5. Etiquetas: classificação visual de cartões
 * 6. Comentários: comunicação em cartões
 * 7. Usuários: gerenciamento de contas
 * 8. Checklists: listas de verificação em cartões
 * 9. Membros: gerenciamento de convites e permissões
 * 10. Dashboard: estatísticas e informações gerais
 */

import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage as appStorage } from "./db-storage";
import { z } from "zod";
import { 
  insertBoardSchema, 
  insertListSchema, 
  insertCardSchema, 
  insertLabelSchema, 
  insertCardLabelSchema,
  insertCommentSchema,
  insertCardMemberSchema,
  insertBoardMemberSchema
} from "@shared/schema";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { isAuthenticated, isAdmin, isBoardOwnerOrAdmin, hasCardAccess } from "./middlewares";
import { sql } from "./database";

/**
 * Função principal para registrar todas as rotas da API
 *
 * Esta função configura:
 * - Diretórios para arquivos estáticos
 * - Upload de arquivos
 * - Middleware de autenticação
 * - Todas as rotas de API REST
 * - Tratamento de erros
 * 
 * @param app Instância do Express para registro das rotas
 * @returns Servidor HTTP configurado
 */
export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * Rota de Health Check
   * Verifica o status da aplicação e do banco de dados
   */
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      // Testar conexão com banco
      const result = await sql`SELECT 1 as health_check;`;

      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        database: "disconnected",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    }
  });

  /**
   * Configuração de diretório para servir arquivos estáticos
   * Permite acessar imagens de perfil e outros uploads através de URLs
   */
  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

  /**
   * Configuração do sistema de upload de arquivos com Multer
   * 
   * Gerencia o armazenamento em disco de fotos de perfil:
   * - Define o destino dos arquivos no sistema de arquivos
   * - Gera nomes de arquivo únicos para evitar colisões
   * - Preserva a extensão original do arquivo
   */
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), "public/uploads/profile_pictures");

      // Verificar se o diretório existe e criar se necessário
      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
          console.log(`Diretório criado: ${uploadDir}`);
        } catch (err) {
          console.error(`Erro ao criar diretório de upload: ${err}`);
          return cb(new Error("Falha ao configurar armazenamento"), "");
        }
      }

      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "profile-" + uniqueSuffix + ext);
    },
  });

  /**
   * Configuração do middleware de upload Multer
   * 
   * Define:
   * - Limite de tamanho de arquivo (3MB)
   * - Filtro de tipo de arquivo (apenas imagens)
   * - Armazenamento personalizado no disco
   */
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 3 * 1024 * 1024, // 3MB
    },
    fileFilter: function (req, file, cb) {
      // Aceitar apenas imagens
      if (!file.mimetype.match(/^image\/(jpeg|png|jpg|gif)$/)) {
        return cb(new Error("Apenas imagens são permitidas"));
      }
      cb(null, true);
    },
  });

  /**
   * Middleware para tratamento centralizado de erros do multer
   * 
   * Intercepta e trata erros específicos do sistema de upload:
   * - Erros de limite de tamanho de arquivo
   * - Erros de tipo de arquivo inválido
   * - Outros erros relacionados à upload
   * 
   * Formata as mensagens de erro para serem amigáveis ao usuário final
   */
  const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      // Tratamento específico para erros do multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "O arquivo é muito grande. Tamanho máximo: 3MB" });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // Outros erros não relacionados diretamente ao multer
      return res.status(400).json({ message: err.message });
    }
    next();
  };

  /**
   * Configuração do sistema de autenticação
   * 
   * Inicializa o Passport.js com estratégia local (username/password)
   * Configura as rotas de autenticação: 
   * - /api/login
   * - /api/logout
   * - /api/register
   * - /api/user
   */
  setupAuth(app);

  /**
   * Rotas para gerenciar Quadros (Boards)
   * 
   * Estas rotas controlam:
   * - Listagem de quadros acessíveis ao usuário
   * - Detalhes de um quadro específico
   * - Criação de novos quadros
   * - Atualização de quadros existentes
   * - Exclusão de quadros
   * 
   * Controle de acesso:
   * - Administradores podem ver todos os quadros
   * - Usuários normais só veem quadros para os quais foram convidados
   * - Autenticação obrigatória para criação
   */
  app.get("/api/boards", async (req: Request, res: Response) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.isAuthenticated() || !req.user) {
        // Se não estiver autenticado, retorna quadros públicos (se houver)
        const boards = await appStorage.getBoards();
        return res.json(boards);
      }

      // Verifica se o usuário é administrador
      if (req.user.role && req.user.role.toLowerCase() === "admin") {
        // Administradores podem ver todos os quadros
        const allBoards = await appStorage.getBoards();
        return res.json(allBoards);
      }

      // Para usuários normais, retorna apenas os quadros que podem acessar
      const userId = req.user.id;
      const accessibleBoards = await appStorage.getBoardsUserCanAccess(userId);
      res.json(accessibleBoards);
    } catch (error) {
      console.error("Erro ao buscar quadros:", error);
      res.status(500).json({ message: "Falha ao buscar quadros" });
    }
  });

  app.get("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do quadro inválido" });
      }

      const board = await appStorage.getBoard(id);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário tem permissão para acessar este quadro
      if (req.isAuthenticated() && req.user) {
        // Administradores podem acessar qualquer quadro
        if (req.user.role && req.user.role.toLowerCase() === "admin") {
          return res.json(board);
        }

        // Se é o dono do quadro, permitir acesso
        if (board.userId === req.user.id) {
          return res.json(board);
        }

        // Se não é o dono, verifica se é membro do quadro
        const boardMember = await appStorage.getBoardMember(id, req.user.id);
        if (!boardMember) {
          return res.status(403).json({ message: "Acesso negado a este quadro" });
        }
      } else if (board.userId !== null) {
        // Se o quadro não é público e o usuário não está autenticado
        return res.status(403).json({ message: "Acesso negado a este quadro" });
      }

      res.json(board);
    } catch (error) {
      console.error("Erro ao buscar quadro:", error);
      res.status(500).json({ message: "Falha ao buscar quadro" });
    }
  });

  app.post("/api/boards", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const validatedData = insertBoardSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const board = await appStorage.createBoard(validatedData);
      res.status(201).json(board);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid board data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  app.patch("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const existingBoard = await appStorage.getBoard(id);
      if (!existingBoard) {
        return res.status(404).json({ message: "Board not found" });
      }

      const validatedData = insertBoardSchema.partial().parse(req.body);
      const updatedBoard = await appStorage.updateBoard(id, validatedData);
      res.json(updatedBoard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid board data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update board" });
    }
  });

  app.delete("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const success = await appStorage.deleteBoard(id);
      if (!success) {
        return res.status(404).json({ message: "Board not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  /**
   * Rotas para gerenciar Listas (Colunas do Kanban)
   */
  app.get("/api/boards/:boardId/lists", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const lists = await appStorage.getLists(boardId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lists" });
    }
  });

  app.post("/api/lists", async (req: Request, res: Response) => {
    try {
      const validatedData = insertListSchema.parse(req.body);

      // Ensure boardId exists
      const board = await appStorage.getBoard(validatedData.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      // If order is not provided, set it as the highest order + 1
      if (validatedData.order === undefined) {
        const lists = await appStorage.getLists(validatedData.boardId);
        const maxOrder = lists.length > 0 
          ? Math.max(...lists.map(list => list.order))
          : -1;
        validatedData.order = maxOrder + 1;
      }

      const list = await appStorage.createList(validatedData);
      res.status(201).json(list);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create list" });
    }
  });

  app.patch("/api/lists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const existingList = await appStorage.getList(id);
      if (!existingList) {
        return res.status(404).json({ message: "List not found" });
      }

      const validatedData = insertListSchema.partial().parse(req.body);
      const updatedList = await appStorage.updateList(id, validatedData);
      res.json(updatedList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid list data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update list" });
    }
  });

  app.delete("/api/lists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const success = await appStorage.deleteList(id);
      if (!success) {
        return res.status(404).json({ message: "List not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete list" });
    }
  });

  /**
   * Rotas para gerenciar Cartões (Cards)
   */
  app.get("/api/lists/:listId/cards", async (req: Request, res: Response) => {
    try {
      const listId = parseInt(req.params.listId);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }

      const cards = await appStorage.getCards(listId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.get("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const card = await appStorage.getCard(id);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card" });
    }
  });

  app.get("/api/cards/:cardId/details", hasCardAccess, async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "ID do cartão inválido" });
      }

      // Buscar o cartão
      const card = await appStorage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Cartão não encontrado" });
      }

      // Buscar informações relacionadas
      const list = await appStorage.getList(card.listId);
      const board = list ? await appStorage.getBoard(list.boardId) : null;
      const members = await appStorage.getCardMembers(cardId);
      const cardLabels = await appStorage.getCardLabels(cardId);
      const checklists = await appStorage.getChecklists(cardId);

      // Buscar os detalhes das etiquetas
      let labels: any[] = [];
      if (cardLabels && cardLabels.length > 0) {
        const labelIds = cardLabels.map(cl => cl.labelId);
        labels = await appStorage.getLabels(board?.id || 0); // Usar 0 como fallback, não afetará a lógica
        labels = labels.filter(label => labelIds.includes(label.id));
      }

      // Buscar os itens de cada checklist
      const checklistsWithItems = [];
      for (const checklist of checklists) {
        const items = await appStorage.getChecklistItems(checklist.id);
        checklistsWithItems.push({
          ...checklist,
          items
        });
      }

      // Retornar informações completas
      res.json({
        card,
        list,
        board,
        members,
        labels,
        checklists: checklistsWithItems
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes do cartão:", error);
      res.status(500).json({ message: "Falha ao buscar detalhes do cartão" });
    }
  });

  app.post("/api/cards", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardSchema.parse(req.body);

      // Ensure listId exists
      const list = await appStorage.getList(validatedData.listId);
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }

      // If order is not provided, set it as the highest order + 1
      if (validatedData.order === undefined) {
        const cards = await appStorage.getCards(validatedData.listId);
        const maxOrder = cards.length > 0 
          ? Math.max(...cards.map(card => card.order))
          : -1;
        validatedData.order = maxOrder + 1;
      }

      const card = await appStorage.createCard(validatedData);
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.patch("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const existingCard = await appStorage.getCard(id);
      if (!existingCard) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Preparando os dados do cartão para atualização
      const cardData = { ...req.body };

      // Verificar se dueDate está sendo enviado
      if (cardData.dueDate !== undefined) {
        // Se é uma string ou um objeto Date, normalizar para Date
        if (cardData.dueDate !== null) {
          cardData.dueDate = new Date(cardData.dueDate);
        }
      }

      const validatedData = insertCardSchema.partial().parse(cardData);
      const updatedCard = await appStorage.updateCard(id, validatedData);
      res.json(updatedCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      console.error("Erro ao atualizar cartão:", error);
      res.status(500).json({ message: "Failed to update card" });
    }
  });

  app.delete("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const success = await appStorage.deleteCard(id);
      if (!success) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  /**
   * Rotas para gerenciar Etiquetas (Labels)
   */
  app.get("/api/boards/:boardId/labels", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const labels = await appStorage.getLabels(boardId);
      res.json(labels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labels" });
    }
  });

  app.post("/api/labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLabelSchema.parse(req.body);
      const label = await appStorage.createLabel(validatedData);
      res.status(201).json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create label" });
    }
  });

  /**
   * Rotas para gerenciar associações entre Cartões e Etiquetas
   */
  app.get("/api/cards/:cardId/labels", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const cardLabels = await appStorage.getCardLabels(cardId);
      res.json(cardLabels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card labels" });
    }
  });

  app.post("/api/card-labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardLabelSchema.parse(req.body);
      const cardLabel = await appStorage.addLabelToCard(validatedData);
      res.status(201).json(cardLabel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add label to card" });
    }
  });

  app.delete("/api/cards/:cardId/labels/:labelId", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const labelId = parseInt(req.params.labelId);

      if (isNaN(cardId) || isNaN(labelId)) {
        return res.status(400).json({ message: "Invalid card ID or label ID" });
      }

      const success = await appStorage.removeLabelFromCard(cardId, labelId);
      if (!success) {
        return res.status(404).json({ message: "Card label association not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove label from card" });
    }
  });

  /**
   * Rotas para gerenciar Comentários
   */
  app.get("/api/cards/:cardId/comments", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const comments = await appStorage.getComments(cardId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);

      // Ensure cardId exists
      const card = await appStorage.getCard(validatedData.cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      const comment = await appStorage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const success = await appStorage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  /**
   * Rotas para gerenciar Usuários
   */
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await appStorage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar usuários" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Verificar se o usuário existe
      const existingUser = await appStorage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Restringir atualizações de role apenas para administradores atuais
      if (req.body.role && (!req.user || req.user.role.toLowerCase() !== "admin")) {
        return res.status(403).json({ message: "Permissão negada para alteração de função do usuário" });
      }

      const userData = { ...req.body };
      delete userData.password; // Impede a atualização de senha por esta rota

      const updatedUser = await appStorage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) =>{
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Apenas administradores podem excluir usuários
      if (!req.user || req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Apenas administradores podem excluir usuários." });
      }

      // Não permitir que um administrador exclua sua própria conta
      if (req.user.id === id) {
        return res.status(400).json({ message: "Não é possível excluir sua própria conta." });
      }

      const success = await appStorage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado ou não pode ser excluído" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Falha ao excluir usuário" });
    }
  });

  /**
   * Rotas para gerenciar Etiquetas (Labels)
   */
  app.get("/api/boards/:boardId/labels", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Invalid board ID" });
      }

      const labels = await appStorage.getLabels(boardId);
      res.json(labels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labels" });
    }
  });

  app.post("/api/labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLabelSchema.parse(req.body);
      const label = await appStorage.createLabel(validatedData);
      res.status(201).json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create label" });
    }
  });

  /**
   * Rotas para gerenciar associações entre Cartões e Etiquetas
   */
  app.get("/api/cards/:cardId/labels", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const cardLabels = await appStorage.getCardLabels(cardId);
      res.json(cardLabels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card labels" });
    }
  });

  app.post("/api/card-labels", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardLabelSchema.parse(req.body);
      const cardLabel = await appStorage.addLabelToCard(validatedData);
      res.status(201).json(cardLabel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card label data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add label to card" });
    }
  });

  app.delete("/api/cards/:cardId/labels/:labelId", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const labelId = parseInt(req.params.labelId);

      if (isNaN(cardId) || isNaN(labelId)) {
        return res.status(400).json({ message: "Invalid card ID or label ID" });
      }

      const success = await appStorage.removeLabelFromCard(cardId, labelId);
      if (!success) {
        return res.status(404).json({ message: "Card label association not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove label from card" });
    }
  });

  /**
   * Rotas para gerenciar Comentários
   */
  app.get("/api/cards/:cardId/comments", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const comments = await appStorage.getComments(cardId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);

      // Ensure cardId exists
      const card = await appStorage.getCard(validatedData.cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      const comment = await appStorage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const success = await appStorage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  /**
   * Rotas para o Dashboard - Monitoramento de Tarefas com Checklists
   */

  /**
   * Obtém cartões com checklists para o dashboard
   * Retorna cartões que têm pelo menos um checklist e:
   * - Estão atribuídos ao usuário logado, ou
   * - Têm data de vencimento próxima ou já vencida
   */
  app.get("/api/cards/checklists-dashboard", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      // Buscar quadros acessíveis pelo usuário
      const boards = await appStorage.getBoardsUserCanAccess(req.user.id);
      const checklistCards: any[] = [];

      for (const board of boards) {
        try {
          const lists = await appStorage.getLists(board.id);

          for (const list of lists) {
            const cards = await appStorage.getCards(list.id);

            for (const card of cards) {
              const checklists = await appStorage.getChecklists(card.id);

              for (const checklist of checklists) {
                const items = await appStorage.getChecklistItems(checklist.id);
                const totalItems = items.length;
                const completedItems = items.filter(item => item.completed).length;

                // Filtrar itens atrasados
                const overdueItems = items.filter(item => 
                  item.dueDate && new Date(item.dueDate) < new Date() && !item.completed
                );

                checklistCards.push({
                  id: card.id,
                  title: card.title,
                  dueDate: card.dueDate,
                  listName: list.title,
                  boardId: board.id,
                  boardName: board.title,
                  checklistTitle: checklist.title,
                  checklistId: checklist.id,
                  totalItems,
                  completedItems,
                  overdueItems: overdueItems.length > 0 ? overdueItems : undefined,
                  items
                });
              }
            }
          }
        } catch (listError) {
          console.warn(`Erro ao processar listas do quadro ${board.id}:`, listError);
          continue;
        }
      }

      return res.json(checklistCards);
    } catch (error) {
      console.error("Erro ao buscar cartões com checklists:", error);
      return res.json([]); // Retorna array vazio em caso de erro para não quebrar o frontend
    }
  });

  /**
   * Obtém cartões atrasados para o dashboard
   * Retorna cartões que:
   * - Estão em quadros acessíveis ao usuário
   * - Têm data de vencimento que já passou
   */
  app.get("/api/cards/overdue-dashboard", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    try {
      // Buscar quadros acessíveis pelo usuário
      const boards = await appStorage.getBoardsUserCanAccess(req.user.id);
      const overdueCards: any[] = [];
      const now = new Date();

      for (const board of boards) {
        try {
          const lists = await appStorage.getLists(board.id);

          for (const list of lists) {
            const cards = await appStorage.getCards(list.id);

            for (const card of cards) {
              if (card.dueDate && new Date(card.dueDate) < now) {
                overdueCards.push({
                  id: card.id,
                  title: card.title,
                  dueDate: card.dueDate,
                  listName: list.title,
                  boardName: board.title,
                  boardId: board.id
                });
              }
            }
          }
        } catch (listError) {
          console.warn(`Erro ao processar listas do quadro ${board.id}:`, listError);
          continue;
        }
      }

      return res.json(overdueCards);
    } catch (error) {
      console.error("Erro ao buscar cartões atrasados:", error);
      return res.json([]); // Retorna array vazio em caso de erro para não quebrar o frontend
    }
  });

  /**
   * Rotas para gerenciar Usuários
   */
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await appStorage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar usuários" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Verificar se o usuário existe
      const existingUser = await appStorage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Restringir atualizações de role apenas para administradores atuais
      if (req.body.role && (!req.user || req.user.role.toLowerCase() !== "admin")) {
        return res.status(403).json({ message: "Permissão negada para alteração de função do usuário" });
      }

      const userData = { ...req.body };
      delete userData.password; // Impede a atualização de senha por esta rota

      const updatedUser = await appStorage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) =>{
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Apenas administradores podem excluir usuários
      if (!req.user || req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Apenas administradores podem excluir usuários." });
      }

      // Não permitir que um administrador exclua sua própria conta
      if (req.user.id === id) {
        return res.status(400).json({ message: "Não é possível excluir sua própria conta." });
      }

      const success = await appStorage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado ou não pode ser excluído" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Falha ao excluir usuário" });
    }
  });

  /**
   * Rota para alteração de senha de usuário
   * 
   * Implementa mecanismos de segurança:
   * - Verificação de autenticação
   * - Validação de autorização (próprio usuário ou admin)
   * - Verificação da senha atual para não-administradores
   * - Validação de complexidade da nova senha
   * - Geração segura de hash com salt único
   */
  app.post("/api/users/:id/change-password", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID do usuário inválido" });
      }

      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Apenas administradores ou o próprio usuário podem alterar a senha
      if (req.user.id !== id && req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Você não pode alterar a senha de outro usuário." });
      }

      // Validar dados de entrada
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      // Obter usuário
      const user = await appStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Para não administradores, validar senha atual
      if (req.user.role.toLowerCase() !== "admin" || req.user.id === id) {
        if (!currentPassword) {
          return res.status(400).json({ message: "A senha atual é obrigatória" });
        }

        const isPasswordValid = await comparePasswords(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Senha atual incorreta" });
        }
      }

      // Gerar hash da nova senha
      const hashedNewPassword = await hashPassword(newPassword);

      // Atualizar senha
      const updatedUser = await appStorage.updateUser(id, { password: hashedNewPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar senha" });
      }

      res.status(200).json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({ message: "Falha ao alterar senha" });
    }
  });

  /**
   * Rota para upload de imagem de perfil
   * 
   * Utiliza multer para processamento de arquivos multipart/form-data:
   * - Validação de permissões de usuário
   * - Tratamento de erros específicos de upload
   * - Armazenamento de arquivos no sistema de arquivos
   * - Atualização da referência no banco de dados
   * - Limpeza de arquivos em caso de erro
   */
  app.post("/api/users/:id/profile-image", upload.single('profile_image'), handleMulterError, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }

      // Verificar permissões
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Apenas o próprio usuário ou um administrador pode alterar a imagem de perfil
      if (req.user.id !== id && req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Permissão negada. Você não pode alterar a imagem de outro usuário." });
      }

      // Verificar se um arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }

      // Obter o caminho do arquivo salvo
      const filePath = req.file.path;
      const relativePath = path.relative(path.join(process.cwd(), "public"), filePath);
      const fileUrl = `/${relativePath.replace(/\\/g, '/')}`;

      // Atualizar a URL da imagem de perfil no banco de dados
      const user = await appStorage.updateUser(id, { profilePicture: fileUrl });

      if (!user) {
        // Se a atualização falhar, remover o arquivo enviado
        fs.unlink(filePath, (err) => {
          if (err) console.error("Erro ao remover arquivo temporário:", err);
        });
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json(user);
    } catch (error) {
      console.error("Erro ao fazer upload de imagem de perfil:", error);
      // Remover o arquivo se ocorrer um erro
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Erro ao remover arquivo temporário:", err);
        });
      }
      res.status(500).json({ message: "Falha ao atualizar imagem de perfil" });
    }
  });

  /**
   * Rotas para gerenciar Membros dos Cartões
   */
  app.get("/api/cards/:cardId/members", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "ID do cartão inválido" });
      }

      const members = await appStorage.getCardMembers(cardId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar membros do cartão" });
    }
  });

  app.post("/api/card-members", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCardMemberSchema.parse(req.body);

      // Verificar se o cartão existe
      const card = await appStorage.getCard(validatedData.cardId);
      if (!card) {
        return res.status(404).json({ message: "Cartão não encontrado" });
      }

      // Verificar se o usuário existe
      const user = await appStorage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const cardMember = await appStorage.addMemberToCard(validatedData);
      res.status(201).json(cardMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao adicionar membro ao cartão" });
    }
  });

  app.delete("/api/cards/:cardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(cardId) || isNaN(userId)) {
        return res.status(400).json({ message: "ID do cartão ou ID do usuário inválido" });
      }

      const success = await appStorage.removeMemberFromCard(cardId, userId);
      if (!success) {
        return res.status(404).json({ message: "Membro não encontrado no cartão" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Falha ao remover membro do cartão" });
    }
  });

  /**
   * Rotas para gerenciar Checklists
   */
  app.get("/api/cards/:cardId/checklists", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId);

      if (isNaN(cardId)) {
        return res.status(400).json({ message: "ID do cartão inválido" });
      }

      const checklists = await appStorage.getChecklists(cardId);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar checklists" });
    }
  });

  app.get("/api/checklists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const checklist = await appStorage.getChecklist(id);

      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrada" });
      }

      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar checklist" });
    }
  });

  app.post("/api/checklists", async (req: Request, res: Response) => {
    try {
      const { title, cardId, order } = req.body;

      if (!title || !cardId) {
        return res.status(400).json({ message: "Título e ID do cartão são obrigatórios" });
      }

      const checklist = await appStorage.createChecklist({ title, cardId, order });
      res.status(201).json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Falha ao criar checklist" });
    }
  });

  app.patch("/api/checklists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const checklist = await appStorage.updateChecklist(id, req.body);

      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrada" });
      }

      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Falha ao atualizar checklist" });
    }
  });

  app.delete("/api/checklists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await appStorage.deleteChecklist(id);

      if (!success) {
        return res.status(404).json({ message: "Checklist não encontrada" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Falha ao excluir checklist" });
    }
  });

  /**
   * Rotas para gerenciar Itens de Checklist
   */
  app.get("/api/checklists/:checklistId/items", async (req: Request, res: Response) => {
    try {
      const checklistId = parseInt(req.params.checklistId);

      if (isNaN(checklistId)) {
        return res.status(400).json({ message: "ID da checklist inválido" });
      }

      const items = await appStorage.getChecklistItems(checklistId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar itens da checklist" });
    }
  });

  app.post("/api/checklist-items", async (req: Request, res: Response) => {
    try {
      const { content, checklistId, order, completed } = req.body;

      if (!content || !checklistId) {
        return res.status(400).json({ message: "Conteúdo e ID da checklist são obrigatórios" });
      }

      const item = await appStorage.createChecklistItem({ content, checklistId, order, completed });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Falha ao criar item da checklist" });
    }
  });

  app.patch("/api/checklist-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      // Preparando os dados do item para atualização
      const itemData = { ...req.body };

      // Verificar se dueDate está sendo enviado
      if (itemData.dueDate !== undefined) {
        // Se é uma string ou um objeto Date, normalizar para Date
        if (itemData.dueDate !== null) {
          itemData.dueDate = new Date(itemData.dueDate);
        }
      }

      const item = await appStorage.updateChecklistItem(id, itemData);

      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.json(item);
    } catch (error) {
      console.error("Erro ao atualizar item da checklist:", error);
      res.status(500).json({ message: "Falha ao atualizar item da checklist" });
    }
  });

  app.delete("/api/checklist-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await appStorage.deleteChecklistItem(id);

      if (!success) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Falha ao excluir item da checklist" });
    }
  });

  /**
   * Rotas para gerenciar Membros dos Quadros
   */
  app.get("/api/boards/:boardId/members", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "ID do quadro inválido" });
      }

      const members = await appStorage.getBoardMembers(boardId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar membros do quadro" });
    }
  });

  app.get("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(boardId) || isNaN(userId)) {
        return res.status(400).json({ message: "ID do quadro ou ID do usuário inválido" });
      }

      const member = await appStorage.getBoardMember(boardId, userId);
      if (!member) {
        return res.status(404).json({ message: "Membro não encontrado neste quadro" });
      }

      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar membro do quadro" });
    }
  });

  app.post("/api/board-members", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBoardMemberSchema.parse(req.body);

      // Verificar se o quadro existe
      const board = await appStorage.getBoard(validatedData.boardId);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário existe
      const user = await appStorage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Verificar se o usuário atual tem permissão para adicionar membros
      // Apenas o criador do quadro ou um admin pode adicionar membros
      if (req.user && (board.userId === req.user.id || req.user.role.toLowerCase() === "admin")) {
        const boardMember = await appStorage.addMemberToBoard(validatedData);
        res.status(201).json(boardMember);
      } else {
        res.status(403).json({ message: "Permissão negada para adicionar membros a este quadro" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao adicionar membro ao quadro" });
    }
  });

  app.patch("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      if (isNaN(boardId) || isNaN(userId) || !role) {
        return res.status(400).json({ message: "Dados inválidos para atualização de membro" });
      }

      // Verificar se o quadro existe
      const board = await appStorage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário atual tem permissão para atualizar membros
      if (req.user && (board.userId === req.user.id || req.user.role.toLowerCase() === "admin")) {
        const updatedMember = await appStorage.updateBoardMember(boardId, userId, role);
        if (!updatedMember) {
          return res.status(404).json({ message: "Membro não encontrado neste quadro" });
        }
        res.json(updatedMember);
      } else {
        res.status(403).json({ message: "Permissão negada para atualizar membros deste quadro" });
      }
    } catch (error) {
      res.status(500).json({ message: "Falha ao atualizar membro do quadro" });
    }
  });

  app.delete("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(boardId) || isNaN(userId)) {
        return res.status(400).json({ message: "ID do quadro ou ID do usuário inválido" });
      }

      // Verificar se o quadro existe
      const board = await appStorage.getBoard(boardId);
      if (!board) {
        return res.status(404).json({ message: "Quadro não encontrado" });
      }

      // Verificar se o usuário atual tem permissão para remover membros
      if (req.user && (board.userId === req.user.id || req.user.role.toLowerCase() === "admin" || req.user.id === userId)) {
        const success = await appStorage.removeMemberFromBoard(boardId, userId);
        if (!success) {
          return res.status(404).json({ message: "Membro não encontrado neste quadro" });
        }
        res.status(204).end();
      } else {
        res.status(403).json({ message: "Permissão negada para remover membros deste quadro" });
      }
    } catch (error) {
      res.status(500).json({ message: "Falha ao remover membro do quadro" });
    }
  });

  /**
   * Rota para obter todos os quadros acessíveis por um usuário
   */
  app.get("/api/user-boards", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const boards = await appStorage.getBoardsUserCanAccess(req.user.id);
      res.json(boards);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar quadros do usuário" });
    }
  });

  /**
   * Rota para obter estatísticas do dashboard
   */
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Obtém todos os quadros acessíveis pelo usuário
      const userBoards = await appStorage.getBoardsUserCanAccess(req.user.id);
      let totalCards = 0;
      let completedCards = 0;
      let overdueCards = 0;

      // Para cada quadro, busca as listas e os cartões
      for (const board of userBoards) {
        const lists = await appStorage.getLists(board.id);

        for (const list of lists) {
          const cards = await appStorage.getCards(list.id);
          totalCards += cards.length;

          // Considera cartões em listas com "Concluído" ou "Pronto" como completados
          const isCompletedList = list.title.toLowerCase().includes("concluído") || 
                                 list.title.toLowerCase().includes("pronto") ||
                                 list.title.toLowerCase().includes("done") ||
                                 list.title.toLowerCase().includes("completed");

          if (isCompletedList) {
            completedCards += cards.length;
          }

          // Conta cartões com prazo vencido
          for (const card of cards) {
            if (card.dueDate) {
              const dueDate = new Date(card.dueDate);
              const now = new Date();
              if (dueDate < now) {
                overdueCards++;
              }
            }
          }
        }
      }

      // Calcular taxa de conclusão
      const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

      // Obtém contagem de usuários (somente para admins)
      let totalUsers = 0;

      res.json({
        totalBoards: userBoards.length,
        totalCards,
        completedCards,
        overdueCards,
        completionRate,
        totalUsers
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas do dashboard:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas do dashboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}