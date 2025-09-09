-- Script de inicialização do banco de dados para Docker
-- Este arquivo será executado automaticamente quando o container PostgreSQL iniciar

-- Criar extensões se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mensagem de inicialização
SELECT 'Banco de dados inicializado com sucesso para desenvolvimento local!' as status;