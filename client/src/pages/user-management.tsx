import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Edit, Trash2, UserPlus, Check, X, AlertTriangle, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Redirect } from 'wouter';

// Definição dos tipos baseada no schema
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  createdAt: string;
}

// Esquema de validação para criar usuário
const createUserSchema = z.object({
  username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  role: z.enum(["admin", "user"], { message: "Papel deve ser admin ou user" }),
});

// Esquema de validação para atualizar usuário (sem senha obrigatória)
const updateUserSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  role: z.enum(["admin", "user"], { message: "Papel deve ser admin ou user" }),
});

// Esquema de validação para alteração de senha
const changePasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Nova senha deve ter pelo menos 6 caracteres" }),
  currentPassword: z.string().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function UserManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Carregar lista de usuários
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 15000, // 15 segundos
  });

  // Formulário para criar usuário
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'user',
    },
  });

  // Formulário para editar usuário
  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
    },
  });
  
  // Formulário para alterar senha
  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      currentPassword: '',
    },
  });

  // Mutação para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormValues) => {
      const res = await apiRequest('POST', '/api/register', userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso",
      });
      setShowCreateDialog(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number, userData: UpdateUserFormValues }) => {
      const res = await apiRequest('PATCH', `/api/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso",
      });
      setShowEditDialog(false);
      updateForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído com sucesso",
      });
      setShowDeleteDialog(false);
      setCurrentUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Não foi possível excluir o usuário",
        variant: "destructive",
      });
    },
  });

  // Função para abrir o diálogo de edição
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    updateForm.reset({
      name: user.name,
      email: user.email || '',
      role: user.role as 'admin' | 'user',
    });
    setShowEditDialog(true);
  };
  
  // Função para abrir o diálogo de exclusão
  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setShowDeleteDialog(true);
  };
  
  // Função para confirmar a exclusão
  const confirmDeleteUser = () => {
    if (currentUser) {
      deleteUserMutation.mutate(currentUser.id);
    }
  };

  // Função para criar usuário
  const onSubmitCreate = (data: CreateUserFormValues) => {
    createUserMutation.mutate(data);
  };

  // Função para atualizar usuário
  const onSubmitUpdate = (data: UpdateUserFormValues) => {
    if (currentUser) {
      updateUserMutation.mutate({ id: currentUser.id, userData: data });
    }
  };
  
  // Mutação para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, passwordData }: { id: number, passwordData: ChangePasswordFormValues }) => {
      const res = await apiRequest('POST', `/api/users/${id}/change-password`, passwordData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada com sucesso",
      });
      setShowPasswordDialog(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    },
  });
  
  // Função para abrir o diálogo de alteração de senha
  const handleChangePassword = (user: User) => {
    setCurrentUser(user);
    passwordForm.reset();
    setShowPasswordDialog(true);
  };
  
  // Função para submeter alteração de senha
  const onSubmitChangePassword = (data: ChangePasswordFormValues) => {
    if (currentUser) {
      changePasswordMutation.mutate({ id: currentUser.id, passwordData: data });
    }
  };

  // Redirecionamento se não for admin
  if (!authLoading && user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie todos os usuários do sistema. Adicione, edite ou remova usuários.
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar usuários. Tente novamente.
            </div>
          ) : (
            <Table>
              <TableCaption>Lista de todos os usuários cadastrados no sistema</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditUser(user)}
                            title="Editar Usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleChangePassword(user)}
                            title="Alterar Senha"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(user)}
                              title="Excluir Usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para criar usuário */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario123" {...field} />
                    </FormControl>
                    <FormDescription>
                      O nome de usuário será usado para login.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormDescription>
                      A senha deve ter pelo menos 6 caracteres.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Administradores podem gerenciar todo o sistema.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Criar Usuário
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar usuário */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário selecionado.
            </DialogDescription>
          </DialogHeader>

          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Administradores podem gerenciar todo o sistema.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex flex-col gap-2">
                <p>
                  Você tem certeza que deseja excluir o usuário <strong>{currentUser?.name}</strong>?
                </p>
                <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  <p className="text-sm">
                    Esta ação não pode ser desfeita. O usuário perderá acesso ao sistema e todos os dados associados.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Usuário
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para alterar senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              {user?.role === 'admin' && user.id !== currentUser?.id 
              ? `Defina uma nova senha para o usuário ${currentUser?.name}.` 
              : "Digite sua senha atual e escolha uma nova senha."}
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitChangePassword)} className="space-y-4">
              {/* Campo de senha atual - mostrado apenas quando não é administrador ou quando o admin está alterando sua própria senha */}
              {(user?.role !== 'admin' || user.id === currentUser?.id) && (
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormDescription>
                      A nova senha deve ter pelo menos 6 caracteres.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPasswordDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}