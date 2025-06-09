import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Pencil, Copy, Trash2, MoreHorizontal, Loader2, Search } from "lucide-react";
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

export default function Home() {
  const [boards, setBoards] = useState<Array<{ id: number; title: string }>>([]);
  const [filteredBoards, setFilteredBoards] = useState<Array<{ id: number; title: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    fetchBoards();
  }, []);
  
  // Efeito para filtrar os quadros com base na pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBoards(boards);
      return;
    }
    
    const filtered = boards.filter(board => 
      board.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBoards(filtered);
  }, [searchQuery, boards]);

  const fetchBoards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/boards");
      if (!response.ok) throw new Error("Falha ao buscar quadros");
      const data = await response.json();
      setBoards(data);
      setFilteredBoards(data);
    } catch (error) {
      console.error("Erro ao buscar quadros:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar quadros. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newBoardTitle.trim(),
        }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Falha ao criar quadro");
      
      const newBoard = await response.json();
      setBoards([...boards, newBoard]);
      setNewBoardTitle("");
      setIsCreating(false);
      
      toast({
        title: "Sucesso",
        description: "Quadro criado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar quadro:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar quadro. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const goToBoard = (boardId: number) => {
    navigate(`/board/${boardId}`);
  };
  
  const handleEditBoard = (boardId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/board/${boardId}/edit`);
  };
  
  const handleCopyBoard = async (boardId: number, boardTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCopying(true);
    
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${boardTitle} (Cópia)`,
        }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Falha ao copiar quadro");
      
      const newBoard = await response.json();
      setBoards([...boards, newBoard]);
      
      toast({
        title: "Sucesso",
        description: "Quadro copiado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao copiar quadro:", error);
      toast({
        title: "Erro",
        description: "Falha ao copiar quadro. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };
  
  const confirmDeleteBoard = (boardId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBoardToDelete(boardId);
  };
  
  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/boards/${boardToDelete}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) throw new Error("Falha ao excluir quadro");
      
      setBoards(boards.filter(board => board.id !== boardToDelete));
      
      toast({
        title: "Sucesso",
        description: "Quadro excluído com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao excluir quadro:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir quadro. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setBoardToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC]">
      {/* Diálogo de confirmação para exclusão de quadro */}
      <AlertDialog open={boardToDelete !== null} onOpenChange={() => setBoardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o quadro
              e todos os seus dados, incluindo listas e cartões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBoard}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Excluindo..." : "Excluir quadro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-8">
        {/* Barra de pesquisa */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Pesquisar quadros..."
            className="pl-10 h-11"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Mensagem quando nenhum quadro é encontrado */}
        {searchQuery && filteredBoards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum quadro encontrado para "{searchQuery}"</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Board cards */}
          {filteredBoards.map((board) => (
            <Card 
              key={board.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => goToBoard(board.id)}
            >
              <CardHeader className="bg-[#0079BF] text-white p-4 rounded-t-lg">
                <CardTitle className="text-lg">{board.title}</CardTitle>
              </CardHeader>
              <CardFooter className="p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => handleEditBoard(board.id, e)}
                      className="cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleCopyBoard(board.id, board.title, e)}
                      className="cursor-pointer"
                      disabled={isCopying}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      <span>{isCopying ? "Copiando..." : "Copiar"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => confirmDeleteBoard(board.id, e)}
                      className="cursor-pointer text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
          
          {/* Create new board card */}
          <Card>
            {isCreating ? (
              <CardContent className="p-4">
                <form onSubmit={handleCreateBoard}>
                  <Label htmlFor="boardTitle">Título do Quadro</Label>
                  <Input
                    id="boardTitle"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    className="mb-4 mt-1"
                    placeholder="Digite o título do quadro..."
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button type="submit" className="bg-[#0079BF] hover:bg-[#026AA7]">
                      Criar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNewBoardTitle("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            ) : (
              <CardContent 
                className="p-0 h-full cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsCreating(true)}
              >
                <div className="flex items-center justify-center h-full p-8 text-gray-500">
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mx-auto mb-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <p className="font-medium">Criar Novo Quadro</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
