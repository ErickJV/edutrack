## Context

O módulo de Sessão de Estudo em `/estudo` atualmente exibe um grid equilibrado (5 colunas para o Pomodoro e metodologias, 7 colunas para o caderno de anotações em telas grandes), acompanhado de um cabeçalho decorativo. O usuário solicitou que o Caderno de Anotações (Textbook) seja o elemento dominante da tela (~75% de largura), com área útil expandida e ferramentas ricas de edição Markdown, enquanto o Pomodoro seja condensado para um card compacto no topo da coluna lateral (~25% de largura) e as metodologias ativas fiquem recolhidas em uma gaveta colapsável.

Além disso, introduz-se o submódulo de Leitura Acadêmica para rastrear metas diárias de páginas lidas, sequências (*streaks*), histórico dos últimos 14 dias em gráfico minimalista e vínculo de livros a exames universitários específicos (ex: Prova 1/2/3, 50-60 questões, com cálculo de páginas/dia restantes até a data da avaliação).

## Goals / Non-Goals

**Goals:**
- Redesenhar a página `/estudo` para um layout assimétrico no desktop (coluna lateral de 25% e workspace principal de 75%), sem o cabeçalho decorativo ("Ambiente de alta performance").
- Criar variante minimalista do Pomodoro Timer focada em exibição direta, botões essenciais (Play/Pause/Skip) e contador de ciclos discreto.
- Mover os cards das Metodologias Ativas para um componente acordeão colapsável na coluna lateral de suporte.
- Expandir a barra de ferramentas do Textbook (Rich Text Toolbar) com suporte a H1, H2, H3, Negrito, Itálico, Highlight (`==texto==`), Checklist (`- [ ]`), Blocos de Citação/Callouts (`> [!NOTE]`), Bloco de Código e Tabelas Markdown.
- Implementar modelos `AcademicReading` e `ReadingLog` no backend com isolamento estrito por usuário, filtros e endpoints REST.
- Criar a interface do submódulo de Leitura Acadêmica: dashboard com meta diária, cálculo de streak, gráfico de barras dos últimos 14 dias com linha de meta, cards de livros vinculados a exames universitários (com cálculo de ritmo páginas/dia e data da prova), incremento rápido de páginas (+10) e atalho para criar nota no Textbook.

**Non-Goals:**
- Não integrar com serviços externos de e-readers ou APIs de livros proprietárias (Google Books / Kindle).
- Não alterar o sistema de autenticação ou perfis de usuário.
- Não introduzir dependências pesadas de bibliotecas de gráficos (o gráfico de 14 dias será implementado em SVG puro / Tailwind CSS, garantindo zero peso adicional no bundle).

## Decisions

### 1. Modelagem de Dados para Leitura Acadêmica
- **Entidade `AcademicReading`**:
  - `user`: ForeignKey com `CASCADE`.
  - `student_subject`: ForeignKey opcional para `StudentSubject` com `SET_NULL`.
  - `title`: CharField(max_length=255).
  - `author`: CharField(max_length=255, blank=True).
  - `total_pages`: PositiveIntegerField.
  - `current_page`: PositiveIntegerField(default=0).
  - `daily_goal_pages`: PositiveIntegerField(default=15).
  - `exam_name`: CharField(max_length=120, blank=True) — ex.: "Prova 1", "Exame Regimental".
  - `exam_questions_count`: PositiveIntegerField(null=True, blank=True) — ex.: 50 ou 60 questões.
  - `exam_date`: DateField(null=True, blank=True).
  - `status`: CharField com choices `reading`, `completed`, `dropped` (default `reading`).
  - `created_at`, `updated_at`.
- **Entidade `ReadingLog`**:
  - `reading`: ForeignKey para `AcademicReading` com `CASCADE`.
  - `user`: ForeignKey com `CASCADE`.
  - `date`: DateField(default=timezone.now).
  - `pages_read`: PositiveIntegerField.
  - `created_at`.
  - *Constraint*: `unique_together = ('reading', 'date')` ou agregação por data para streaks consistentes.

*Alternativa considerada*: Guardar apenas um campo `total_pages` e `current_page` sem tabela de log. Descartado porque inviabilizaria o cálculo de histórico diário dos últimos 14 dias e o cálculo de streak.

### 2. Layout Assimétrico na Sessão de Estudo (75% / 25%)
- Utilizar no Tailwind `lg:grid-cols-12`:
  - Coluna lateral esquerda: `lg:col-span-3` ou `xl:col-span-3` (~25% de largura), contendo:
    1. Seletor de tarefa vinculada (compacto).
    2. Pomodoro Timer minimalista.
    3. Acordeão de Metodologias Ativas.
  - Coluna direita: `lg:col-span-9` ou `xl:col-span-9` (~75% de largura), contendo:
    - Caderno de Anotações ampliado com foco total na área de escrita.
  - Em telas menores (< 1024px), o layout empilha verticalmente mantendo a responsividade fluida mobile-first sem quebra ou overflow a 360px.

### 3. Pomodoro Timer Minimalista
- Reduzir o espaço vertical em mais de 50%: substituir o anel circular gigante SVG padrão da tela por um card plano limpo com:
  - Display numérico legível (ex: `25:00`).
  - Barra de progresso horizontal sutil.
  - Botões rápidos: Play/Pause centralizado, Skip/Próximo e botão discreto de configurações de tempo.
  - Badge pequeno de contagem de pomodoros concluídos (`🍅 x3`).

### 4. Gráfico Minimalista de 14 Dias sem Dependências Externas
- Implementar componente React nativo com Tailwind / SVG contendo 14 barras verticais e linha tracejada indicando a meta diária (ex.: 15 páginas).
- Não adiciona nenhuma biblioteca de gráficos (como Chart.js ou Recharts), preservando o bundle leve e alta performance.

## Risks / Trade-offs

- [Layout 75/25 em telas de laptop menores (1024px–1280px)] → Coluna lateral pode ficar estreita para formulários complexos. *Mitigação*: Definir min-width adequado na coluna lateral e alternar o breakpoint assimétrico preferencialmente em `lg:` ou `xl:`, com drawer deslizante nos dispositivos móveis.
- [Vínculo de anotação com livro de leitura] → O modelo `StudyNote` atualmente vincula `task`, `student_subject` e `folder`. *Mitigação*: Adicionar campo opcional `reading` (ForeignKey para `AcademicReading` com `SET_NULL`) em `StudyNote` ou referenciar no título/metodologia. Adicionaremos o FK direto garantindo relacionamento bidirecional limpo.
- [Cálculo de ritmo e dias até o exame] → Caso a data da prova já tenha passado ou a data não esteja preenchida. *Mitigação*: Exibir "Sem data definida" ou "Exame realizado" caso a data seja passada, tratando divisões por zero com fallback seguro.

## Migration Plan

1. Executar migração Django `0009_academicreading_readinglog_studynote_reading.py`.
2. O sistema preserva todas as anotações, tarefas e dados prévios sem alteração destrutiva.
3. Rollback simples via `uv run python manage.py migrate academic 0008` caso necessário.
