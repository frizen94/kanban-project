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
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              KB
            </span>
          </Link>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            <>
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-2">
                  <span className="hidden md:block">Meus Quadros</span>
                </Button>
              </Link>
              <Link href="/my-dashboard">
                <Button variant="ghost" size="sm" className="mr-2">
                  <LineChart className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden md:block">Meu Dashboard</span>
                </Button>
              </Link>
              {user.role.toUpperCase() === "ADMIN" && (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="mr-2">
                      <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:block">Dashboard Admin</span>
                    </Button>
                  </Link>
                  <Link href="/users/manage">
                    <Button variant="ghost" size="sm" className="mr-2">
                      <UserPlus className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:block">Gerenciar Usuários</span>
                    </Button>
                  </Link>
                </>
              )}
              <Link href="/">
                <Button variant="outline" size="sm" className="mr-4">
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden md:block">Novo Quadro</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2 flex items-center gap-2 border-b mb-1">
                    <Avatar className="h-10 w-10">
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => navigate("/my-dashboard")}
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    Meu Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/account/settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações da Conta
                  </DropdownMenuItem>
                  
                  {user.role.toUpperCase() === "ADMIN" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate("/users/manage")}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Gerenciar Usuários
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
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
    </header>
  );
}