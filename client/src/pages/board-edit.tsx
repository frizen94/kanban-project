import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";

interface Board {
  id: number;
  title: string;
  createdAt: string;
  userId: number | null;
}

export default function BoardEdit() {
  const { id } = useParams<{ id: string }>();
  const boardId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");

  // Buscar dados do quadro
  const { data: board, isLoading } = useQuery<Board>({
    queryKey: [`/api/boards/${boardId}`],
    enabled: !isNaN(boardId),
  });
  
  // Atualizar o título quando os dados do quadro são carregados
  useEffect(() => {
    if (board) {
      setTitle(board.title);
    }
  }, [board]);

  // Mutation para atualizar o quadro
  const { mutate: updateBoard, isPending } = useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await apiRequest("PATCH", `/api/boards/${boardId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quadro atualizado",
        description: "O quadro foi atualizado com sucesso.",
      });
      // Invalidar queries para recarregar os quadros
      queryClient.invalidateQueries({ queryKey: ['/api/user-boards'] });
      queryClient.invalidateQueries({ queryKey: [`/api/boards/${boardId}`] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o quadro: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "O título do quadro não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    updateBoard({ title });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-muted-foreground mb-2">
            Quadro não encontrado ou você não tem permissão para acessá-lo.
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Button onClick={() => navigate("/")} variant="outline" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para o Dashboard
      </Button>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Editar Quadro</CardTitle>
          <CardDescription>
            Modifique o título do seu quadro.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title"
                  placeholder="Título do quadro" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate("/")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}