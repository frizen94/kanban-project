import { 
  users, 
  type User, 
  type InsertUser, 
  boards, 
  type Board, 
  type InsertBoard, 
  lists, 
  type List, 
  type InsertList, 
  cards, 
  type Card, 
  type InsertCard,
  labels,
  type Label,
  type InsertLabel,
  cardLabels,
  type CardLabel,
  type InsertCardLabel,
  comments,
  type Comment,
  type InsertComment,
  cardMembers,
  type CardMember,
  type InsertCardMember,
  checklists,
  type Checklist,
  type InsertChecklist,
  checklistItems,
  type ChecklistItem,
  type InsertChecklistItem,
  boardMembers,
  type BoardMember,
  type InsertBoardMember,
  type BoardWithCreator,
  type UserWithBoardRole
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Storage interface with CRUD methods
export interface IStorage {
  // Session store
  sessionStore: any;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUserCount(): Promise<number>;
  
  // Board methods
  getBoards(): Promise<Board[]>;
  getBoardsForUser(userId: number): Promise<Board[]>;
  getBoard(id: number): Promise<BoardWithCreator | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: number, board: Partial<InsertBoard>): Promise<Board | undefined>;
  deleteBoard(id: number): Promise<boolean>;
  
  // Board Member methods
  getBoardMembers(boardId: number): Promise<UserWithBoardRole[]>;
  getBoardMember(boardId: number, userId: number): Promise<BoardMember | undefined>;
  addMemberToBoard(boardMember: InsertBoardMember): Promise<BoardMember>;
  updateBoardMember(boardId: number, userId: number, role: string): Promise<BoardMember | undefined>;
  removeMemberFromBoard(boardId: number, userId: number): Promise<boolean>;
  getBoardsUserCanAccess(userId: number): Promise<Board[]>;
  
  // List methods
  getLists(boardId: number): Promise<List[]>;
  getList(id: number): Promise<List | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(id: number, list: Partial<InsertList>): Promise<List | undefined>;
  deleteList(id: number): Promise<boolean>;
  
  // Card methods
  getCards(listId: number): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, card: Partial<InsertCard>): Promise<Card | undefined>;
  deleteCard(id: number): Promise<boolean>;
  
  // Label methods
  getLabels(boardId: number): Promise<Label[]>;
  getLabel(id: number): Promise<Label | undefined>;
  createLabel(label: InsertLabel): Promise<Label>;
  
  // Card Label methods
  getCardLabels(cardId: number): Promise<CardLabel[]>;
  addLabelToCard(cardLabel: InsertCardLabel): Promise<CardLabel>;
  removeLabelFromCard(cardId: number, labelId: number): Promise<boolean>;
  
  // Comment methods
  getComments(cardId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Card Member methods
  getCardMembers(cardId: number): Promise<User[]>;
  addMemberToCard(cardMember: InsertCardMember): Promise<CardMember>;
  removeMemberFromCard(cardId: number, userId: number): Promise<boolean>;
  getUsers(): Promise<User[]>;
  
  // Checklist methods
  getChecklists(cardId: number): Promise<Checklist[]>;
  getChecklist(id: number): Promise<Checklist | undefined>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: number, checklist: Partial<InsertChecklist>): Promise<Checklist | undefined>;
  deleteChecklist(id: number): Promise<boolean>;
  
  // Checklist Item methods
  getChecklistItems(checklistId: number): Promise<ChecklistItem[]>;
  getChecklistItem(id: number): Promise<ChecklistItem | undefined>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: number, item: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined>;
  deleteChecklistItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  public sessionStore: any;
  private users: Map<number, User>;
  private boards: Map<number, Board>;
  private lists: Map<number, List>;
  private cards: Map<number, Card>;
  private labels: Map<number, Label>;
  private cardLabels: Map<number, CardLabel>;
  private comments: Map<number, Comment>;
  private cardMembers: Map<string, CardMember>;
  private boardMembers: Map<string, BoardMember>;
  private checklists: Map<number, Checklist>;
  private checklistItems: Map<number, ChecklistItem>;
  
  private userIdCounter: number;
  private boardIdCounter: number;
  private listIdCounter: number;
  private cardIdCounter: number;
  private labelIdCounter: number;
  private cardLabelIdCounter: number;
  private commentIdCounter: number;
  private checklistIdCounter: number;
  private checklistItemIdCounter: number;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.users = new Map();
    this.boards = new Map();
    this.lists = new Map();
    this.cards = new Map();
    this.labels = new Map();
    this.cardLabels = new Map();
    this.comments = new Map();
    this.cardMembers = new Map();
    this.boardMembers = new Map();
    this.checklists = new Map();
    this.checklistItems = new Map();
    
    this.userIdCounter = 1;
    this.boardIdCounter = 1;
    this.listIdCounter = 1;
    this.cardIdCounter = 1;
    this.labelIdCounter = 1;
    this.cardLabelIdCounter = 1;
    this.commentIdCounter = 1;
    this.checklistIdCounter = 1;
    this.checklistItemIdCounter = 1;
    
    // Criar usuários iniciais para teste
    this.createUser({
      username: "breno.santos",
      email: "breno@mail.com",
      name: "Breno Santos",
      password: "senha123"
    });
    
    this.createUser({
      username: "maria.silva",
      email: "maria@mail.com",
      name: "Maria Silva",
      password: "senha123"
    });
    
    this.createUser({
      username: "joao.souza",
      email: "joao@mail.com",
      name: "João Souza",
      password: "senha123"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure all required fields are present
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || `${insertUser.username}@example.com`,
      name: insertUser.name || insertUser.username,
      profilePicture: insertUser.profilePicture || null,
      role: insertUser.role || "user",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUserCount(): Promise<number> {
    return this.users.size;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Verificar se o usuário existe
    const user = this.users.get(id);
    if (!user) return false;
    
    // Remover o usuário de todos os quadros em que é membro
    const boardMemberKeys = Array.from(this.boardMembers.keys())
      .filter(key => key.includes(`-${id}`));
      
    for (const key of boardMemberKeys) {
      this.boardMembers.delete(key);
    }
    
    // Remover o usuário de todos os cartões em que é membro
    const cardMemberKeys = Array.from(this.cardMembers.keys())
      .filter(key => key.includes(`-${id}`));
      
    for (const key of cardMemberKeys) {
      this.cardMembers.delete(key);
    }
    
    // Excluir comentários do usuário
    const userComments = Array.from(this.comments.values())
      .filter(comment => comment.userId === id);
      
    for (const comment of userComments) {
      this.comments.delete(comment.id);
    }
    
    // Remover o usuário
    return this.users.delete(id);
  }

  // Board methods
  async getBoards(): Promise<Board[]> {
    return Array.from(this.boards.values());
  }

  async getBoard(id: number): Promise<BoardWithCreator | undefined> {
    const board = this.boards.get(id);
    if (!board) return undefined;
    
    // Criar uma versão estendida do board com informações do usuário
    const boardWithCreator = board as BoardWithCreator;
    
    // Se o quadro tem um usuário como criador, busca o nome de usuário
    if (board.userId) {
      const user = this.users.get(board.userId);
      if (user) {
        boardWithCreator.username = user.username;
      }
    }
    
    return boardWithCreator;
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const id = this.boardIdCounter++;
    // Ensure userId is null if undefined
    const board: Board = { 
      ...insertBoard, 
      id, 
      userId: insertBoard.userId ?? null,
      createdAt: new Date()
    };
    this.boards.set(id, board);
    return board;
  }

  async updateBoard(id: number, boardUpdate: Partial<InsertBoard>): Promise<Board | undefined> {
    const board = this.boards.get(id);
    if (!board) return undefined;
    
    const updatedBoard = { ...board, ...boardUpdate };
    this.boards.set(id, updatedBoard);
    return updatedBoard;
  }

  async deleteBoard(id: number): Promise<boolean> {
    // Delete all associated lists and cards first
    const boardLists = Array.from(this.lists.values()).filter(list => list.boardId === id);
    
    for (const list of boardLists) {
      await this.deleteList(list.id);
    }
    
    return this.boards.delete(id);
  }
  
  async getBoardsForUser(userId: number): Promise<Board[]> {
    // Retorna quadros onde o usuário é o criador
    return Array.from(this.boards.values())
      .filter(board => board.userId === userId);
  }
  
  async getBoardsUserCanAccess(userId: number): Promise<Board[]> {
    // Obtém os quadros que o usuário criou
    const ownedBoards = await this.getBoardsForUser(userId);
    
    // Obtém os IDs dos quadros em que o usuário é membro
    const memberBoardIds = Array.from(this.boardMembers.values())
      .filter(bm => bm.userId === userId)
      .map(bm => bm.boardId);
    
    // Obtém os objetos de quadro para esses IDs
    const memberBoards = memberBoardIds
      .map(id => this.boards.get(id))
      .filter(Boolean) as Board[];
    
    // Combina os dois conjuntos de quadros, eliminando duplicatas
    const allBoardsMap = new Map<number, Board>();
    [...ownedBoards, ...memberBoards].forEach(board => {
      allBoardsMap.set(board.id, board);
    });
    
    return Array.from(allBoardsMap.values());
  }
  
  async getBoardMembers(boardId: number): Promise<UserWithBoardRole[]> {
    const boardMembers = Array.from(this.boardMembers.values())
      .filter(bm => bm.boardId === boardId);
      
    const memberIds = boardMembers.map(bm => bm.userId);
    
    // Obter os usuários e adicionar os papéis do quadro
    const users = memberIds.map(id => this.users.get(id)).filter(Boolean) as User[];
    
    // Converter para UserWithBoardRole e adicionar a função (role) de cada usuário no quadro
    return users.map(user => {
      // Encontrar o board member correspondente ao usuário
      const boardMember = boardMembers.find(bm => bm.userId === user.id);
      
      // Criar um UserWithBoardRole a partir do User
      const userWithRole = { ...user } as UserWithBoardRole;
      
      // Adicionar a função do boardMember ao objeto do usuário
      userWithRole.boardRole = boardMember ? boardMember.role : "viewer";
      
      return userWithRole;
    });
  }
  
  async getBoardMember(boardId: number, userId: number): Promise<BoardMember | undefined> {
    const key = `${boardId}-${userId}`;
    return this.boardMembers.get(key);
  }
  
  async addMemberToBoard(boardMember: InsertBoardMember): Promise<BoardMember> {
    const key = `${boardMember.boardId}-${boardMember.userId}`;
    
    // Verifica se a associação já existe
    const existingMember = Array.from(this.boardMembers.values())
      .find(bm => bm.boardId === boardMember.boardId && bm.userId === boardMember.userId);
      
    if (existingMember) {
      return existingMember;
    }
    
    // Cria uma nova associação de membro com quadro
    const newBoardMember: BoardMember = {
      boardId: Number(boardMember.boardId),
      userId: Number(boardMember.userId),
      role: boardMember.role || "viewer",
      createdAt: new Date()
    };
    
    this.boardMembers.set(key, newBoardMember);
    return newBoardMember;
  }
  
  async updateBoardMember(boardId: number, userId: number, role: string): Promise<BoardMember | undefined> {
    const key = `${boardId}-${userId}`;
    const boardMember = this.boardMembers.get(key);
    
    if (!boardMember) return undefined;
    
    const updatedBoardMember: BoardMember = {
      ...boardMember,
      role
    };
    
    this.boardMembers.set(key, updatedBoardMember);
    return updatedBoardMember;
  }
  
  async removeMemberFromBoard(boardId: number, userId: number): Promise<boolean> {
    const key = `${boardId}-${userId}`;
    return this.boardMembers.delete(key);
  }

  // List methods
  async getLists(boardId: number): Promise<List[]> {
    return Array.from(this.lists.values())
      .filter(list => list.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  }

  async getList(id: number): Promise<List | undefined> {
    return this.lists.get(id);
  }

  async createList(insertList: InsertList): Promise<List> {
    const id = this.listIdCounter++;
    // Ensure order has a default value if not provided
    const list: List = { 
      ...insertList, 
      id, 
      order: insertList.order ?? 0,
      createdAt: new Date()
    };
    this.lists.set(id, list);
    return list;
  }

  async updateList(id: number, listUpdate: Partial<InsertList>): Promise<List | undefined> {
    const list = this.lists.get(id);
    if (!list) return undefined;
    
    const updatedList = { ...list, ...listUpdate };
    this.lists.set(id, updatedList);
    return updatedList;
  }

  async deleteList(id: number): Promise<boolean> {
    // Delete all cards in this list first
    const listCards = Array.from(this.cards.values()).filter(card => card.listId === id);
    
    for (const card of listCards) {
      await this.deleteCard(card.id);
    }
    
    return this.lists.delete(id);
  }

  // Card methods
  async getCards(listId: number): Promise<Card[]> {
    return Array.from(this.cards.values())
      .filter(card => card.listId === listId)
      .sort((a, b) => a.order - b.order);
  }

  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const id = this.cardIdCounter++;
    // Ensure required fields have default values if not provided
    const card: Card = { 
      ...insertCard, 
      id, 
      order: insertCard.order ?? 0,
      description: insertCard.description ?? null,
      dueDate: insertCard.dueDate ?? null,
      createdAt: new Date()
    };
    this.cards.set(id, card);
    return card;
  }

  async updateCard(id: number, cardUpdate: Partial<InsertCard>): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;
    
    const updatedCard = { ...card, ...cardUpdate };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteCard(id: number): Promise<boolean> {
    // Delete all cardLabels associations for this card
    const cardLabelsList = Array.from(this.cardLabels.values()).filter(cl => cl.cardId === id);
    
    for (const cl of cardLabelsList) {
      this.cardLabels.delete(cl.id);
    }
    
    // Delete all checklists associated with this card
    const cardChecklists = Array.from(this.checklists.values()).filter(checklist => checklist.cardId === id);
    
    for (const checklist of cardChecklists) {
      await this.deleteChecklist(checklist.id);
    }
    
    // Delete all comments associated with this card
    const cardComments = Array.from(this.comments.values()).filter(comment => comment.cardId === id);
    
    for (const comment of cardComments) {
      await this.deleteComment(comment.id);
    }
    
    // Delete all member associations for this card
    const cardMemberKeys = Array.from(this.cardMembers.keys())
      .filter(key => key.startsWith(`${id}-`));
    
    for (const key of cardMemberKeys) {
      this.cardMembers.delete(key);
    }
    
    return this.cards.delete(id);
  }

  // Label methods
  async getLabels(boardId: number): Promise<Label[]> {
    return Array.from(this.labels.values())
      .filter(label => label.boardId === boardId);
  }

  async getLabel(id: number): Promise<Label | undefined> {
    return this.labels.get(id);
  }

  async createLabel(insertLabel: InsertLabel): Promise<Label> {
    const id = this.labelIdCounter++;
    const label: Label = { ...insertLabel, id };
    this.labels.set(id, label);
    return label;
  }

  // Card Label methods
  async getCardLabels(cardId: number): Promise<CardLabel[]> {
    return Array.from(this.cardLabels.values())
      .filter(cl => cl.cardId === cardId);
  }

  async addLabelToCard(insertCardLabel: InsertCardLabel): Promise<CardLabel> {
    const id = this.cardLabelIdCounter++;
    const cardLabel: CardLabel = { ...insertCardLabel, id };
    this.cardLabels.set(id, cardLabel);
    return cardLabel;
  }

  async removeLabelFromCard(cardId: number, labelId: number): Promise<boolean> {
    const cardLabel = Array.from(this.cardLabels.values())
      .find(cl => cl.cardId === cardId && cl.labelId === labelId);
    
    if (!cardLabel) return false;
    
    return this.cardLabels.delete(cardLabel.id);
  }

  // Comment methods
  async getComments(cardId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.cardId === cardId)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
        return 0;
      });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const createdAt = new Date();
    // Ensure required fields have default values if not provided
    const comment: Comment = { 
      ...insertComment, 
      id, 
      createdAt,
      userId: insertComment.userId ?? null,
      userName: insertComment.userName ?? "Anonymous"
    };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Card Member methods
  async getCardMembers(cardId: number): Promise<User[]> {
    const memberIds = Array.from(this.cardMembers.values())
      .filter(cm => cm.cardId === cardId)
      .map(cm => cm.userId);
      
    return memberIds.map(id => this.users.get(id)).filter(Boolean) as User[];
  }
  
  async addMemberToCard(cardMember: InsertCardMember): Promise<CardMember> {
    const key = `${cardMember.cardId}-${cardMember.userId}`;
    
    // Check if this association already exists
    const existingMember = Array.from(this.cardMembers.values())
      .find(cm => cm.cardId === cardMember.cardId && cm.userId === cardMember.userId);
      
    if (existingMember) {
      return existingMember;
    }
    
    // Cria uma nova instância do CardMember para garantir tipos corretos
    const newCardMember: CardMember = {
      cardId: Number(cardMember.cardId),
      userId: Number(cardMember.userId)
    };
    
    this.cardMembers.set(key, newCardMember);
    return newCardMember;
  }
  
  async removeMemberFromCard(cardId: number, userId: number): Promise<boolean> {
    const key = `${cardId}-${userId}`;
    return this.cardMembers.delete(key);
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Checklist methods
  async getChecklists(cardId: number): Promise<Checklist[]> {
    return Array.from(this.checklists.values())
      .filter(checklist => checklist.cardId === cardId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getChecklist(id: number): Promise<Checklist | undefined> {
    return this.checklists.get(id);
  }
  
  async createChecklist(insertChecklist: InsertChecklist): Promise<Checklist> {
    const id = this.checklistIdCounter++;
    const checklist: Checklist = { 
      ...insertChecklist, 
      id, 
      order: insertChecklist.order ?? 0
    };
    this.checklists.set(id, checklist);
    return checklist;
  }
  
  async updateChecklist(id: number, checklistUpdate: Partial<InsertChecklist>): Promise<Checklist | undefined> {
    const checklist = this.checklists.get(id);
    if (!checklist) return undefined;
    
    const updatedChecklist = { ...checklist, ...checklistUpdate };
    this.checklists.set(id, updatedChecklist);
    return updatedChecklist;
  }
  
  async deleteChecklist(id: number): Promise<boolean> {
    // Delete all items in this checklist first
    const checklistItems = Array.from(this.checklistItems.values())
      .filter(item => item.checklistId === id);
    
    for (const item of checklistItems) {
      await this.deleteChecklistItem(item.id);
    }
    
    return this.checklists.delete(id);
  }
  
  // Checklist Item methods
  async getChecklistItems(checklistId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values())
      .filter(item => item.checklistId === checklistId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    return this.checklistItems.get(id);
  }
  
  async createChecklistItem(insertItem: InsertChecklistItem): Promise<ChecklistItem> {
    const id = this.checklistItemIdCounter++;
    
    // Prepare explicit fields to fix type issues
    const item: ChecklistItem = { 
      id,
      content: insertItem.content,
      checklistId: insertItem.checklistId,
      order: insertItem.order ?? 0,
      completed: insertItem.completed ?? false,
      assignedToUserId: insertItem.assignedToUserId !== undefined ? insertItem.assignedToUserId : null,
      dueDate: insertItem.dueDate !== undefined ? insertItem.dueDate : null
    };
    
    this.checklistItems.set(id, item);
    return item;
  }
  
  async updateChecklistItem(id: number, itemUpdate: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const item = this.checklistItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemUpdate };
    this.checklistItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteChecklistItem(id: number): Promise<boolean> {
    return this.checklistItems.delete(id);
  }
}

import { DatabaseStorage } from './db-storage';
export const storage = new DatabaseStorage();
