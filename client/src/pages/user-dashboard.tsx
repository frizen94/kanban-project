import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Clock, AlertCircle, Check, ListChecks } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Interfaces para tipagem
interface Board {
  id: number;
  title: string;
  createdAt: string;
  userId: number | null;
}

interface OverdueCard {
  id: number;
  title: string;
  dueDate: string;
  listName: string;
  boardName: string;
  boardId: number;
}

interface ChecklistItem {
  id: number;
  content: string;
  dueDate: string | null;
  assignedToUserId: number | null;
  completed: boolean;
}

interface ChecklistCard {
  id: number;
  title: string;
  dueDate: string | null;
  listName: string;
  boardId: number;
  boardName: string;
  checklistTitle: string;
  checklistId: number;
  totalItems: number;
  completedItems: number;
  overdueItems?: ChecklistItem[];
  items?: ChecklistItem[];
}

interface UserDashboardStats {
  totalBoards: number;
  totalCards: number;
  completedCards: number;
  overdueCards: number;
  completionRate: number;
}

// Componente de contagem de estatísticas
const StatCard = ({ title, value, icon, description }: { title: string; value: number | string; icon: React.ReactNode; description?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default function UserDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Consultar estatísticas do usuário
  const statsQuery = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  // Consultar quadros do usuário
  const boardsQuery = useQuery({
    queryKey: ["/api/user-boards"],
  });
  
  // Consultar cartões atrasados - versão simplificada para minimizar erros
  const overdueCardsQuery = useQuery({
    queryKey: ["/api/cards/overdue-dashboard"],
  });
  
  // Consultar cartões com checklists - versão simplificada para minimizar erros
  const checklistCardsQuery = useQuery({
    queryKey: ["/api/cards/checklists-dashboard"],
  });

  // Função para navegar para um quadro
  const goToBoard = (boardId: number) => {
    navigate(`/board/${boardId}`);
  };

  // Função para navegar para um cartão (futura implementação)
  const goToCard = (boardId: number, cardId: number) => {
    navigate(`/board/${boardId}?card=${cardId}`);
  };

  // Verificar status de carregamento das consultas essenciais
  if (statsQuery.isLoading || boardsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  // Se houve erro crítico nas consultas essenciais
  if (statsQuery.isError || boardsQuery.isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground">Erro ao carregar dashboard.</p>
          <p className="text-sm text-muted-foreground mt-1">
            O banco de dados pode estar inativo. Tente novamente em alguns minutos.
          </p>
        </div>
      </div>
    );
  }

  // Tratar dados com type assertion e valores padrão
  const stats = (statsQuery.data as UserDashboardStats) || {
    totalBoards: 0,
    totalCards: 0,
    completedCards: 0,
    overdueCards: 0,
    completionRate: 0
  };
  
  const boards = (boardsQuery.data as Board[]) || [];
  const overdueCards = (overdueCardsQuery.data as OverdueCard[]) || [];
  const checklistCards = (checklistCardsQuery.data as ChecklistCard[]) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Meu Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total de Quadros" 
          value={stats.totalBoards || 0} 
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="Total de Cartões" 
          value={stats.totalCards || 0} 
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="Cartões Concluídos" 
          value={stats.completedCards || 0} 
          icon={<Check className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="Cartões Atrasados" 
          value={stats.overdueCards || 0} 
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />} 
          description={stats.overdueCards ? "Requer atenção imediata" : "Nenhum cartão atrasado"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card className="col-span-6 md:col-span-3">
          <CardHeader>
            <CardTitle>Taxa de Conclusão</CardTitle>
            <CardDescription>Progresso geral das suas tarefas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={stats.completionRate || 0} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <div>{stats.completionRate || 0}% concluído</div>
                <div>{stats.completedCards || 0} de {stats.totalCards || 0} cartões</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-6 md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Meus Quadros</CardTitle>
            <CardDescription>Quadros a que você tem acesso</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {boards && boards.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-2">
                {boards.map((board: Board) => (
                  <div 
                    key={board.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => goToBoard(board.id)}
                  >
                    <div className="font-medium">{board.title}</div>
                    <Badge variant="outline">
                      {new Date(board.createdAt).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum quadro disponível
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              Ver Todos os Quadros
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarefas Atrasadas</CardTitle>
          <CardDescription>Cartões com prazo vencido que requerem atenção</CardDescription>
        </CardHeader>
        <CardContent>
          {overdueCards && overdueCards.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {overdueCards.map((card: OverdueCard) => (
                <div 
                  key={card.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => goToCard(card.boardId, card.id)}
                >
                  <div className="space-y-1">
                    <div className="font-medium">{card.title}</div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{card.boardName}</span>
                      <span>•</span>
                      <span>{card.listName}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="destructive" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Vencido em {formatDate(card.dueDate)}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Não há tarefas atrasadas. Parabéns!
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklists e Progresso</CardTitle>
          <CardDescription>Acompanhamento de tarefas com checklists ativos</CardDescription>
        </CardHeader>
        <CardContent>
          {checklistCards && checklistCards.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {checklistCards.map((card: ChecklistCard) => (
                <div 
                  key={`${card.id}-${card.checklistId}`}
                  className="flex flex-col p-3 border rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => goToCard(card.boardId, card.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-medium">{card.title}</div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{card.boardName}</span>
                        <span>•</span>
                        <span>{card.listName}</span>
                      </div>
                    </div>
                    {card.dueDate && (
                      <Badge variant={new Date(card.dueDate) < new Date() ? "destructive" : "outline"} className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDate(card.dueDate)}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm flex items-center">
                        <ListChecks className="h-4 w-4 mr-2" />
                        {card.checklistTitle}
                      </div>
                      <Badge variant="secondary">
                        {card.completedItems} / {card.totalItems}
                      </Badge>
                    </div>
                    <Progress 
                      value={card.totalItems > 0 ? (card.completedItems / card.totalItems) * 100 : 0} 
                      className="h-2" 
                    />
                    
                    {card.overdueItems && card.overdueItems.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-semibold text-destructive flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Itens atrasados:
                        </div>
                        <div className="space-y-1 pl-1">
                          {card.overdueItems.map(item => (
                            <div key={item.id} className="text-xs flex items-start">
                              <div className="mr-2 mt-0.5">•</div>
                              <div className="flex-1">
                                <span className="text-destructive">{item.content}</span>
                                {item.dueDate && (
                                  <span className="ml-2 text-muted-foreground">
                                    (vencido em {formatDate(item.dueDate)})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Não há cartões com checklists ativos.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}