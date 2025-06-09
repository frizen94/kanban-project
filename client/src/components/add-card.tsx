import { useState } from "react";
import { useBoardContext } from "@/lib/board-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AddCardProps {
  listId: number;
}

export function AddCard({ listId }: AddCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const { createCard } = useBoardContext();

  const handleAddCard = () => {
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
        await createCard(title.trim(), listId);
        setTitle("");
        setIsAdding(false);
      } catch (error) {
        console.error("Erro ao criar cartão:", error);
      }
    }
  };

  if (isAdding) {
    return (
      <div className="px-1 pb-2">
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="Digite um título para este cartão..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2 min-h-[60px] text-sm"
            autoFocus
          />
          <div className="flex items-center">
            <Button type="submit" className="mr-2 bg-[#0079BF] hover:bg-[#026AA7]">
              Adicionar Cartão
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
    <button
      onClick={handleAddCard}
      className="flex items-center text-[#5E6C84] text-sm w-full p-2 rounded hover:bg-[#091E420A]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>Adicionar um cartão</span>
    </button>
  );
}
