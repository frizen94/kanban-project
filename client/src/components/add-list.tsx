import { useState } from "react";
import { useBoardContext } from "@/lib/board-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddListProps {
  boardId: number;
}

export function AddList({ boardId }: AddListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const { createList } = useBoardContext();

  const handleAddList = () => {
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setTitle("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      try {
        await createList(title.trim(), boardId);
        setTitle("");
        setIsAdding(false);
      } catch (error) {
        console.error("Erro ao criar lista:", error);
      }
    }
  };

  if (isAdding) {
    return (
      <div className="min-w-[272px] bg-[#EBECF0] rounded-md p-2">
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Digite o título da lista..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2"
            autoFocus
          />
          <div className="flex items-center">
            <Button type="submit" className="mr-2 bg-[#0079BF] hover:bg-[#026AA7]">
              Adicionar Lista
            </Button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 rounded hover:bg-[#091E420A]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-w-[272px]">
      <button 
        onClick={handleAddList}
        className="bg-white/20 hover:bg-white/30 rounded-md text-sm p-2.5 flex items-center text-[#172B4D] w-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Adicionar outra lista</span>
      </button>
    </div>
  );
}
