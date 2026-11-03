## Why

O módulo de Sessão de Estudo atual divide a atenção do estudante em um grid onde o Pomodoro e os cards de metodologias competem visualmente com o Caderno de Anotações (Textbook). Para proporcionar um ambiente de estudo verdadeiramente imersivo, é necessário que o Textbook seja o workspace dominante da tela (cerca de 75% da largura útil), reduzindo o Pomodoro a um card minimalista e organizando as metodologias em uma gaveta colapsável.

Além disso, os alunos necessitam de acompanhamento específico de leituras acadêmicas (livros, apostilas e artigos) vinculadas diretamente aos exames universitários (provas regimentais, exames de 50 a 60 questões). Um novo submódulo de Leitura Acadêmica resolve essa lacuna, permitindo estipular metas diárias de páginas lidas, visualizar sequências (*streaks*), acompanhar ritmo estimado até a data das provas e integrar leituras diretamente ao caderno de anotações.

## What Changes

- **UI & Layout da Sessão de Estudo**:
  - Remoção do subtítulo/cabeçalho decorativo "Ambiente de alta performance" para maximizar a área útil vertical.
  - Redesenho para grid assimétrico de 2 colunas: Coluna Esquerda (~25% de largura no desktop) com ferramentas de suporte e Coluna Direita (~75% de largura) com o Caderno de Anotações ampliado.
  - Compactação do Pomodoro Timer para um card pequeno e minimalista no topo da coluna lateral, com display direto do tempo, ações rápidas (Play/Pause/Skip) e contador sutil de ciclos.
  - Reorganização dos cards de Metodologias Ativas (Feynman, Revisão Espaçada, Mapas Mentais, Interrogação Elaborativa) em um acordeão/gaveta colapsável na coluna lateral.
  - Expansão da área útil de escrita do Textbook e enriquecimento da Rich Text Toolbar (H1/H2/H3, Negrito, Itálico, Highlight, Checklist `- [ ]`, Blocos de Citação/Callout, Bloco de Código e Tabelas simples).
- **Novo Submódulo de Leitura Acadêmica**:
  - Modelos no backend para Leitura Acadêmica (`AcademicReading`) e Registro Diário de Leitura (`ReadingLog`), permitindo vincular leituras a exames/avaliações universitárias (tipo de prova, quantidade de questões, data do exame).
  - APIs RESTful em `/api/v1/academic-readings` e `/api/v1/reading-logs` para criação, listagem, atualização e progresso de leitura.
  - Dashboard diário com meta de páginas/dia, sequência ativa (*streak* em dias) e gráfico minimalista de barras dos últimos 14 dias com linha de meta.
  - Cards de livros/leituras vinculados a exames, exibindo barra de progresso em %, páginas restantes, ritmo atual e estimativa de término vs. data da prova.
  - Ações de registro rápido de páginas (+10 páginas e input manual).
  - Atalho de integração do card de leitura para abrir/criar uma anotação dedicada correspondente no Textbook.

## Capabilities

### New Capabilities
- `study-session`: Reestruturação visual da tela `/estudo` com prioridade para o Textbook ampliado (~75%), Pomodoro minimalista (~25%), gaveta colapsável de metodologias ativas e barra de formatação enriquecida (H3, itálico, highlight, tabelas, callouts).
- `academic-reading`: Submódulo para acompanhamento de leituras acadêmicas e metas diárias vinculadas aos exames e provas da universidade, incluindo métricas de ritmo, estimativa até a prova e histórico diário.

### Modified Capabilities

## Impact

- **Backend**:
  - Novos modelos `AcademicReading` e `ReadingLog` em `backend/apps/academic/models.py`.
  - Nova migração Django para as entidades de leitura.
  - Novos serializers e ViewSets/Views em `backend/apps/academic/` com permissão restrita ao usuário logado (`IsAuthenticatedOr401`).
  - Rotas de API registradas em `backend/apps/academic/urls.py`.
- **Frontend**:
  - Componente `PomodoroTimer.tsx` refatorado para variante minimalista compacta.
  - Componente `MethodologySelector.tsx` adaptado para drawer/accordion colapsável.
  - Componente `StudyNotesWorkspace.tsx` ampliado com barra de ferramentas rica (Rich Text Toolbar expandida com H3, highlight, tabelas, callout).
  - Novos componentes de Leitura: `AcademicReadingDashboard.tsx`, `ReadingStreakTracker.tsx`, `ReadingCard.tsx`, `ReadingModal.tsx`.
  - Página `StudySessionPage.tsx` reestruturada no novo grid assimétrico de 2 colunas e integração com a aba/seção de Leitura Acadêmica.
- **Banco de Dados**: Novas tabelas para leituras e logs de progresso sem alteração destrutiva em esquemas prévios.
- **Segurança**: Isolamento total de leituras e logs por usuário (validação de propriedade `request.user`).
