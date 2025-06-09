
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@shared/schema';

// Criar cliente de conexão
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não está definido no ambiente");
}

// Adicionar "?sslmode=require" se não estiver presente no URL de conexão
if (!connectionString.includes('?')) {
  connectionString += '?sslmode=require';
} else if (!connectionString.includes('sslmode=require')) {
  connectionString += '&sslmode=require';
}

// Configurar cliente PostgreSQL com retry e timeout adequados
const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
  onnotice: () => {}, // Suprimir avisos de notice
});

export { sql };
export const db: PostgresJsDatabase<typeof schema> = drizzle(sql, { schema });

export async function initializeDatabase() {
  let retries = 10; // Aumentar ainda mais as tentativas
  let lastError: any;
  let backoffDelay = 2000; // Delay inicial de 2 segundos

  while (retries > 0) {
    try {
      console.log(`🔄 Tentativa de conexão com o banco... (${11-retries}/10)`);

      // Verificar a conexão realizando uma consulta simples
      const result = await sql`SELECT 1 as test;`;
      console.log("✅ Banco de dados conectado com sucesso!");

      return true;
    } catch (error: any) {
      lastError = error;
      retries--;
      
      if (error.message?.includes('endpoint is disabled') || error.code === 'XX000') {
        console.log("⏰ Endpoint do banco está dormindo, aguardando reativação...");
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          backoffDelay = Math.min(backoffDelay * 1.5, 10000); // Aumentar delay progressivamente
          continue;
        }
      }
      
      console.error(`❌ Erro ao conectar com o banco (tentativas restantes: ${retries}):`, error.message);
      
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        backoffDelay = Math.min(backoffDelay * 1.2, 8000);
      }
    }
  }

  console.error("❌ Falha ao inicializar o banco de dados após todas as tentativas.");
  console.log("💡 Dica: Vá para a aba 'Database' no Replit e reative o banco manualmente.");
  return false;
}

// Função para tentar reconectar ao banco quando necessário
export async function reconnectDatabase() {
  console.log("🔄 Tentando reconectar ao banco de dados...");
  return await initializeDatabase();
}
