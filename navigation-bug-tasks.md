# 🐛 Tasks para Resolver Bug de Navegação

## Problema Identificado
- Quando navega da visão geral para quadros, o header duplica
- Header principal some
- Não consegue voltar para página anterior
- Interface fica quebrada

## ✅ Tasks para Resolução

### 1. Investigar Estrutura de Rotas
- [ ] Analisar App.tsx e estrutura de roteamento
- [ ] Verificar se há conflitos entre rotas `/boards/:id` e views do board
- [ ] Identificar onde está acontecendo a duplicação do header

### 2. Corrigir Estrutura do BoardHeader
- [ ] Verificar se BoardHeader está sendo renderizado múltiplas vezes
- [ ] Analisar props `currentView` e `onViewChange` no componente Board
- [ ] Implementar navegação correta entre visão geral e quadro

### 3. Implementar Navegação de Volta
- [ ] Adicionar botão de voltar no BoardHeader
- [ ] Implementar lógica para retornar à página anterior
- [ ] Testar navegação entre diferentes views

### 4. Verificar CSS e Layout
- [ ] Revisar estilos que podem estar causando duplicação visual
- [ ] Verificar z-index e posicionamento dos headers
- [ ] Garantir que apenas um header seja visível

### 5. Testar Fluxo Completo
- [ ] Testar navegação: Dashboard → Visão Geral → Quadro → Voltar
- [ ] Verificar se headers não duplicam
- [ ] Confirmar que navegação funciona corretamente

## Próximos Passos
1. Analisar logs e código atual
2. Identificar componente causando duplicação
3. Implementar correções uma por uma
4. Testar após cada correção