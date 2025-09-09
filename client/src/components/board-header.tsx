import { Board } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { useBoardContext } from "@/lib/board-context";
import { BoardSettingsModal } from "@/components/board-settings-modal";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Users, Search, X, Eye, LayoutGrid, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardMemberManager } from "@/components/board-member-manager";
import { useQuery } from "@tanstack/react-query";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface BoardHeaderProps {
  board: Board;
  currentView: 'overview' | 'board';
  onViewChange: (view: 'overview' | 'board') => void;
}

export function BoardHeader({ board, currentView, onViewChange }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { updateList, setCardVisibilityFilter } = useBoardContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Atualiza o filtro de visibilidade de cartões quando a consulta de pesquisa muda
    setCardVisibilityFilter(searchQuery);
  }, [searchQuery, setCardVisibilityFilter]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditing(false);
    if (title.trim() !== board.title) {
      try {
        await fetch(`/api/boards/${board.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: title.trim() }),
        });
      } catch (error) {
        console.error("Error updating board title:", error);
        setTitle(board.title);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Chamando handleTitleBlur diretamente em vez de usar blur()
      handleTitleBlur();
    }
  };

  return (
    <div className="bg-[#0079BF]/90 text-white">
      <div className="container mx-auto px-4">
        {/* Header principal */}
        <div className="flex flex-wrap items-center justify-between py-2">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            {/* Botão de voltar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="hover:bg-white/20 text-white px-2 py-1"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="h-6 border-r border-white/30"></div>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                className="text-xl font-semibold bg-white/20 rounded px-2 py-1 outline-none"
                autoFocus
              />
            ) : (
              <h1 
                className="text-xl font-semibold cursor-pointer" 
                onClick={handleTitleClick}
              >
                {board.title}
              </h1>
            )}
            <button className="p-1.5 rounded hover:bg-white/20 text-white/80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <div className="h-6 border-r border-white/30"></div>
            <BoardSettingsModal board={board} onClose={() => {}} />
            <div className="h-6 border-r border-white/30"></div>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="rounded hover:bg-white/20 flex items-center gap-1.5 text-white px-2 py-1"
                >
                  <Users className="h-4 w-4" />
                  <span>Membros</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gerenciar Membros</DialogTitle>
                </DialogHeader>
                <BoardMemberManager boardId={board.id} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center space-x-2">
            {/* Campo de pesquisa */}
            {isSearchOpen ? (
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Pesquisar cartões..."
                  className="w-56 bg-white/20 border-white/30 text-white placeholder-white/60"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-white/70 hover:text-white" />
                  </button>
                )}
              </div>
            ) : (
              <Button 
                variant="ghost" 
                className="rounded hover:bg-white/20 flex items-center gap-1.5 text-white px-2 py-1"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>Pesquisar</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Abas de navegação */}
        <div className="border-t border-white/20">
          <div className="flex space-x-1">
            <button
              onClick={() => onViewChange('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentView === 'overview'
                  ? 'text-white border-b-2 border-white bg-white/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Eye className="h-4 w-4 mr-2 inline" />
              Visão geral
            </button>
            <button
              onClick={() => onViewChange('board')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentView === 'board'
                  ? 'text-white border-b-2 border-white bg-white/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutGrid className="h-4 w-4 mr-2 inline" />
              Quadro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
