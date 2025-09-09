import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Loader2, BarChart3, Users, Layers, Clock, PlusCircle, AlertCircle, 
  ListFilter, Activity, CheckCircle, CircleDashed, ListChecks 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, 
  Area, RadialBarChart, RadialBar
} from "recharts";

// Interfaces para tipagem
interface Board {
  id: number;
  title: string;
  createdAt: string;
  userId: number | null;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  profilePicture: string | null;
}

interface OverdueCard {
  id: number;
  title: string;
  dueDate: string;
  listName: string;
  boardName: string;
  boardId: number;
}

interface DashboardStats {
  totalBoards: number;
  totalCards: number;
  completedCards: number;
  overdueCards: number;
  completionRate: number;
  totalUsers: number;
}

// Componente de contagem de estatísticas
const StatCard = ({ title, value, icon, description }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  description?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de item atrasado
const OverdueItem = ({ title, dueDate, listName, boardName, boardId }: {
  title: string;
  dueDate: string;
  listName: string;
  boardName?: string;
  boardId?: number;
}) => {
  const [, navigate] = useLocation();
  
  const handleClick = () => {
    if (boardId) {
      navigate(`/board/${boardId}`);
    }
  };
  
  return (
    <div 
      className="flex items-center justify-between p-2 border-b last:border-0 hover:bg-secondary/20 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="font-medium">{title}</span>
        </div>
        {boardName && (
          <span className="text-xs text-muted-foreground ml-6">
            Quadro: {boardName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          {listName}
        </Badge>
        <span className="text-xs text-destructive">
          {new Date(dueDate).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
};

// Componente de usuário para administradores
const UserItem = ({ user, isAdmin = false }: {
  user: User;
  isAdmin?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between p-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        {user.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user.name.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      </div>
      <div>
        {isAdmin ? (
          <Badge className="bg-primary">Admin</Badge>
        ) : (
          <Badge variant="outline">Usuário</Badge>
        )}
      </div>
    </div>
  );
};

// Componente de quadro no dashboard
const BoardItem = ({ board }: { board: Board }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { mutate: createBoard } = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/boards", { title });
      return await res.json();
    },
    onSuccess: (newBoard: Board) => {
      toast({
        title: "Quadro copiado",
        description: "O quadro foi copiado com sucesso.",
      });
      // Recarregar os quadros
      queryClient.invalidateQueries({ queryKey: ['/api/user-boards'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o quadro.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: deleteBoard } = useMutation({
    mutationFn: async (boardId: number) => {
      await apiRequest("DELETE", `/api/boards/${boardId}`);
    },
    onSuccess: () => {
      toast({
        title: "Quadro excluído",
        description: "O quadro foi excluído com sucesso.",
      });
      // Recarregar os quadros
      queryClient.invalidateQueries({ queryKey: ['/api/user-boards'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o quadro.",
        variant: "destructive",
      });
    },
  });

  const handleBoardClick = () => {
    navigate(`/board/${board.id}`);
  };
  
  const handleEditBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/board/${board.id}/edit`);
  };
  
  const handleCopyBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    createBoard(`${board.title} (Cópia)`);
  };
  
  const handleDeleteBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.")) {
      deleteBoard(board.id);
    }
  };
  
  return (
    <div 
      className="p-4 border rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors relative"
      onClick={handleBoardClick}
    >
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuItem onClick={handleEditBoard}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyBoard}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copiar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteBoard} className="text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h3 className="font-semibold text-lg pr-8">{board.title}</h3>
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-muted-foreground">
          {new Date(board.createdAt).toLocaleDateString("pt-BR")}
        </div>
        <Button variant="ghost" size="sm">
          Abrir
        </Button>
      </div>
    </div>
  )
};

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Buscar estatísticas do dashboard
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });

  // Buscar quadros do usuário
  const { data: boards, isLoading: isLoadingBoards } = useQuery<Board[]>({
    queryKey: ['/api/user-boards'],
    enabled: !!user,
  });

  // Buscar usuários (somente para admin)
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user && user.role === 'admin',
  });

  // Buscar tarefas com prazo vencido
  const { data: overdueCards, isLoading: isLoadingOverdue } = useQuery<OverdueCard[]>({
    queryKey: ['/api/cards/overdue'],
    enabled: !!user,
  });

  const goToCreateBoard = () => {
    navigate("/board/new");
  };

  // Contadores para estatísticas
  const totalBoards = stats?.totalBoards || 0;
  const totalOverdue = stats?.overdueCards || 0;
  const totalUsers = stats?.totalUsers || 0;
  const completionRate = stats?.completionRate || 0;

  // Componentes para gráficos
  const TaskCompletionRadialChart = ({ completionRate }: { completionRate: number }) => {
    const data = [
      { name: 'Concluído', value: completionRate, fill: '#F59E0B' }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Taxa de Conclusão</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="80%" 
                barSize={10} 
                data={data}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="chart-label">
                  <tspan x="50%" dy="-0.5em" fontSize="26" fontWeight="bold" fill="#000">
                    {completionRate}%
                  </tspan>
                  <tspan x="50%" dy="1.5em" fontSize="12" fill="#666">
                    Taxa de Conclusão
                  </tspan>
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskOverdueRadialChart = ({ stats }: { stats: DashboardStats }) => {
    const overduePercentage = stats?.totalCards > 0 
      ? Math.round((stats.overdueCards / stats.totalCards) * 100) 
      : 0;
    
    const data = [
      { name: 'Atrasadas', value: overduePercentage, fill: '#EF4444' }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarefas Atrasadas</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="80%" 
                barSize={10} 
                data={data}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="chart-label">
                  <tspan x="50%" dy="-0.5em" fontSize="26" fontWeight="bold" fill="#000">
                    {overduePercentage}%
                  </tspan>
                  <tspan x="50%" dy="1.5em" fontSize="12" fill="#666">
                    Tarefas Atrasadas
                  </tspan>
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskDistributionPieChart = ({ stats }: { stats: DashboardStats }) => {
    const data = [
      { name: 'Concluídas', value: stats?.completedCards || 0, color: '#22C55E' },
      { name: 'Atrasadas', value: stats?.overdueCards || 0, color: '#EF4444' },
      { name: 'Pendentes', value: (stats?.totalCards || 0) - (stats?.completedCards || 0) - (stats?.overdueCards || 0), color: '#F59E0B' },
    ];

    const COLORS = ['#22C55E', '#EF4444', '#F59E0B'];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarefas por Prioridade</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} tarefa(s)`, '']} 
                  separator=" - " 
                />
                <Legend formatter={(value, entry, index) => <span style={{ color: COLORS[index % COLORS.length] }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TasksByStageChart = ({ stats }: { stats: DashboardStats }) => {
    // Dados simulados para exemplificar o gráfico por estágio
    // Em um cenário real, esses dados viriam da API
    const data = [
      { name: 'A Fazer', valor: (stats?.totalCards || 0) - (stats?.completedCards || 0) - (stats?.overdueCards || 0), cor: '#F59E0B' },
      { name: 'Concluídas', valor: stats?.completedCards || 0, cor: '#22C55E' },
      { name: 'Atrasadas', valor: stats?.overdueCards || 0, cor: '#EF4444' },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarefas por Estágio</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} tarefa(s)`, '']} />
                <Legend />
                <Bar dataKey="valor" name="Quantidade">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Função para exibir mensagem quando não houver itens
  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-muted-foreground mb-2">
        {message}
      </div>
    </div>
  );

  // Exibir carregamento
  if ((isLoadingBoards || isLoadingStats) && activeTab === "overview") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={goToCreateBoard}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Quadro
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="overdue">Atrasados</TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="users">Usuários</TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total de Quadros" 
              value={totalBoards} 
              icon={<Layers className="h-4 w-4" />} 
            />
            <StatCard 
              title="Itens Atrasados" 
              value={totalOverdue}
              icon={<AlertCircle className="h-4 w-4" />} 
              description="Tarefas com prazo vencido"
            />
            {user?.role === "admin" && (
              <StatCard 
                title="Usuários" 
                value={totalUsers}
                icon={<Users className="h-4 w-4" />} 
              />
            )}
            <StatCard 
              title="Taxa de Conclusão" 
              value={`${completionRate}%`}
              icon={<BarChart3 className="h-4 w-4" />} 
              description="Média de conclusão dos projetos"
            />
          </div>

          {user && user.role === "admin" && (
            <>
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Métricas do Projeto</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <TaskCompletionRadialChart completionRate={completionRate} />
                  <TaskOverdueRadialChart stats={stats || { totalCards: 0, overdueCards: 0, completedCards: 0, totalBoards: 0, completionRate: 0, totalUsers: 0 }} />
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Análise de Tarefas</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <TaskDistributionPieChart stats={stats || { totalCards: 0, overdueCards: 0, completedCards: 0, totalBoards: 0, completionRate: 0, totalUsers: 0 }} />
                  <TasksByStageChart stats={stats || { totalCards: 0, overdueCards: 0, completedCards: 0, totalBoards: 0, completionRate: 0, totalUsers: 0 }} />
                </div>
              </div>
            </>
          )}
          
          {user && user.role !== "admin" && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Progresso Geral</h2>
              <Progress value={completionRate} className="h-2 mb-2" />
              <div className="text-sm text-muted-foreground">
                {completionRate}% das tarefas foram concluídas
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Seus Quadros</h2>
            </div>
            
            {(boards || []).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(boards || []).map((board) => (
                  <BoardItem key={board.id} board={board} />
                ))}
              </div>
            ) : (
              renderEmptyState("Você ainda não tem quadros. Crie um novo quadro para começar!")
            )}
          </div>
        </TabsContent>

        {/* Tab: Itens Atrasados */}
        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas Atrasadas</CardTitle>
              <CardDescription>
                Itens com prazo de entrega vencido que precisam de atenção.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOverdue ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div>
                  {(overdueCards || []).length > 0 ? (
                    <div className="divide-y">
                      {(overdueCards || []).map((card) => (
                        <OverdueItem 
                          key={card.id}
                          title={card.title}
                          dueDate={card.dueDate}
                          listName={card.listName}
                          boardName={card.boardName}
                          boardId={card.boardId}
                        />
                      ))}
                    </div>
                  ) : (
                    renderEmptyState("Não há tarefas atrasadas. Bom trabalho!")
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários (Admin) */}
        {user?.role === "admin" && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie os usuários da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    {(users || []).length > 0 ? (
                      <div className="divide-y">
                        {(users || []).map((userData) => (
                          <UserItem 
                            key={userData.id}
                            user={userData}
                            isAdmin={userData.role === "admin"}
                          />
                        ))}
                      </div>
                    ) : (
                      renderEmptyState("Nenhum usuário encontrado.")
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => navigate('/auth?mode=register')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;