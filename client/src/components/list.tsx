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
          className="list min-w-[272px] bg-[#EBECF0] rounded-md shadow-sm flex flex-col max-h-full"
        >
          <div className="p-2 flex items-center justify-between" {...provided.dragHandleProps}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                className="font-medium text-sm px-2 py-1 flex-grow bg-white rounded border border-[#0079BF] outline-none"
              />
            ) : (
              <h3
                className="font-medium text-sm px-2 py-1 flex-grow cursor-pointer"
                onClick={handleTitleClick}
              >
                {list.title}
              </h3>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  <MoreHorizontal className="h-4 w-4 text-[#5E6C84]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleEditList}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleCopyList}
                  className="cursor-pointer"
                  disabled={isCopying}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span>{isCopying ? "Copiando..." : "Copiar"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={confirmDeleteList}
                  className="cursor-pointer text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
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
                className={`list-cards flex-grow px-1 pb-0.5 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-[#E3E5E8]' : ''}`}
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
