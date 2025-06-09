import { useState, useEffect } from "react";
import { useBoardContext } from "@/lib/board-context";
import { Label } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: number;
  boardId: number;
}

// Lista de cores disponíveis para etiquetas
const LABEL_COLORS = [
  { name: "Verde", value: "#4CAF50" },
  { name: "Amarelo", value: "#FFC107" },
  { name: "Laranja", value: "#FF9800" },
  { name: "Vermelho", value: "#F44336" },
  { name: "Roxo", value: "#9C27B0" },
  { name: "Azul", value: "#2196F3" },
  { name: "Azul Claro", value: "#03A9F4" },
  { name: "Ciano", value: "#00BCD4" },
  { name: "Verde-água", value: "#009688" },
  { name: "Rosa", value: "#E91E63" }
];

export function LabelManager({ isOpen, onClose, cardId, boardId }: LabelManagerProps) {
  const { 
    labels, 
    cardLabels, 
    fetchLabels, 
    createLabel, 
    addLabelToCard, 
    removeLabelFromCard,
    fetchCardLabels
  } = useBoardContext();
  
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);
  const [currentCardLabels, setCurrentCardLabels] = useState<Label[]>([]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [view, setView] = useState<"list" | "create">("list");
  
  // Carregar etiquetas do quadro
  useEffect(() => {
    if (boardId && isOpen) {
      fetchLabels(boardId);
    }
  }, [boardId, isOpen, fetchLabels]);
  
  // Carregar etiquetas do cartão (se cardId for fornecido)
  useEffect(() => {
    if (cardId && isOpen) {
      const loadCardLabels = async () => {
        const fetchedLabels = await fetchCardLabels(cardId);
        setCurrentCardLabels(fetchedLabels);
      };
      
      loadCardLabels();
    }
  }, [cardId, isOpen, fetchCardLabels]);
  
  // Atualizar labels do cartão quando cardLabels mudar
  useEffect(() => {
    if (cardId && cardLabels[cardId]) {
      setCurrentCardLabels(cardLabels[cardId]);
    }
  }, [cardId, cardLabels]);
  
  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !selectedColor) return;
    
    setIsCreatingLabel(true);
    try {
      await createLabel(newLabelName.trim(), selectedColor, boardId);
      setNewLabelName("");
      setSelectedColor(LABEL_COLORS[0].value);
      setView("list");
    } catch (error) {
      console.error("Error creating label:", error);
    } finally {
      setIsCreatingLabel(false);
    }
  };
  
  const toggleLabelOnCard = async (label: Label) => {
    if (!cardId) return;
    
    const isLabelApplied = currentCardLabels.some(l => l.id === label.id);
    
    try {
      if (isLabelApplied) {
        await removeLabelFromCard(cardId, label.id);
      } else {
        await addLabelToCard(cardId, label.id);
      }
    } catch (error) {
      console.error("Error toggling label on card:", error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === "list" ? "Etiquetas" : "Criar etiqueta"}
          </DialogTitle>
        </DialogHeader>
        
        {view === "list" ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {cardId ? "Selecione etiquetas para adicionar a este cartão:" : "Etiquetas disponíveis neste quadro:"}
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {labels.length > 0 ? (
                  labels.map(label => (
                    <div 
                      key={label.id} 
                      className="flex items-center p-2 rounded hover:bg-gray-50"
                    >
                      <div 
                        className="w-10 h-6 rounded mr-2"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-grow text-sm">{label.name}</span>
                      
                      {cardId && (
                        <Button
                          variant={currentCardLabels.some(l => l.id === label.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleLabelOnCard(label)}
                        >
                          {currentCardLabels.some(l => l.id === label.id) ? "Remover" : "Adicionar"}
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma etiqueta criada ainda.
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => setView("create")}
            >
              Criar nova etiqueta
            </Button>
          </>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da etiqueta
              </label>
              <Input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Digite o nome da etiqueta"
                className="mb-3"
              />
              
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {LABEL_COLORS.map(color => (
                  <div
                    key={color.value}
                    className={`w-full h-8 rounded cursor-pointer ${selectedColor === color.value ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setView("list")}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim() || isCreatingLabel}
              >
                {isCreatingLabel ? "Criando..." : "Criar etiqueta"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}