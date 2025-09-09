import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LogOut, Plus, User, BarChart3, LineChart, UserPlus, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="w-full flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3 transition-smooth hover:scale-105">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 text-primary-foreground font-bold text-sm shadow-soft">
              K
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">
              Kanban Board
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center space-x-1">
          {user && (
            <>
              <Link href="/">
                <Button variant="ghost" size="sm" className="btn-ghost-enhanced">
                  <span>Meus Quadros</span>
                </Button>
              </Link>
              <Link href="/my-dashboard">
                <Button variant="ghost" size="sm" className="btn-ghost-enhanced">
                  <LineChart className="h-4 w-4 mr-2" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              {user.role === "admin" && (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="btn-ghost-enhanced">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      <span>Admin</span>
                    </Button>
                  </Link>
                  <Link href="/users/manage">
                    <Button variant="ghost" size="sm" className="btn-ghost-enhanced">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span>Usuários</span>
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
          </nav>
          <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground hidden sm:block">Carregando</span>
            </div>
          ) : user ? (
            <>
              <Link href="/">
                <Button size="sm" className="btn-gradient shadow-soft">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:block">Novo Quadro</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full transition-smooth hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-primary/20"
                  >
                    <Avatar className="h-10 w-10 border-2 border-white/10">
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-success border-2 border-background"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-strong border-white/10 shadow-strong">
                  <div className="p-3 flex items-center gap-3 border-b border-white/10 mb-2">
                    <Avatar className="h-12 w-12 border-2 border-white/10">
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-600 text-white font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      <div className="flex items-center gap-1">
                        <div className="status-dot success"></div>
                        <span className="text-xs text-success">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:hidden border-b border-white/10 pb-2 mb-2">
                    <DropdownMenuItem onClick={() => navigate("/")}>
                      <User className="h-4 w-4 mr-3" />
                      Meus Quadros
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-dashboard")}>
                      <LineChart className="h-4 w-4 mr-3" />
                      Dashboard
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                          <BarChart3 className="h-4 w-4 mr-3" />
                          Dashboard Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/users/manage")}>
                          <UserPlus className="h-4 w-4 mr-3" />
                          Gerenciar Usuários
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>

                  <DropdownMenuItem
                    onClick={() => navigate("/my-dashboard")}
                    className="focus:bg-white/5"
                  >
                    <LineChart className="h-4 w-4 mr-3 text-primary" />
                    <div>
                      <div className="text-sm">Meu Dashboard</div>
                      <div className="text-xs text-muted-foreground">Visualizar estatísticas</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/account/settings")}
                    className="focus:bg-white/5"
                  >
                    <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                    <div>
                      <div className="text-sm">Configurações</div>
                      <div className="text-xs text-muted-foreground">Gerenciar conta</div>
                    </div>
                  </DropdownMenuItem>

                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => navigate("/users/manage")}
                        className="focus:bg-white/5"
                      >
                        <UserPlus className="h-4 w-4 mr-3 text-warning" />
                        <div>
                          <div className="text-sm">Gerenciar Usuários</div>
                          <div className="text-xs text-muted-foreground">Administrar sistema</div>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <div>
                      <div className="text-sm">Sair da conta</div>
                      <div className="text-xs opacity-75">Fazer logout do sistema</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}