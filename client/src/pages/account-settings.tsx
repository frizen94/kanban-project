import { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Check, X, Upload, AlertTriangle, Save, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Redirect } from 'wouter';

// Esquema de validação para atualização de perfil
const profileUpdateSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
});

// Esquema de validação para alteração de senha
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z.string().min(6, { message: "Nova senha deve ter pelo menos 6 caracteres" }),
});

type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function AccountSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePicture || null);
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Formulário para editar perfil
  const profileForm = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Formulário para alterar senha
  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  // Mutação para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      const res = await apiRequest('PATCH', `/api/users/${user.id}`, profileData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para fazer upload da imagem de perfil
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user) throw new Error("Usuário não autenticado");
      const res = await apiRequest('POST', `/api/users/${user.id}/profile-image`, formData, {}, true);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Imagem de perfil atualizada com sucesso",
      });
      setProfileImage(data.profilePicture);
      setNewProfileImage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar imagem de perfil",
        description: error.message || "Não foi possível fazer upload da imagem",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: ChangePasswordFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      const res = await apiRequest('POST', `/api/users/${user.id}/change-password`, passwordData);
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

  // Função para lidar com a seleção de arquivo
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Verificar tipo de arquivo
    if (!file.type.match(/^image\/(jpeg|png|jpg|gif)$/)) {
      toast({
        title: "Formato de arquivo inválido",
        description: "Por favor, selecione uma imagem (JPEG, PNG, GIF)",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar tamanho do arquivo (3MB máximo)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo da imagem é 3MB",
        variant: "destructive",
      });
      return;
    }
    
    // Salvar o arquivo temporariamente e mostrar uma prévia
    setNewProfileImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Função para fazer upload da imagem
  const handleImageUpload = async () => {
    if (!newProfileImage || !user) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_image', newProfileImage);
      
      await uploadProfileImageMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };
  
  // Função para remover a imagem selecionada
  const handleRemoveImage = () => {
    setNewProfileImage(null);
    setProfileImage(user?.profilePicture || null);
  };
  
  // Função para abrir o diálogo de alteração de senha
  const handleOpenChangePasswordDialog = () => {
    passwordForm.reset();
    setShowPasswordDialog(true);
  };
  
  // Função para atualizar perfil
  const onSubmitProfileUpdate = (data: ProfileUpdateFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Função para alterar senha
  const onSubmitChangePassword = (data: ChangePasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  // Mostrar carregamento enquanto busca dados do usuário
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirecionar se não estiver autenticado
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Iniciais para o avatar (fallback)
  const getInitials = () => {
    if (!user.name) return user.username.substring(0, 2).toUpperCase();
    return user.name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e preferências.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              {/* Seção da foto de perfil */}
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex flex-col gap-4 items-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImage || undefined} alt={user.name || user.username} />
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif"
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Alterar
                    </Button>
                    
                    {newProfileImage && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                        
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={handleImageUpload}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-2">
                    <p className="mb-2">Faça upload de uma foto para personalizar seu perfil.</p>
                    <ul className="list-disc list-inside">
                      <li>Tamanho máximo: 3MB</li>
                      <li>Formatos aceitos: JPEG, PNG, GIF</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Formulário de perfil */}
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfileUpdate)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
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
                    control={profileForm.control}
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
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
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
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              {/* Seção de segurança - Senha */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Alterar Senha</h3>
                <p className="text-sm text-muted-foreground">
                  Atualize sua senha periodicamente para aumentar a segurança da sua conta.
                </p>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2 mt-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Recomendações para senha forte:</p>
                    <ul className="list-disc list-inside mt-1 ml-1">
                      <li>Use pelo menos 8 caracteres</li>
                      <li>Combine letras maiúsculas e minúsculas</li>
                      <li>Inclua números e símbolos</li>
                      <li>Evite informações pessoais facilmente identificáveis</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button onClick={handleOpenChangePasswordDialog}>
                    <Key className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Diálogo para alterar senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua senha atual e escolha uma nova senha.
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitChangePassword)} className="space-y-4">
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