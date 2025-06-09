import { useEffect, useState, FormEvent } from "react";
import { Card as CardType, List as ListType, Comment as CommentType, User } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { useAuth } from "@/hooks/use-auth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LabelManager } from "@/components/label-manager";
import { MemberManager } from "@/components/member-manager";
import { ChecklistManager } from "@/components/checklist-manager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CardModalProps {
  cardId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CardModal({ cardId, isOpen, onClose }: CardModalProps) {
  const { 
    cards, 
    lists, 
    comments,
    cardLabels,
    cardMembers,
    updateCard, 
    deleteCard,
    createCard,
    fetchComments,
    createComment,
    deleteComment,
    currentBoard
  } = useBoardContext();

  const { user } = useAuth();

  const [card, setCard] = useState<CardType | null>(null);
  const [list, setList] = useState<ListType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentUserName, setCommentUserName] = useState("");
  const [cardComments, setCardComments] = useState<CommentType[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // Set initial username from auth context
  useEffect(() => {
    if (user) {
      setCommentUserName(user.name || user.username);
    } else {
      setCommentUserName("Usuário");
    }
  }, [user]);

  useEffect(() => {
    if (cardId) {
      // Find the card and its list
      for (const [listId, listCards] of Object.entries(cards)) {
        const foundCard = listCards.find(c => c.id === cardId);
        if (foundCard) {
          setCard(foundCard);
          setTitle(foundCard.title);
          setDescription(foundCard.description || "");

          const foundList = lists.find(l => l.id === parseInt(listId));
          if (foundList) {
            setList(foundList);
          }

          // Load comments for this card
          loadComments(cardId);

          break;
        }
      }
    }
  }, [cardId, cards, lists]);

  // Load comments for a card
  const loadComments = async (cardId: number) => {
    try {
      const loadedComments = await fetchComments(cardId);
      setCardComments(loadedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  // Update cardComments when comments in context change
  useEffect(() => {
    if (cardId && comments[cardId]) {
      setCardComments(comments[cardId]);
    }
  }, [cardId, comments]);

  const handleTitleSave = async () => {
    if (!card) return;

    if (title.trim() !== card.title) {
      try {
        await updateCard(card.id, { title: title.trim() });
      } catch (error) {
        console.error("Error updating card title:", error);
        setTitle(card.title);
      }
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (!card) return;

    try {
      await updateCard(card.id, { description: description.trim() });
    } catch (error) {
      console.error("Error updating card description:", error);
      setDescription(card.description || "");
    }
    setIsEditingDescription(false);
  };

  const handleDeleteCard = async () => {
    if (!card) return;

    if (window.confirm("Tem certeza que deseja excluir este cartão?")) {
      try {
        await deleteCard(card.id);
        onClose();
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    }
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();

    if (!card || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await createComment(commentText.trim(), card.id, commentUserName);
      setCommentText("");
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!card) return;

    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
      try {
        await deleteComment(commentId, card.id);
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
  };

  // Função para verificar se um cartão está atrasado
  const isCardOverdue = (dueDate: string | Date | null): boolean => {
    if (!dueDate) return false;

    // Criar uma data com apenas ano, mês e dia (sem horas)
    const dueDateObj = new Date(dueDate);
    const today = new Date();

    // Remove a parte de tempo para comparar apenas as datas
    const dueDateTime = new Date(
      dueDateObj.getFullYear(), 
      dueDateObj.getMonth(), 
      dueDateObj.getDate()
    ).getTime();

    const todayTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();

    return dueDateTime < todayTime;
  };

  // Função para formatar a data sem o problema de fuso horário
  const formatDateBR = (date: string | Date): string => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Set the initial dueDate state when the card loads
  useEffect(() => {
    if (card && card.dueDate) {
      setDueDate(new Date(card.dueDate));
    } else {
      setDueDate(null);
    }
  }, [card]);

  const handleDueDateChange = async (newDueDate: Date | null) => {
    if (!card) return;

    try {
      // Se for nulo, removemos a data
      if (newDueDate === null) {
        await updateCard(card.id, { dueDate: null });
      } else {
        // Ajustar a data para meia-noite no fuso horário local
        const localDate = new Date(
          newDueDate.getFullYear(),
          newDueDate.getMonth(),
          newDueDate.getDate()
        );

        await updateCard(card.id, { dueDate: localDate.toISOString() });
      }
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  if (!card || !list) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#F9FAFC] max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          {/* Card header */}
          <DialogHeader className="flex justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                  <line x1="16" y1="8" x2="2" y2="22" />
                  <line x1="17.5" y1="15" x2="9" y2="15" />
                </svg>

                {isEditingTitle ? (
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={handleTitleSave}
                      className="text-xl font-semibold"
                      autoFocus
                    />
                  </div>
                ) : (
                  <DialogTitle 
                    className="text-xl font-semibold cursor-pointer" 
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {card.title}
                  </DialogTitle>
                )}
              </div>
              <p className="text-sm text-[#5E6C84]">
                na lista <a href="#" className="underline">{list.title}</a>
              </p>
            </div>
            <DialogClose className="p-2 text-[#5E6C84] hover:bg-[#091E420A] rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </DialogClose>
          </DialogHeader>

          {/* Main content area */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column (main content) */}
            <div className="flex-1">
              {/* Members */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-[#5E6C84] mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h3>Membros</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cardMembers[card.id]?.map(member => (
                    <div key={member.id} className="inline-flex items-center">
                      <Avatar className="h-8 w-8">
                        {member.profilePicture ? (
                          <AvatarImage src={member.profilePicture} alt={member.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                  <button 
                    className="px-3 py-1 rounded bg-[#091E420A] text-[#5E6C84] text-xs"
                    onClick={() => setIsMemberManagerOpen(true)}
                  >
                    + Adicionar membro
                  </button>
                </div>
              </div>

              {/* Labels */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-[#5E6C84] mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <h3>Etiquetas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cardLabels[card.id]?.map(label => (
                    <span 
                      key={label.id} 
                      className="px-3 py-1 rounded text-white text-xs"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                  <button 
                    className="px-3 py-1 rounded bg-[#091E420A] text-[#5E6C84] text-xs"
                    onClick={() => setIsLabelManagerOpen(true)}
                  >
                    + Adicionar etiqueta
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-[#5E6C84] mb-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="21" y1="10" x2="3" y2="10" />
                      <line x1="21" y1="6" x2="3" y2="6" />
                      <line x1="21" y1="14" x2="3" y2="14" />
                      <line x1="21" y1="18" x2="3" y2="18" />
                    </svg>
                    <h3>Descrição</h3>
                  </div>
                  {!isEditingDescription && (
                    <button 
                      className="px-2 py-1 rounded bg-[#091E420A] text-xs"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      Editar
                    </button>
                  )}
                </div>

                {isEditingDescription ? (
                  <div>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mb-2 min-h-[100px]"
                      placeholder="Adicione uma descrição mais detalhada..."
                      autoFocus
                    />
                    <Button 
                      onClick={handleDescriptionSave}
                      className="mr-2 bg-[#0079BF] hover:bg-[#026AA7]"
                    >
                      Salvar
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsEditingDescription(false);
                        setDescription(card.description || "");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="bg-white p-3 rounded border border-gray-200 cursor-pointer"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {card.description ? (
                      <p className="text-sm whitespace-pre-wrap">{card.description}</p>
                    ) : (
                      <p className="text-sm text-[#5E6C84] italic">Adicione uma descrição mais detalhada...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Checklists section */}
              {cardId && <ChecklistManager cardId={cardId} />}

              {/* Comments section */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-[#5E6C84] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <h3>Comentários</h3>
                </div>

                {/* Comment input form */}
                <div className="flex mb-4">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {commentUserName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <form onSubmit={handleSubmitComment}>
                      <div className="mb-2">
                        {user ? (
                          // Quando o usuário está logado, usamos o nome dele automaticamente
                          <div className="flex items-center mb-2 text-sm font-medium text-gray-700">
                            <span>Comentando como: {commentUserName}</span>
                          </div>
                        ) : (
                          // Se não estiver logado, permite editar o nome
                          <Input
                            type="text"
                            placeholder="Nome do usuário"
                            value={commentUserName}
                            onChange={(e) => setCommentUserName(e.target.value)}
                            className="mb-2"
                          />
                        )}
                        <Textarea
                          placeholder="Escreva um comentário..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="bg-[#0079BF] hover:bg-[#026AA7]"
                        disabled={isSubmittingComment || !commentText.trim()}
                      >
                        {isSubmittingComment ? "Enviando..." : "Enviar"}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Comments list */}
                <div className="space-y-4">
                  {cardComments.length > 0 ? (
                    cardComments.map((comment) => (
                      <div key={comment.id} className="flex">
                        <div className="flex-shrink-0 mr-3">
                          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                            {comment.userName ? comment.userName.charAt(0).toUpperCase() : "U"}
                          </div>
                        </div>
                        <div className="flex-grow bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">
                                {comment.userName || "Usuário"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                          <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column (actions) */}
            <div className="w-full md:w-48">
              <h3 className="text-xs font-medium text-[#5E6C84] mb-2">Adicionar ao cartão</h3>
              <div className="space-y-1.5 mb-6">
                <button 
                  className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={() => setIsMemberManagerOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Membros</span>
                </button>
                <button 
                  className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={() => setIsLabelManagerOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Etiquetas</span>
                </button>
                <button className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Checklist</span>
                </button>
                <button 
                  className={`w-full text-left py-1.5 px-3 text-sm rounded flex items-center ${card.dueDate ? 'bg-blue-50 text-blue-600' : 'text-[#172B4D] hover:bg-[#091E420A]'}`}
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${card.dueDate ? 'text-blue-600' : 'text-[#5E6C84]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className={isCardOverdue(card.dueDate) ? "text-red-600 font-medium" : ""}>
                    {card.dueDate 
                      ? `Prazo: ${formatDateBR(card.dueDate)}${isCardOverdue(card.dueDate) ? " (Atrasado)" : ""}`
                      : "Definir prazo"}
                  </span>
                </button>

                {isDatePickerOpen && (
                  <div className="p-3 mt-1 mb-2 bg-white rounded shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Data de vencimento</h4>
                    <div className="mb-2">
                      <Input
                        type="date"
                        value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setDueDate(null);
                            return;
                          }

                          const date = new Date(e.target.value + 'T12:00:00');
                          setDueDate(date);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDueDate(null);
                          handleDueDateChange(null);
                        }}
                        disabled={!card.dueDate}
                      >
                        Remover
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleDueDateChange(dueDate);
                          setIsDatePickerOpen(false);
                        }}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}
                <button className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span>Anexo</span>
                </button>
              </div>

              <h3 className="text-xs font-medium text-[#5E6C84] mb-2">Ações</h3>
              <div className="space-y-1.5 mb-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span>Mover para</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {lists.map((targetList) => (
                      <DropdownMenuItem
                        key={targetList.id}
                        onClick={() => {
                          if (targetList.id !== list.id) {
                            updateCard(card.id, { listId: targetList.id }).then(() => {
                              onClose();
                            });
                          }
                        }}
                      >
                        {targetList.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button 
                  className="w-full text-left py-1.5 px-3 text-[#172B4D] text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={() => {
                    // Criar uma cópia do cartão na mesma lista
                    const cardCopy = {
                      title: `${card.title} (Cópia)`,
                      description: card.description,
                      listId: card.listId,
                      dueDate: card.dueDate
                    };
                    
                    createCard(cardCopy, list.id).then(() => {
                      onClose();
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#5E6C84]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copiar</span>
                </button>
                <div className="border-b border-gray-200 my-1"></div>
                <button 
                  className="w-full text-left py-1.5 px-3 text-red-600 text-sm rounded hover:bg-[#091E420A] flex items-center"
                  onClick={handleDeleteCard}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Label Manager */}
      {card && currentBoard && (
        <LabelManager
          isOpen={isLabelManagerOpen}
          onClose={() => setIsLabelManagerOpen(false)}
          cardId={card.id}
          boardId={currentBoard.id}
        />
      )}

      {/* Member Manager */}
      {card && (
        <MemberManager
          isOpen={isMemberManagerOpen}
          onClose={() => setIsMemberManagerOpen(false)}
          cardId={card.id}
        />
      )}
    </Dialog>
  );
}