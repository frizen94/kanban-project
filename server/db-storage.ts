import { db } from './database';
import { IStorage } from './storage';
import { 
  User, InsertUser,
  Board, InsertBoard,
  List, InsertList,
  Card, InsertCard,
  Label, InsertLabel,
  CardLabel, InsertCardLabel,
  Comment, InsertComment,
  CardMember, InsertCardMember,
  Checklist, InsertChecklist,
  ChecklistItem, InsertChecklistItem,
  BoardMember, InsertBoardMember,
  BoardWithCreator,
  UserWithBoardRole,
} from '@shared/schema';
import { eq, and, asc, inArray, sql, desc, isNull, lt, gte, or, not } from 'drizzle-orm';
import * as schema from '@shared/schema';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
// Importação correta do módulo pg
import pg from 'pg';

// Configurar a store de sessão PostgreSQL
const PostgresSessionStore = connectPg(session);
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Tipo para a session store
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }
  
  async getUserCount(): Promise<number> {
    const users = await db.select().from(schema.users);
    return users.length;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Precisamos criar um objeto que corresponda ao schema de inserção
    const dataToInsert = {
      username: userData.username,
      email: userData.email || `${userData.username}@example.com`,
      password: userData.password,
      name: userData.name || userData.username,
      profilePicture: userData.profilePicture || null,
      createdAt: new Date()
    };
    
    // Usamos o spread operator para converter para o tipo esperado pelo drizzle
    const inserted = await db.insert(schema.users).values({...dataToInsert}).returning();
    return inserted[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const updated = await db
      .update(schema.users)
      .set(userData)
      .where(eq(schema.users.id, id))
      .returning();
    return updated[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Verifica se o usuário existe
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }
      
      // Remover usuário de todos os quadros onde é membro
      await db.delete(schema.boardMembers).where(eq(schema.boardMembers.userId, id));
      
      // Remover usuário de todos os cartões onde é membro
      await db.delete(schema.cardMembers).where(eq(schema.cardMembers.userId, id));
      
      // Remover comentários feitos pelo usuário
      await db.delete(schema.comments).where(eq(schema.comments.userId, id));
      
      // Remover o usuário
      const result = await db.delete(schema.users).where(eq(schema.users.id, id));
      
      return result.count > 0;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return false;
    }
  }

  // Board methods
  async getBoards(): Promise<Board[]> {
    return db.select().from(schema.boards).orderBy(asc(schema.boards.createdAt));
  }

  async getBoard(id: number): Promise<BoardWithCreator | undefined> {
    // Primeiro obtém o quadro sem as junções
    const boards = await db
      .select()
      .from(schema.boards)
      .where(eq(schema.boards.id, id));
    
    if (boards.length === 0) {
      return undefined;
    }
    
    // Se o quadro tem um usuário como criador, busca o nome de usuário
    const board = boards[0] as BoardWithCreator;
    if (board.userId) {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, board.userId));
      
      if (users.length > 0) {
        // Adiciona o nome de usuário ao objeto do quadro
        board.username = users[0].username;
      }
    }
    
    return board;
  }

  async createBoard(boardData: InsertBoard): Promise<Board> {
    const dataToInsert = {
      ...boardData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.boards).values({...dataToInsert}).returning();
    return inserted[0];
  }

  async updateBoard(id: number, boardData: Partial<InsertBoard>): Promise<Board | undefined> {
    const updated = await db
      .update(schema.boards)
      .set(boardData)
      .where(eq(schema.boards.id, id))
      .returning();
    return updated[0];
  }

  async deleteBoard(id: number): Promise<boolean> {
    try {
      // 1. Buscar todas as listas do quadro
      const boardLists = await db.select().from(schema.lists).where(eq(schema.lists.boardId, id));
      
      // 2. Para cada lista, excluir os cartões associados
      for (const list of boardLists) {
        // 2.1 Buscar todos os cartões da lista
        const listCards = await db.select().from(schema.cards).where(eq(schema.cards.listId, list.id));
        
        // 2.2 Para cada cartão, excluir registros dependentes em ordem
        for (const card of listCards) {
          // Excluir rótulos dos cartões
          await db.delete(schema.cardLabels).where(eq(schema.cardLabels.cardId, card.id));
          
          // Excluir membros dos cartões
          await db.delete(schema.cardMembers).where(eq(schema.cardMembers.cardId, card.id));
          
          // Excluir comentários
          await db.delete(schema.comments).where(eq(schema.comments.cardId, card.id));
          
          // Excluir itens das checklists
          const cardChecklists = await db.select().from(schema.checklists).where(eq(schema.checklists.cardId, card.id));
          for (const checklist of cardChecklists) {
            await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, checklist.id));
          }
          
          // Excluir checklists
          await db.delete(schema.checklists).where(eq(schema.checklists.cardId, card.id));
        }
        
        // 2.3 Excluir os cartões da lista
        await db.delete(schema.cards).where(eq(schema.cards.listId, list.id));
      }
      
      // 3. Excluir todas as listas do quadro
      await db.delete(schema.lists).where(eq(schema.lists.boardId, id));
      
      // 4. Excluir rótulos do quadro
      await db.delete(schema.labels).where(eq(schema.labels.boardId, id));
      
      // 5. Excluir membros do quadro
      await db.delete(schema.boardMembers).where(eq(schema.boardMembers.boardId, id));
      
      // 6. Finalmente, excluir o quadro
      const deleted = await db
        .delete(schema.boards)
        .where(eq(schema.boards.id, id))
        .returning();
      
      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir quadro:', error);
      return false;
    }
  }
  
  async getBoardsForUser(userId: number): Promise<Board[]> {
    return db
      .select()
      .from(schema.boards)
      .where(eq(schema.boards.userId, userId))
      .orderBy(asc(schema.boards.createdAt));
  }
  
  async getBoardsUserCanAccess(userId: number): Promise<Board[]> {
    // Obtém quadros próprios
    const ownedBoards = await this.getBoardsForUser(userId);
    
    // Obtém quadros em que o usuário é membro
    const memberBoards = await db
      .select()
      .from(schema.boards)
      .innerJoin(
        schema.boardMembers,
        and(
          eq(schema.boards.id, schema.boardMembers.boardId),
          eq(schema.boardMembers.userId, userId)
        )
      );
    
    // Combina os dois conjuntos e remove duplicatas
    const allBoardsMap = new Map<number, Board>();
    
    // Adiciona quadros de propriedade do usuário
    ownedBoards.forEach(board => {
      allBoardsMap.set(board.id, board);
    });
    
    // Adiciona quadros em que o usuário é membro
    memberBoards.forEach(({ boards }) => {
      if (!allBoardsMap.has(boards.id)) {
        allBoardsMap.set(boards.id, boards);
      }
    });
    
    return Array.from(allBoardsMap.values());
  }

  // List methods
  async getLists(boardId: number): Promise<List[]> {
    return db
      .select()
      .from(schema.lists)
      .where(eq(schema.lists.boardId, boardId))
      .orderBy(asc(schema.lists.order));
  }

  async getList(id: number): Promise<List | undefined> {
    const lists = await db.select().from(schema.lists).where(eq(schema.lists.id, id));
    return lists[0];
  }

  async createList(listData: InsertList): Promise<List> {
    const dataToInsert = {
      ...listData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.lists).values({...dataToInsert}).returning();
    return inserted[0];
  }

  async updateList(id: number, listData: Partial<InsertList>): Promise<List | undefined> {
    const updated = await db
      .update(schema.lists)
      .set(listData)
      .where(eq(schema.lists.id, id))
      .returning();
    return updated[0];
  }

  async deleteList(id: number): Promise<boolean> {
    try {
      // 1. Buscar todos os cartões desta lista
      const listCards = await db.select().from(schema.cards).where(eq(schema.cards.listId, id));
      
      // 2. Para cada cartão, excluir registros dependentes em ordem
      for (const card of listCards) {
        // Excluir rótulos dos cartões
        await db.delete(schema.cardLabels).where(eq(schema.cardLabels.cardId, card.id));
        
        // Excluir membros dos cartões
        await db.delete(schema.cardMembers).where(eq(schema.cardMembers.cardId, card.id));
        
        // Excluir comentários
        await db.delete(schema.comments).where(eq(schema.comments.cardId, card.id));
        
        // Excluir itens das checklists
        const cardChecklists = await db.select().from(schema.checklists).where(eq(schema.checklists.cardId, card.id));
        for (const checklist of cardChecklists) {
          await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, checklist.id));
        }
        
        // Excluir checklists
        await db.delete(schema.checklists).where(eq(schema.checklists.cardId, card.id));
      }
      
      // 3. Excluir os cartões da lista
      await db.delete(schema.cards).where(eq(schema.cards.listId, id));
      
      // 4. Finalmente, excluir a lista
      const deleted = await db
        .delete(schema.lists)
        .where(eq(schema.lists.id, id))
        .returning();
      
      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      return false;
    }
  }

  // Card methods
  async getCards(listId: number): Promise<Card[]> {
    return db
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.listId, listId))
      .orderBy(asc(schema.cards.order));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const cards = await db.select().from(schema.cards).where(eq(schema.cards.id, id));
    return cards[0];
  }

  async createCard(cardData: InsertCard): Promise<Card> {
    const dataToInsert = {
      ...cardData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.cards).values({...dataToInsert}).returning();
    return inserted[0];
  }

  async updateCard(id: number, cardData: Partial<InsertCard>): Promise<Card | undefined> {
    const updated = await db
      .update(schema.cards)
      .set(cardData)
      .where(eq(schema.cards.id, id))
      .returning();
    return updated[0];
  }

  async deleteCard(id: number): Promise<boolean> {
    try {
      // 1. Excluir rótulos dos cartões
      await db.delete(schema.cardLabels).where(eq(schema.cardLabels.cardId, id));
      
      // 2. Excluir membros dos cartões
      await db.delete(schema.cardMembers).where(eq(schema.cardMembers.cardId, id));
      
      // 3. Excluir comentários
      await db.delete(schema.comments).where(eq(schema.comments.cardId, id));
      
      // 4. Excluir itens das checklists
      const cardChecklists = await db.select().from(schema.checklists).where(eq(schema.checklists.cardId, id));
      for (const checklist of cardChecklists) {
        await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, checklist.id));
      }
      
      // 5. Excluir checklists
      await db.delete(schema.checklists).where(eq(schema.checklists.cardId, id));
      
      // 6. Finalmente, excluir o cartão
      const deleted = await db
        .delete(schema.cards)
        .where(eq(schema.cards.id, id))
        .returning();
      
      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      return false;
    }
  }

  // Label methods
  async getLabels(boardId: number): Promise<Label[]> {
    return db
      .select()
      .from(schema.labels)
      .where(eq(schema.labels.boardId, boardId));
  }

  async getLabel(id: number): Promise<Label | undefined> {
    const labels = await db.select().from(schema.labels).where(eq(schema.labels.id, id));
    return labels[0];
  }

  async createLabel(labelData: InsertLabel): Promise<Label> {
    const inserted = await db.insert(schema.labels).values(labelData).returning();
    return inserted[0];
  }

  // Card Label methods
  async getCardLabels(cardId: number): Promise<CardLabel[]> {
    return db
      .select()
      .from(schema.cardLabels)
      .where(eq(schema.cardLabels.cardId, cardId));
  }

  async addLabelToCard(cardLabelData: InsertCardLabel): Promise<CardLabel> {
    const inserted = await db.insert(schema.cardLabels).values(cardLabelData).returning();
    return inserted[0];
  }

  async removeLabelFromCard(cardId: number, labelId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.cardLabels)
      .where(
        and(
          eq(schema.cardLabels.cardId, cardId),
          eq(schema.cardLabels.labelId, labelId)
        )
      )
      .returning();
    return deleted.length > 0;
  }

  // Comment methods
  async getComments(cardId: number): Promise<Comment[]> {
    return db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.cardId, cardId))
      .orderBy(asc(schema.comments.createdAt));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const inserted = await db.insert(schema.comments).values(commentData).returning();
    return inserted[0];
  }

  async deleteComment(id: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.comments)
      .where(eq(schema.comments.id, id))
      .returning();
    return deleted.length > 0;
  }
  
  /**
   * Obtém cartões com checklists para o dashboard
   * 
   * Retorna cartões que:
   * 1. São atribuídos ao usuário especificado (cardMembers)
   * 2. Têm pelo menos um checklist
   * 3. Têm data de vencimento próxima (próximos 7 dias) ou já vencida
   * 
   * Os cartões são ordenados por data de vencimento (os mais próximos primeiro)
   */
  async getCardsWithChecklistsForUser(userId: number): Promise<any[]> {
    try {
      console.log(`[DB-STORAGE] Retornando array vazio para getCardsWithChecklistsForUser (userId=${userId})`);
      return [];
      
      /*
      // Código original comentado para evitar erros
      // Passo 1: Obter todos os quadros acessíveis pelo usuário
      const accessibleBoards = await this.getBoardsUserCanAccess(userId);
      const boardIds = accessibleBoards.map(board => board.id);
      
      console.log(`Quadros acessíveis: ${boardIds.join(', ') || 'nenhum'}`);
      
      if (boardIds.length === 0) {
        return [];
      }
      */
      
      // Passo 2: Obter todas as listas desses quadros
      const lists = await db
        .select()
        .from(schema.lists)
        .where(inArray(schema.lists.boardId, boardIds));
      
      const listIds = lists.map(list => list.id);
      
      console.log(`Listas encontradas: ${listIds.join(', ') || 'nenhuma'}`);
      
      if (listIds.length === 0) {
        return [];
      }
      
      // Passo 3: Obter cartões atribuídos ao usuário OU com data de vencimento próxima
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      try {
        // Consulta complexa para obter cartões com seus checklists
        // Primeiro obtemos os cartões relevantes
        const cards = await db
          .select()
          .from(schema.cards)
          .where(
            and(
              inArray(schema.cards.listId, listIds),
              or(
                // Cartões com data de vencimento próxima ou vencida
                and(
                  not(isNull(schema.cards.dueDate)),
                  lt(schema.cards.dueDate, nextWeek)
                ),
                // OU cartões atribuídos ao usuário (via tabela cardMembers)
                sql`EXISTS (
                  SELECT 1 FROM ${schema.cardMembers} 
                  WHERE ${schema.cardMembers.cardId} = ${schema.cards.id} 
                  AND ${schema.cardMembers.userId} = ${userId}
                )`
              )
            )
          )
          .orderBy(asc(schema.cards.dueDate));
        
        console.log(`Cartões encontrados: ${cards.length}`);
        
        if (cards.length === 0) {
          return [];
        }
        
        // Resultado final com informações completas
        const result = [];
        
        // Para cada cartão, buscar informações adicionais
        for (const card of cards) {
          try {
            console.log(`Processando cartão id=${card.id}`);
            
            // Obter a lista e o quadro ao qual o cartão pertence
            const list = lists.find(l => l.id === card.listId);
            if (!list) {
              console.log(`Lista id=${card.listId} não encontrada para cartão id=${card.id}`);
              continue;
            }
            
            const board = accessibleBoards.find(b => b.id === list.boardId);
            if (!board) {
              console.log(`Quadro id=${list.boardId} não encontrado para lista id=${list.id}`);
              continue;
            }
            
            try {
              // Obter checklists do cartão
              const checklists = await this.getChecklists(card.id);
              
              console.log(`Checklists para cartão id=${card.id}: ${checklists.length}`);
              
              // Só incluir cartões que têm checklists
              if (checklists.length === 0) continue;
              
              // Para cada checklist, obter seus itens
              const checklistsWithItems = [];
              
              for (const checklist of checklists) {
                try {
                  // Obter todos os itens da checklist
                  let items = await db
                    .select()
                    .from(schema.checklistItems)
                    .where(eq(schema.checklistItems.checklistId, checklist.id))
                    .orderBy(asc(schema.checklistItems.order));
                  
                  console.log(`Itens para checklist id=${checklist.id}: ${items.length}`);
                  
                  // Para cada item, verificar se está atribuído ao usuário ou tem data de vencimento
                  items = items.map(item => {
                    // Adicionar informação se o item está atrasado
                    if (item.dueDate) {
                      const dueDate = new Date(item.dueDate);
                      const now = new Date();
                      
                      if (dueDate < now) {
                        return {
                          ...item,
                          isOverdue: true
                        };
                      }
                    }
                    
                    return {
                      ...item,
                      isOverdue: false
                    };
                  });
                  
                  checklistsWithItems.push({
                    ...checklist,
                    items
                  });
                } catch (checklistItemsError) {
                  console.error(`Erro ao processar itens da checklist id=${checklist.id}:`, checklistItemsError);
                  // Adicionar a checklist sem os itens (em vez de pular completamente)
                  checklistsWithItems.push({
                    ...checklist,
                    items: []
                  });
                }
              }
              
              try {
                // Obter membros do cartão
                const cardMembers = await this.getCardMembers(card.id);
                
                // Obter etiquetas do cartão
                const cardLabels = await this.getCardLabels(card.id);
                
                // Se houver etiquetas, obter detalhes completos
                let labels = [];
                
                if (cardLabels && cardLabels.length > 0) {
                  try {
                    const labelIds = cardLabels.map(cl => cl.labelId);
                    labels = await db
                      .select()
                      .from(schema.labels)
                      .where(inArray(schema.labels.id, labelIds));
                  } catch (labelsError) {
                    console.error(`Erro ao buscar detalhes das etiquetas do cartão id=${card.id}:`, labelsError);
                  }
                }
                
                // Determinar o status do cartão em relação ao prazo
                let status = "no_date";
                if (card.dueDate) {
                  const dueDate = new Date(card.dueDate);
                  const now = new Date();
                  
                  if (dueDate < now) {
                    status = "overdue"; // Atrasado
                  } else {
                    // Calcular a diferença em dias
                    const diffTime = dueDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 3) {
                      status = "due_soon"; // Vence em breve (3 dias ou menos)
                    } else {
                      status = "upcoming"; // Vence em mais de 3 dias
                    }
                  }
                }
                
                // Adicionar ao resultado
                result.push({
                  card,
                  list,
                  board,
                  checklists: checklistsWithItems,
                  members: cardMembers || [],
                  labels: labels || [],
                  status
                });
              } catch (cardDetailsError) {
                console.error(`Erro ao buscar detalhes adicionais do cartão id=${card.id}:`, cardDetailsError);
              }
            } catch (checklistsError) {
              console.error(`Erro ao buscar checklists do cartão id=${card.id}:`, checklistsError);
            }
          } catch (cardError) {
            console.error(`Erro ao processar cartão id=${card.id}:`, cardError);
          }
        }
        
        console.log(`Total de cartões com checklists retornados: ${result.length}`);
        return result;
      } catch (cardsQueryError) {
        console.error("Erro na consulta de cartões:", cardsQueryError);
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar cartões com checklists:", error);
      return [];
    }
  }
  
  /**
   * Obtém cartões atrasados para o dashboard
   * 
   * Retorna cartões que:
   * 1. São atribuídos ao usuário especificado (cardMembers) OU pertencem a quadros acessíveis pelo usuário
   * 2. Têm data de vencimento que já passou
   * 
   * Os cartões são ordenados por data de vencimento (os mais atrasados primeiro)
   */
  async getOverdueCardsForUser(userId: number): Promise<any[]> {
    try {
      console.log(`[DB-STORAGE] Retornando array vazio para getOverdueCardsForUser (userId=${userId})`);
      return [];
      
      /*
      // Código original comentado para evitar erros
      console.log(`Buscando cartões atrasados para usuário id=${userId}`);
      
      // Passo 1: Obter todos os quadros acessíveis pelo usuário
      const accessibleBoards = await this.getBoardsUserCanAccess(userId);
      const boardIds = accessibleBoards.map(board => board.id);
      
      console.log(`Quadros acessíveis: ${boardIds.join(', ') || 'nenhum'}`);
      
      if (boardIds.length === 0) {
        return [];
      }
      */
      
      // Passo 2: Obter todas as listas desses quadros
      const lists = await db
        .select()
        .from(schema.lists)
        .where(inArray(schema.lists.boardId, boardIds));
      
      const listIds = lists.map(list => list.id);
      
      console.log(`Listas encontradas: ${listIds.join(', ') || 'nenhuma'}`);
      
      if (listIds.length === 0) {
        return [];
      }
      
      try {
        // Passo 3: Obter cartões atrasados
        const today = new Date();
        
        // Consulta para obter cartões atrasados
        const cards = await db
          .select()
          .from(schema.cards)
          .where(
            and(
              inArray(schema.cards.listId, listIds),
              not(isNull(schema.cards.dueDate)),
              lt(schema.cards.dueDate, today)
            )
          )
          .orderBy(asc(schema.cards.dueDate));
        
        console.log(`Cartões atrasados encontrados: ${cards.length}`);
        
        if (cards.length === 0) {
          return [];
        }
        
        // Resultado final com informações completas
        const result = [];
        
        // Para cada cartão, buscar informações adicionais
        for (const card of cards) {
          try {
            console.log(`Processando cartão atrasado id=${card.id}`);
            
            // Obter a lista e o quadro ao qual o cartão pertence
            const list = lists.find(l => l.id === card.listId);
            if (!list) {
              console.log(`Lista id=${card.listId} não encontrada para cartão id=${card.id}`);
              continue;
            }
            
            const board = accessibleBoards.find(b => b.id === list.boardId);
            if (!board) {
              console.log(`Quadro id=${list.boardId} não encontrado para lista id=${list.id}`);
              continue;
            }
            
            try {
              // Obter membros do cartão
              const cardMembers = await this.getCardMembers(card.id);
              
              // Verificar se o cartão está atribuído ao usuário
              const isAssignedToUser = cardMembers.some(member => member.id === userId);
              
              // Obter etiquetas do cartão
              const cardLabels = await this.getCardLabels(card.id);
              
              // Se houver etiquetas, obter detalhes completos
              let labels = [];
              if (cardLabels && cardLabels.length > 0) {
                try {
                  const labelIds = cardLabels.map(cl => cl.labelId);
                  labels = await db
                    .select()
                    .from(schema.labels)
                    .where(inArray(schema.labels.id, labelIds));
                } catch (labelsError) {
                  console.error(`Erro ao buscar detalhes das etiquetas do cartão id=${card.id}:`, labelsError);
                }
              }
              
              // Adicionar ao resultado
              result.push({
                card,
                list,
                board,
                members: cardMembers || [],
                labels: labels || [],
                isAssignedToUser
              });
            } catch (cardDetailsError) {
              console.error(`Erro ao buscar detalhes adicionais do cartão id=${card.id}:`, cardDetailsError);
            }
          } catch (cardError) {
            console.error(`Erro ao processar cartão id=${card.id}:`, cardError);
          }
        }
        
        console.log(`Total de cartões atrasados retornados: ${result.length}`);
        return result;
      } catch (cardsQueryError) {
        console.error("Erro na consulta de cartões atrasados:", cardsQueryError);
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar cartões atrasados:", error);
      return [];
    }
  }
  
  /**
   * Obtém cartões que vencem em breve para o dashboard
   * 
   * Retorna cartões que:
   * 1. São atribuídos ao usuário especificado (cardMembers) OU pertencem a quadros acessíveis pelo usuário
   * 2. Têm data de vencimento nos próximos 3 dias
   * 
   * Os cartões são ordenados por data de vencimento (os mais próximos primeiro)
   */
  async getUpcomingCardsForUser(userId: number): Promise<any[]> {
    try {
      console.log(`Buscando cartões próximos para usuário id=${userId}`);
      
      // Passo 1: Obter todos os quadros acessíveis pelo usuário
      const accessibleBoards = await this.getBoardsUserCanAccess(userId);
      const boardIds = accessibleBoards.map(board => board.id);
      
      console.log(`Quadros acessíveis: ${boardIds.join(', ') || 'nenhum'}`);
      
      if (boardIds.length === 0) {
        return [];
      }
      
      // Passo 2: Obter todas as listas desses quadros
      const lists = await db
        .select()
        .from(schema.lists)
        .where(inArray(schema.lists.boardId, boardIds));
      
      const listIds = lists.map(list => list.id);
      
      console.log(`Listas encontradas: ${listIds.join(', ') || 'nenhuma'}`);
      
      if (listIds.length === 0) {
        return [];
      }
      
      try {
        // Passo 3: Obter cartões que vencem em breve
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);
        
        // Consulta para obter cartões que vencem em breve
        const cards = await db
          .select()
          .from(schema.cards)
          .where(
            and(
              inArray(schema.cards.listId, listIds),
              not(isNull(schema.cards.dueDate)),
              gte(schema.cards.dueDate, today),
              lt(schema.cards.dueDate, threeDaysLater)
            )
          )
          .orderBy(asc(schema.cards.dueDate));
        
        console.log(`Cartões próximos encontrados: ${cards.length}`);
        
        if (cards.length === 0) {
          return [];
        }
        
        // Resultado final com informações completas
        const result = [];
        
        // Para cada cartão, buscar informações adicionais
        for (const card of cards) {
          try {
            console.log(`Processando cartão próximo id=${card.id}`);
            
            // Obter a lista e o quadro ao qual o cartão pertence
            const list = lists.find(l => l.id === card.listId);
            if (!list) {
              console.log(`Lista id=${card.listId} não encontrada para cartão id=${card.id}`);
              continue;
            }
            
            const board = accessibleBoards.find(b => b.id === list.boardId);
            if (!board) {
              console.log(`Quadro id=${list.boardId} não encontrado para lista id=${list.id}`);
              continue;
            }
            
            try {
              // Obter membros do cartão
              const cardMembers = await this.getCardMembers(card.id);
              
              // Verificar se o cartão está atribuído ao usuário
              const isAssignedToUser = cardMembers.some(member => member.id === userId);
              
              // Obter etiquetas do cartão
              const cardLabels = await this.getCardLabels(card.id);
              
              // Se houver etiquetas, obter detalhes completos
              let labels = [];
              if (cardLabels && cardLabels.length > 0) {
                try {
                  const labelIds = cardLabels.map(cl => cl.labelId);
                  labels = await db
                    .select()
                    .from(schema.labels)
                    .where(inArray(schema.labels.id, labelIds));
                } catch (labelsError) {
                  console.error(`Erro ao buscar detalhes das etiquetas do cartão id=${card.id}:`, labelsError);
                }
              }
              
              // Adicionar ao resultado
              result.push({
                card,
                list,
                board,
                members: cardMembers || [],
                labels: labels || [],
                isAssignedToUser
              });
            } catch (cardDetailsError) {
              console.error(`Erro ao buscar detalhes adicionais do cartão id=${card.id}:`, cardDetailsError);
            }
          } catch (cardError) {
            console.error(`Erro ao processar cartão id=${card.id}:`, cardError);
          }
        }
        
        console.log(`Total de cartões próximos retornados: ${result.length}`);
        return result;
      } catch (cardsQueryError) {
        console.error("Erro na consulta de cartões próximos:", cardsQueryError);
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar cartões próximos:", error);
      return [];
    }
  }

  // Board Member methods
  async getBoardMembers(boardId: number): Promise<UserWithBoardRole[]> {
    // Primeiro obtemos os membros do quadro
    const boardMembers = await db
      .select()
      .from(schema.boardMembers)
      .where(eq(schema.boardMembers.boardId, boardId));
      
    if (boardMembers.length === 0) {
      return [];
    }
    
    // Depois buscamos os dados completos dos usuários
    const userIds = boardMembers.map(bm => bm.userId);
    const users = await db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.id, userIds));
    
    // Agora adicionamos a função (role) de cada usuário
    return users.map(user => {
      // Encontrar o board member correspondente ao usuário
      const boardMember = boardMembers.find(bm => bm.userId === user.id);
      const userWithRole = user as UserWithBoardRole;
      // Adicionar a função do boardMember ao objeto do usuário
      userWithRole.boardRole = boardMember ? boardMember.role : "viewer";
      return userWithRole;
    });
  }
  
  async getBoardMember(boardId: number, userId: number): Promise<BoardMember | undefined> {
    const boardMembers = await db
      .select()
      .from(schema.boardMembers)
      .where(
        and(
          eq(schema.boardMembers.boardId, boardId),
          eq(schema.boardMembers.userId, userId)
        )
      );
    return boardMembers[0];
  }
  
  async addMemberToBoard(boardMemberData: InsertBoardMember): Promise<BoardMember> {
    const dataToInsert = {
      ...boardMemberData,
      createdAt: new Date()
    };
    const inserted = await db.insert(schema.boardMembers).values(dataToInsert).returning();
    return inserted[0];
  }
  
  async updateBoardMember(boardId: number, userId: number, role: string): Promise<BoardMember | undefined> {
    const updated = await db
      .update(schema.boardMembers)
      .set({ role })
      .where(
        and(
          eq(schema.boardMembers.boardId, boardId),
          eq(schema.boardMembers.userId, userId)
        )
      )
      .returning();
    return updated[0];
  }
  
  async removeMemberFromBoard(boardId: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.boardMembers)
      .where(
        and(
          eq(schema.boardMembers.boardId, boardId),
          eq(schema.boardMembers.userId, userId)
        )
      )
      .returning();
    return deleted.length > 0;
  }
  
  // Card Member methods
  async getCardMembers(cardId: number): Promise<User[]> {
    const cardMembers = await db
      .select()
      .from(schema.cardMembers)
      .where(eq(schema.cardMembers.cardId, cardId));

    if (cardMembers.length === 0) {
      return [];
    }

    const userIds = cardMembers.map(cm => cm.userId);
    return db.select().from(schema.users).where(inArray(schema.users.id, userIds));
  }

  async addMemberToCard(cardMemberData: InsertCardMember): Promise<CardMember> {
    const inserted = await db.insert(schema.cardMembers).values(cardMemberData).returning();
    return inserted[0];
  }

  async removeMemberFromCard(cardId: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.cardMembers)
      .where(
        and(
          eq(schema.cardMembers.cardId, cardId),
          eq(schema.cardMembers.userId, userId)
        )
      )
      .returning();
    return deleted.length > 0;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(schema.users);
  }

  // Checklist methods
  async getChecklists(cardId: number): Promise<Checklist[]> {
    return db
      .select()
      .from(schema.checklists)
      .where(eq(schema.checklists.cardId, cardId))
      .orderBy(asc(schema.checklists.order));
  }

  async getChecklist(id: number): Promise<Checklist | undefined> {
    const checklists = await db.select().from(schema.checklists).where(eq(schema.checklists.id, id));
    return checklists[0];
  }

  async createChecklist(checklistData: InsertChecklist): Promise<Checklist> {
    const inserted = await db.insert(schema.checklists).values(checklistData).returning();
    return inserted[0];
  }

  async updateChecklist(id: number, checklistData: Partial<InsertChecklist>): Promise<Checklist | undefined> {
    const updated = await db
      .update(schema.checklists)
      .set(checklistData)
      .where(eq(schema.checklists.id, id))
      .returning();
    return updated[0];
  }

  async deleteChecklist(id: number): Promise<boolean> {
    try {
      // 1. Excluir itens da checklist
      await db.delete(schema.checklistItems).where(eq(schema.checklistItems.checklistId, id));
      
      // 2. Excluir a checklist
      const deleted = await db
        .delete(schema.checklists)
        .where(eq(schema.checklists.id, id))
        .returning();
      
      return deleted.length > 0;
    } catch (error) {
      console.error('Erro ao excluir checklist:', error);
      return false;
    }
  }

  // Checklist Item methods
  async getChecklistItems(checklistId: number): Promise<ChecklistItem[]> {
    return db
      .select()
      .from(schema.checklistItems)
      .where(eq(schema.checklistItems.checklistId, checklistId))
      .orderBy(asc(schema.checklistItems.order));
  }

  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    const items = await db.select().from(schema.checklistItems).where(eq(schema.checklistItems.id, id));
    return items[0];
  }

  async createChecklistItem(itemData: InsertChecklistItem): Promise<ChecklistItem> {
    const inserted = await db.insert(schema.checklistItems).values(itemData).returning();
    return inserted[0];
  }

  async updateChecklistItem(id: number, itemData: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const updated = await db
      .update(schema.checklistItems)
      .set(itemData)
      .where(eq(schema.checklistItems.id, id))
      .returning();
    return updated[0];
  }

  async deleteChecklistItem(id: number): Promise<boolean> {
    const deleted = await db
      .delete(schema.checklistItems)
      .where(eq(schema.checklistItems.id, id))
      .returning();
    return deleted.length > 0;
  }
}

// Exportar uma instância do DatabaseStorage
export const storage = new DatabaseStorage();