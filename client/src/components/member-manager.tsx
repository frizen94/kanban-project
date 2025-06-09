import { useState, useEffect } from "react";
import { User } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Check, UserPlus } from "lucide-react";

interface MemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: number;
}

export function MemberManager({ isOpen, onClose, cardId }: MemberManagerProps) {
  const { users, cardMembers, fetchUsers, fetchCardMembers, addMemberToCard, removeMemberFromCard } = useBoardContext();
  const [isLoading, setIsLoading] = useState(false);
  
  // Carregamos todos os usuários e membros do cartão quando o modal é aberto
  useEffect(() => {
    if (isOpen && cardId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Carrega todos os usuários do sistema
          await fetchUsers();
          // Carrega os membros do cartão atual
          await fetchCardMembers(cardId);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  // Removendo fetchUsers e fetchCardMembers das dependências para evitar loop infinito
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cardId]);
  
  // Função para verificar se um usuário é membro do cartão
  const isMember = (userId: number): boolean => {
    if (!cardId) return false;
    const members = cardMembers[cardId] || [];
    const result = members.some(member => member.id === userId);
    console.log(`Verificando se userId ${userId} é membro: ${result}`, members);
    return result;
  };
  
  // Função para alternar a atribuição do usuário ao cartão
  const toggleMember = async (userId: number) => {
    if (!cardId) return;
    
    try {
      setIsLoading(true);
      if (isMember(userId)) {
        await removeMemberFromCard(cardId, userId);
      } else {
        await addMemberToCard(cardId, userId);
      }
      // Recarregar membros do cartão para atualizar a interface
      await fetchCardMembers(cardId);
    } catch (error) {
      console.error("Erro ao atualizar membro:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Membros do Cartão</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
            {users.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {user.profilePicture ? (
                          <AvatarImage src={user.profilePicture} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      variant={isMember(user.id) ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => toggleMember(user.id)}
                    >
                      {isMember(user.id) ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          <span className="sr-only md:not-sr-only md:inline-block">Remover</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          <span className="sr-only md:not-sr-only md:inline-block">Adicionar</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}