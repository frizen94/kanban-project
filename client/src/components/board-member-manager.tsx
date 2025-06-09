import { useState, useEffect } from "react";
import { UserPlus, UserX, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface BoardMember {
  boardId: number;
  userId: number;
  role: string;
  createdAt: Date;
}

interface BoardMemberManagerProps {
  boardId: number;
}

export function BoardMemberManager({ boardId }: BoardMemberManagerProps) {
  const [open, setOpen] = useState(false);
  const [memberUsername, setMemberUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState("viewer");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: board } = useQuery({
    queryKey: ["/api/boards", boardId],
    queryFn: async () => {
      const response = await fetch(`/api/boards/${boardId}`);
      if (!response.ok) throw new Error("Falha ao carregar quadro");
      return response.json();
    },
    enabled: !!boardId
  });
  
  const { data: members = [] } = useQuery<User[]>({
    queryKey: ["/api/boards", boardId, "members"],
    queryFn: async () => {
      const response = await fetch(`/api/boards/${boardId}/members`);
      if (!response.ok) throw new Error("Falha ao carregar membros");
      return response.json();
    },
    enabled: !!boardId
  });
  
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Falha ao carregar usuários");
      return response.json();
    }
  });
  
  const isCreator = board && user && board.userId === user.id;
  const isAdmin = user && user.role === "admin";
  const hasEditRights = isCreator || isAdmin;
  
  // Retorna os usuários que ainda não são membros
  const nonMembers = allUsers.filter(
    u => !members.some(m => m.id === u.id) && u.id !== board?.userId
  );
  
  const addMemberMutation = useMutation({
    mutationFn: async (data: { boardId: number, userId: number, role: string }) => {
      const response = await apiRequest("POST", "/api/board-members", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao adicionar membro");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "members"] });
      toast({
        title: "Sucesso",
        description: "Membro adicionado com sucesso",
      });
      setMemberUsername("");
      setSelectedRole("viewer");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateMemberMutation = useMutation({
    mutationFn: async (data: { boardId: number, userId: number, role: string }) => {
      const response = await apiRequest("PATCH", `/api/boards/${data.boardId}/members/${data.userId}`, { role: data.role });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao atualizar membro");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "members"] });
      toast({
        title: "Sucesso",
        description: "Permissão do membro atualizada com sucesso",
      });
      setSelectedMemberId(null);
      setSelectedRole("viewer");
      setIsEditMode(false);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: async (data: { boardId: number, userId: number }) => {
      const response = await apiRequest("DELETE", `/api/boards/${data.boardId}/members/${data.userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao remover membro");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "members"] });
      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Manipulador para adicionar membro
  const handleAddMember = () => {
    // Encontrar o usuário pelo nome de usuário
    const userToAdd = nonMembers.find(u => u.username === memberUsername);
    
    if (!userToAdd) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado ou já é membro",
        variant: "destructive",
      });
      return;
    }
    
    addMemberMutation.mutate({
      boardId: boardId,
      userId: userToAdd.id,
      role: selectedRole
    });
  };
  
  // Manipulador para atualizar membro
  const handleUpdateMember = () => {
    if (!selectedMemberId || !selectedRole) return;
    
    updateMemberMutation.mutate({
      boardId: boardId,
      userId: selectedMemberId,
      role: selectedRole
    });
  };
  
  // Manipulador para remover membro
  const handleRemoveMember = (userId: number) => {
    removeMemberMutation.mutate({
      boardId: boardId,
      userId: userId
    });
  };
  
  // Função para preparar a edição de um membro
  const prepareEditMember = (userId: number, currentRole: string) => {
    setSelectedMemberId(userId);
    setSelectedRole(currentRole);
    setIsEditMode(true);
    setOpen(true);
  };
  
  // Resetar o estado quando o modal é fechado
  useEffect(() => {
    if (!open) {
      setMemberUsername("");
      setSelectedRole("viewer");
      setSelectedMemberId(null);
      setIsEditMode(false);
    }
  }, [open]);
  
  // Traduzir a função do usuário para português
  const translateRole = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "editor": return "Editor";
      case "viewer": return "Visualizador";
      default: return role;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Membros do Quadro</h3>
        {hasEditRights && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Editar Permissão do Membro" : "Adicionar Membro ao Quadro"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? "Altere a função do membro no quadro." 
                    : "Adicione um novo membro ao quadro e defina o nível de acesso."}
                </DialogDescription>
              </DialogHeader>
              
              {!isEditMode && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="username">Nome de usuário</label>
                    <Input
                      id="username"
                      value={memberUsername}
                      onChange={(e) => setMemberUsername(e.target.value)}
                      placeholder="Digite o nome de usuário"
                      list="users-list"
                    />
                    <datalist id="users-list">
                      {nonMembers.map((user) => (
                        <option key={user.id} value={user.username} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="role">Função no quadro</label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {isEditMode && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="role">Nova função no quadro</label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={isEditMode ? handleUpdateMember : handleAddMember}
                  disabled={
                    isEditMode 
                      ? !selectedMemberId || !selectedRole 
                      : !memberUsername || !selectedRole
                  }
                >
                  {isEditMode ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="border rounded-md divide-y">
        {board && (
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {board.username?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-medium">{board.username || "Usuário desconhecido"}</p>
                <p className="text-sm text-muted-foreground">Criador do Quadro</p>
              </div>
            </div>
          </div>
        )}
        
        {members.map((member) => {
          // Obter o perfil completo do membro se possível
          const memberProfile = allUsers.find(u => u.id === member.id);
          
          return (
            <div key={member.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-semibold">
                  {member.username?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-medium">{member.username || memberProfile?.username || "Usuário desconhecido"}</p>
                  <p className="text-sm text-muted-foreground">
                    {translateRole(member.role || "viewer")}
                  </p>
                </div>
              </div>
              
              {hasEditRights && (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => prepareEditMember(member.id, member.role || "viewer")}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <UserX className="h-4 w-4" />
                    <span className="sr-only">Remover</span>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        
        {members.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            Não há outros membros neste quadro.
          </div>
        )}
      </div>
    </div>
  );
}