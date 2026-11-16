## Context

Ver `proposal.md - Why`. A interface atual da Sessão de Estudo em `/estudo` sofria com limitação de largura e uma disposição onde o editor competia lateralmente com o Pomodoro e as Metodologias. A presente arquitetura reorganiza a hierarquia espacial e eleva o poder expressivo do editor de anotações.

## Goals / Non-Goals

**Goals:**
- Proporcionar aproveitamento máximo de tela em desktops e ultrawide com container fluido e preenchimento harmônico.
- Dispor os utilitários de foco e métodos de estudo lado a lado no topo da página em uma barra de ferramentas integrada.
- Dedicar 100% da largura útil restante abaixo ao Caderno de Anotações (*Textbook*), com alternância de pastas e editor de texto amplo.
- Equipar o *Textbook* com ferramentas ricas de formatação: paleta de cores de texto, cores de marca-texto, seleção de tipografia (Sans-serif, Serif, Monospace), Callouts temáticos, blocos de código, listas de tarefas, tabelas e estatísticas de leitura.

**Non-Goals:**
- Alterações destrutivas no esquema de banco de dados ou no backend (o campo `StudyNote.content` armazena texto compatível com Markdown/HTML).
- Modificação na lógica interna das abas de Leitura Acadêmica, exceto pelo aproveitamento do container full-width.

## Decisions

### 1. Reorganização Estrutural do Grid da Sessão de Estudo
- **Decisão**: Substituir o grid vertical desbalanceado (~25% lateral vs ~75% editor) por uma estrutura hierárquica em 2 níveis:
  1. **Nível Superior (Foco & Método)**: Grid responsivo de 2 colunas (`grid grid-cols-1 lg:grid-cols-12 gap-4`) onde o Pomodoro ocupa 5 colunas e a Metodologia Ativa de Estudo ocupa 7 colunas no topo.
  2. **Nível Inferior (Textbook)**: Bloco dedicado em largura total (`w-full`), com painel colapsável de pastas/arquivos à esquerda e editor/preview expansivo à direita.
- **Alternativas consideradas**:
  - *Manter 3 colunas lado a lado (Pastas | Editor | Pomodoro)*: Descartado por espremer o editor de texto e prejudicar a digitação em telas menores de 1440px.

### 2. Formatação Rica, Cores e Destaques no Textbook
- **Decisão**: Implementar suporte a formatação visual através de tags HTML/Markdown seguras no renderizador de preview:
  - Cores de texto: classes de destaque temáticas (Amarelo, Verde, Azul/Ciano, Rosa, Roxo, Vermelho).
  - Cores de marca-texto (*Highlights*): suporte a `==destaque==` e classes de fundo suave (`bg-amber-100`, `bg-emerald-100`, `bg-sky-100`, `bg-purple-100`, `bg-rose-100`).
  - Famílias de fontes: alternância entre `font-sans` (Inter/System), `font-serif` (Merriweather/Georgia) e `font-mono` (JetBrains/Consolas) com controle na barra de ferramentas.
  - Callouts acadêmicos: renderização estilizada de blocos `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!IMPORTANT]`.
- **Alternativas consideradas**:
  - *Adicionar um editor WYSIWYG pesado (ex: TipTap/Draft.js)*: Descartado para manter fidelidade ao Markdown leve, compatibilidade retroativa e performance ágil sem inflar o bundle.

### 3. Estatísticas e Métricas da Anotação
- **Decisão**: Adicionar barra de status inferior no editor exibindo contadores em tempo real:
  - Quantidade de palavras.
  - Quantidade de caracteres.
  - Estimativa de leitura calculada em `Math.ceil(palavras / 200)` minutos.

## Risks / Trade-offs

- **[Risco] Renderização de HTML personalizada no preview** → *Mitigação*: Utilizar sanitização rigorosa no renderizador do preview para permitir apenas tags visuais inofensivas (`span`, `mark`, `u`, `del`, `table`, etc.), prevenindo vetores de XSS.
- **[Risco] Poluição da barra de ferramentas do editor** → *Mitigação*: Agrupar as ferramentas em menus suspensos (dropdowns) e grupos de botões organizados por categoria (Tipografia, Cores, Estrutura, Blocos).
