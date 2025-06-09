import { useState } from "react";
import { useBoardContext } from "@/lib/board-context";
import { List } from "./list";
import { AddList } from "./add-list";
import { CardModal } from "./card-modal";
import { BoardHeader } from "./board-header";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";

interface BoardProps {
  boardId: number;
}

export function Board({ boardId }: BoardProps) {
  const { lists, moveCard, moveList, currentBoard } = useBoardContext();
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const openCardModal = (cardId: number) => {
    setActiveCardId(cardId);
    setIsCardModalOpen(true);
  };

  const closeCardModal = () => {
    setIsCardModalOpen(false);
    setActiveCardId(null);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // If there's no destination, the item was dropped outside a droppable area
    if (!destination) return;

    // If the item was dropped back where it started, no need to do anything
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Handle list reordering
    if (type === "LIST") {
      const listId = parseInt(draggableId.replace("list-", ""));
      moveList(listId, destination.index);
      return;
    }

    // Handle card reordering or moving between lists
    const cardId = parseInt(draggableId.replace("card-", ""));
    const sourceListId = parseInt(source.droppableId.replace("list-", ""));
    const destinationListId = parseInt(destination.droppableId.replace("list-", ""));

    moveCard(cardId, sourceListId, destinationListId, destination.index);
  };

  return (
    <>
      {currentBoard && <BoardHeader board={currentBoard} />}
      <main className="container mx-auto px-4 py-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="LIST">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="board-lists flex space-x-4 pb-6 pt-2 overflow-x-auto min-h-[calc(100vh-160px)] items-start"
              >
                {lists.map((list, index) => (
                  <List 
                    key={list.id} 
                    list={list} 
                    index={index}
                    openCardModal={openCardModal}
                  />
                ))}
                {provided.placeholder}
                <AddList boardId={boardId} />
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <CardModal 
          cardId={activeCardId} 
          isOpen={isCardModalOpen} 
          onClose={closeCardModal} 
        />
      </main>
    </>
  );
}
