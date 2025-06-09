import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { user, loginMutation } = useAuth();
  const [, navigate] = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-56px)] py-8">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-card rounded-lg overflow-hidden shadow-lg">
        <div className="md:w-1/2 p-6 md:p-12">
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1 p-0 pb-8">
              <CardTitle className="text-3xl font-bold">Entrar</CardTitle>
              <CardDescription>
                Insira suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="seu_usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="p-0 pt-4 flex justify-center">
            </CardFooter>
          </Card>
        </div>
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-primary to-primary/40 p-12 text-white">
          <div className="h-full flex flex-col justify-center space-y-6">
            <h2 className="text-4xl font-bold">Kanban Board</h2>
            <p className="text-xl">
              Organize suas tarefas, acompanhe prazos e gerencie projetos com facilidade.
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Crie quadros personalizados para seus projetos</li>
              <li>Organize tarefas em listas flexíveis</li>
              <li>Acompanhe prazos e responsáveis</li>
              <li>Colabore com sua equipe em tempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}