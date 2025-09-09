/**
 * Seeder para popular o banco de dados com dados iniciais
 * 
 * Este arquivo é responsável por:
 * - Criar uma conta de administrador padrão
 * - Popular dados básicos quando necessário
 * - Executar automaticamente na inicialização do servidor
 */

import { storage as appStorage } from "./db-storage";
import { hashPassword } from "./auth";

// Credenciais do administrador padrão
const DEFAULT_ADMIN = {
  username: "admin",
  password: "admin123",
  email: "admin@kanban.local",
  name: "Administrador do Sistema",
  role: "admin"
};

/**
 * Função principal do seeder
 * Verifica se existe um administrador e cria um se necessário
 */
export async function runSeeder() {
  try {
    console.log("🌱 Executando seeder...");
    
    // Verificar se já existe pelo menos um usuário administrador
    const totalUsers = await appStorage.getUserCount();
    
    if (totalUsers === 0) {
      console.log("🔨 Criando administrador padrão...");
      
      // Hash da senha
      const hashedPassword = await hashPassword(DEFAULT_ADMIN.password);
      
      // Criar usuário administrador
      const adminUser = await appStorage.createUser({
        username: DEFAULT_ADMIN.username,
        password: hashedPassword,
        email: DEFAULT_ADMIN.email,
        name: DEFAULT_ADMIN.name,
        role: DEFAULT_ADMIN.role
      });
      
      console.log(`✅ Administrador criado com sucesso! ID: ${adminUser.id}`);
      console.log(`👤 Username: ${DEFAULT_ADMIN.username}`);
      console.log(`🔑 Password: ${DEFAULT_ADMIN.password}`);
      console.log("📋 Credenciais salvas no arquivo admin-credentials.md");
      
      return true;
    } else {
      console.log("ℹ️  Usuários já existem no banco. Seeder não executado.");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Erro ao executar seeder:", error);
    throw error;
  }
}

/**
 * Função para criar dados de exemplo (opcional)
 * Pode ser chamada separadamente se necessário
 */
export async function createSampleData() {
  try {
    console.log("🎯 Criando dados de exemplo...");
    
    // Buscar o admin criado
    const admin = await appStorage.getUserByUsername(DEFAULT_ADMIN.username);
    if (!admin) {
      throw new Error("Administrador não encontrado");
    }
    
    // Criar quadro de exemplo
    const sampleBoard = await appStorage.createBoard({
      title: "Quadro de Exemplo",
      userId: admin.id
    });
    
    // Adicionar admin como membro do quadro
    await appStorage.addMemberToBoard({
      boardId: sampleBoard.id,
      userId: admin.id,
      role: "owner"
    });
    
    // Criar listas de exemplo
    const todoList = await appStorage.createList({
      title: "A Fazer",
      boardId: sampleBoard.id,
      order: 0
    });
    
    const doingList = await appStorage.createList({
      title: "Fazendo",
      boardId: sampleBoard.id,
      order: 1
    });
    
    const doneList = await appStorage.createList({
      title: "Concluído",
      boardId: sampleBoard.id,
      order: 2
    });
    
    // Criar cartões de exemplo
    await appStorage.createCard({
      title: "Configurar ambiente de desenvolvimento",
      description: "Instalar dependências e configurar o projeto",
      listId: doneList.id,
      order: 0
    });
    
    await appStorage.createCard({
      title: "Implementar autenticação",
      description: "Criar sistema de login e registro de usuários",
      listId: doneList.id,
      order: 1
    });
    
    await appStorage.createCard({
      title: "Desenvolver interface do quadro",
      description: "Criar componentes do Kanban board",
      listId: doingList.id,
      order: 0
    });
    
    await appStorage.createCard({
      title: "Adicionar funcionalidade de drag & drop",
      description: "Implementar arrastar e soltar para cartões e listas",
      listId: todoList.id,
      order: 0
    });
    
    await appStorage.createCard({
      title: "Implementar sistema de comentários",
      description: "Permitir adicionar comentários aos cartões",
      listId: todoList.id,
      order: 1
    });
    
    console.log("✅ Dados de exemplo criados com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao criar dados de exemplo:", error);
    throw error;
  }
}