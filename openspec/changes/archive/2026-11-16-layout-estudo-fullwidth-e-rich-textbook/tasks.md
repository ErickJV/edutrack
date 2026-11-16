## 1. Reestruturação do Layout e Aproveitamento de Tela Full-Width

- [x] 1.1 Atualizar `StudySessionPage.tsx` para layout *full-width* fluido, eliminando a restrição de largura `max-w-7xl` e ajustando os paddings para aproveitar todo o espaço lateral da tela.
- [x] 1.2 Remanejar o topo da Sessão de Estudo em um grid de 2 colunas lado a lado: Pomodoro Timer à esquerda e Metodologia Ativa de Estudo à direita.
- [x] 1.3 Adaptar `MethodologySelector.tsx` para layout horizontal/card otimizado para o posicionamento de topo ao lado do Pomodoro.
- [x] 1.4 Realocar o Caderno de Anotações (`StudyNotesWorkspace.tsx`) para ocupar 100% da largura útil restante abaixo dos blocos de topo.

## 2. Enriquecimento da Barra de Ferramentas e Recursos do Caderno (Rich Textbook)

- [x] 2.1 Implementar menu de seleção de cores de texto e cores de marca-texto (*Highlights*) com paleta acessível na barra de ferramentas do editor.
- [x] 2.2 Implementar seletor de família tipográfica (Sans-serif, Serif Acadêmica e Monospace) no editor e no painel de visualização.
- [x] 2.3 Implementar botões rápidos de inserção de blocos: Callouts acadêmicos (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`), Citações, Blocos de Código e Checklists de estudo (`- [ ]`).
- [x] 2.4 Adicionar suporte a formatação inline expandida: Sublinhado (`<u>`), Tachado (`~~`), cabeçalhos H1 a H4 e gerador de tabelas formatadas.
- [x] 2.5 Implementar barra de status no rodapé do editor com contagem de palavras, caracteres e tempo estimado de leitura da anotação.

## 3. Renderização, Estilização e Validação Visual do Preview

- [x] 3.1 Atualizar o renderizador de Markdown no `StudyNotesWorkspace.tsx` para suportar as tags de cores, marca-textos coloridos, callouts temáticos e tipografias dinâmicas com sanitização segura.
- [x] 3.2 Garantir contraste acessível WCAG AA em ambos os modos claro e escuro para as paletas de cores e botões de ação.

## 4. Testes, Validação Integrada e Verificações de Qualidade

- [x] 4.1 Atualizar e rodar os testes unitários do frontend (`pnpm test --run`).
- [x] 4.2 Executar checagem estática de tipos (`pnpm typecheck`) e linter (`pnpm lint`).
- [x] 4.3 Validar a responsividade e ausência de overflow horizontal desde 360px até resoluções ultrawide.
