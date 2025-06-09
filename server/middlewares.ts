import { Request, Response, NextFunction } from "express";
import { storage as appStorage } from "./db-storage";

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
}

// Middleware para verificar se o usuário é administrador
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role.toUpperCase() === "ADMIN") {
    return next();
  }
  res.status(403).json({ message: "Permissão negada. É necessário ser administrador." });
}

// Middleware para verificar se o usuário é proprietário do quadro ou administrador
export function isBoardOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Implementar lógica para verificar se o usuário é proprietário do quadro ou admin
  // Esta lógica depende dos detalhes específicos da sua aplicação
  next();
}

// Middleware para verificar se o usuário tem acesso ao cartão (como membro do cartão ou membro do quadro ou admin)
export async function hasCardAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    const cardId = parseInt(req.params.cardId);
    if (isNaN(cardId)) {
      return res.status(400).json({ message: "ID do cartão inválido" });
    }
    
    // Se for admin, permitir acesso
    if (req.user.role && req.user.role.toUpperCase() === "ADMIN") {
      return next();
    }
    
    // Buscar o cartão
    const card = await appStorage.getCard(cardId);
    if (!card) {
      return res.status(404).json({ message: "Cartão não encontrado" });
    }
    
    // Buscar a lista e o quadro do cartão
    const list = await appStorage.getList(card.listId);
    if (!list) {
      return res.status(404).json({ message: "Lista não encontrada" });
    }
    
    // Verificar se o usuário é dono do quadro
    const board = await appStorage.getBoard(list.boardId);
    if (board && board.userId === req.user.id) {
      return next();
    }
    
    // Verificar se o usuário é membro do quadro
    const boardMember = await appStorage.getBoardMember(list.boardId, req.user.id);
    if (boardMember) {
      return next();
    }
    
    // Verificar se o usuário é membro do cartão
    const cardMembers = await appStorage.getCardMembers(cardId);
    const isCardMember = cardMembers.some((member: any) => member.id === req.user?.id);
    
    if (isCardMember) {
      return next();
    }
    
    return res.status(403).json({ message: "Você não tem permissão para acessar este cartão" });
  } catch (error) {
    console.error("Erro ao verificar acesso ao cartão:", error);
    return res.status(500).json({ message: "Erro ao verificar permissões de acesso" });
  }
}