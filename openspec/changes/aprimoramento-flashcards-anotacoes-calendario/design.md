## Context

O projeto EduTrack utiliza backend Django + Django REST Framework (`backend/apps/academic/`) com banco de dados relacional e frontend React + TypeScript + Tailwind CSS (`frontend/src/`). A sincronização entre Calendário e Tarefas já ocorre por meio dos modelos `AcademicEvent` e `AcademicTask` (vinculados via `linked_event`).

## Goals / Non-Goals

**Goals:**
- Garantir CRUD completo e reativo de Flashcards (Criar, Visualizar, Editar frente/verso, Excluir com confirmação) e atualizar a nomenclatura de interface para `"Cards"` e `"Todos os Cards"`.
- Saneamento na origem (banco de dados, queryset da API e estado do frontend) das disciplinas exibidas na aba Anotações para refletir exclusivamente o semestre vigente do estudante, desvinculando `"Application Data Persistence"` do semestre atual.
- Implementar extração determinística de datas de avaliações (`AP1`, `AP2`, `PAI 1`, `PAI 2`, `PAI 3`) a partir de arquivos PDF reais de planos de ensino na aba Calendário, com conferência, edição, exclusão e proteção contra duplicidade.

**Non-Goals:**
- Alterar nomes de colunas internas do banco de dados (`deck_name`) que quebrariam compatibilidade de migrações existentes.
- Inventar datas para avaliações que não constem no PDF enviado.

## Decisions

1. **Extrator de PDF de Calendário Acadêmico (`CalendarPdfExtractView` e `CalendarPdfConfirmView`)**:
   - Usa `pypdf.PdfReader` para extrair o texto de cada página do PDF enviado.
   - Analisa cabeçalhos `Disciplina: <nome>` para validar consistência com a disciplina selecionada pelo usuário.
   - Reconhece linhas de cronograma com datas `DD/MM` ou `DD/MM/AAAA`, inferindo o ano letivo a partir do semestre/ano vigente.
   - Aplica expressões regulares insensíveis a maiúsculas/minúsculas e acentuação para `AP1`, `AP2`, `PAI 1`/`I`, `PAI 2`/`II` e `PAI 3`/`III` (testando `III` antes de `II` e `I` com negative lookahead `(?![IVX0-9])`).
   - Filtra falsos positivos de pós-prova (`Resolução da AP1`, `Vista`, `Gabarito`, `Critérios de Avaliação`, `Maior nota entre PAI`).
   - Na confirmação (`POST /api/v1/calendar/confirm-extracted`), cria ou atualiza `AcademicEvent` (`kind='exam'`) e `AcademicTask` (`category='exam'`) sincronizados, evitando duplicação caso a mesma avaliação/disciplina/data já esteja cadastrada.
2. **Edição e Exclusão no Calendário (`CalendarPage.tsx`)**:
   - Além de editar/excluir na modal de conferência pós-upload, o usuário também pode editar ou excluir qualquer evento/avaliação diretamente no Calendário por meio do modal de edição de tarefa/evento.
3. **Filtro de Semestre Vigente (`StudentSubjectListCreateView` e `StudyNoteListCreateView`)**:
   - Determina o semestre vigente ativo do estudante e garante que matrículas de semestres anteriores (como `"Application Data Persistence"` do 1º semestre quando o aluno cursa o 2º semestre) não permaneçam com status `active` nem vinculadas a anotações do semestre atual.

## Risks / Trade-offs

- **[Variações de formatação em PDFs]** → Mitigação: normalização Unicode (remoção de acentos para matching), suporte a múltiplas linhas por data na tabela `Plano de aulas` e tela obrigatória de conferência com edição manual antes de persistir.
