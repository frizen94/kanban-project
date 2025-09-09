import { useState, useRef, useEffect } from "react";
import { List as ListType } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { Card } from "./card";
import { AddCard } from "./add-card";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Copy, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListProps {
  list: ListType;
  index: number;
  openCardModal: (cardId: number) => void;
}

export function List({ list, index, openCardModal }: ListProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const { visibleCards, updateList, deleteList, createList } = useBoardContext();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (title.trim() !== list.title) {
      try {
        await updateList(list.id, { title: title.trim() });
      } catch (error) {
        console.error("Error updating list title:", error);
        setTitle(list.title);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleEditList = () => {
    setIsEditingTitle(true);
  };

  const handleCopyList = async () => {
    setIsCopying(true);
    try {
      await createList(`${list.title} (Cópia)`, list.boardId);
    } catch (error) {
      console.error("Erro ao copiar lista:", error);
    } finally {
      setIsCopying(false);
    }
  };

  const confirmDeleteList = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteList = async () => {
    setIsDeleting(true);
    try {
      await deleteList(list.id);
    } catch (error) {
      console.error("Erro ao excluir lista:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="board-list min-w-[280px] max-w-[320px] flex flex-col max-h-full"
        >
          <div className="p-4 flex items-center justify-between cursor-grab active:cursor-grabbing" {...provided.dragHandleProps}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                className="input-enhanced font-bold text-base px-3 py-2 flex-grow outline-none"
                placeholder="Nome da lista"
              />
            ) : (
              <h3
                className="font-bold text-base px-3 py-2 flex-grow cursor-pointer hover:text-primary transition-smooth truncate"
                onClick={handleTitleClick}
                title={list.title}
              >
                {list.title}
              </h3>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 h-auto transition-smooth hover:bg-white/10 hover:scale-110">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong border-white/10 shadow-strong">
                <DropdownMenuItem 
                  onClick={handleEditList}
                  className="cursor-pointer focus:bg-white/5 transition-fast"
                >
                  <Pencil className="mr-3 h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm">Editar Lista</div>
                    <div className="text-xs text-muted-foreground">Alterar título</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleCopyList}
                  className="cursor-pointer focus:bg-white/5 transition-fast"
                  disabled={isCopying}
                >
                  {isCopying ? (
                    <>
                      <Loader2 className="mr-3 h-4 w-4 animate-spin text-primary" />
                      <div>
                        <div className="text-sm">Copiando...</div>
                        <div className="text-xs text-muted-foreground">Aguarde</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-3 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">Copiar Lista</div>
                        <div className="text-xs text-muted-foreground">Duplicar com cartões</div>
                      </div>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={confirmDeleteList}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 transition-fast"
                >
                  <Trash2 className="mr-3 h-4 w-4" />
                  <div>
                    <div className="text-sm">Excluir Lista</div>
                    <div className="text-xs opacity-75">Ação irreversível</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Diálogo de confirmação para exclusão de lista */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a lista "{list.title}"
                  e todos os seus cartões.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteList}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isDeleting ? "Excluindo..." : "Excluir Lista"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Droppable droppableId={`list-${list.id}`} type="CARD">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`list-cards flex-grow px-4 pb-4 overflow-y-auto transition-smooth ${snapshot.isDraggingOver ? 'bg-white/5 backdrop-blur-sm border-dashed border-2 border-primary/30 rounded-lg' : ''}`}
              >
                {visibleCards[list.id]?.map((card, cardIndex) => (
                  <Card 
                    key={card.id} 
                    card={card} 
                    index={cardIndex}
                    openCardModal={openCardModal}
                  />
                ))}
                {provided.placeholder}
                <AddCard listId={list.id} />
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}
