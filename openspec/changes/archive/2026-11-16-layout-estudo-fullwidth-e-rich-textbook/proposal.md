## Why

Na visualização atual da Sessão de Estudo ("Caderno & Foco"), a interface apresenta desperdício de espaço útil com margens laterais brancas excessivas (`max-w-7xl`) e um layout vertical condensado onde o Pomodoro e as Metodologias disputavam espaço em uma coluna lateral estreita.

Os estudantes necessitam de uma experiência imersiva de alta produtividade onde os utilitários de foco (Pomodoro e Guia da Metodologia Ativa) fiquem organizados lado a lado no topo, liberando toda a largura e altura útil da tela abaixo para o Caderno de Anotações (*Textbook*). Além disso, o caderno carece de recursos expressivos de edição, exigindo opções ricas de cores, fontes, estilos de blocos e formatação visual para enriquecer os resumos e sínteses acadêmicas.

## What Changes

- **Layout Full-Width e Reestruturação da Sessão de Estudo**:
  - Eliminar o limite restrito de largura (`max-w-7xl`) na página `/estudo`, expandindo o container para preenchimento fluido da tela (`max-w-full` ou `w-full` com padding adaptativo), aproveitando as margens laterais.
  - Reorganizar a seção superior em uma barra de foco integrada em 2 colunas horizontais no topo: **Pomodoro Timer Compacto** à esquerda e **Guia da Metodologia de Estudo Selecionada** à direita.
  - Dedicar toda a área inferior ao **Caderno de Anotações (Textbook)** em largura total, com alternância fluida entre árvore de pastas/notas colapsável e editor de texto de alta densidade.
- **Enriquecimento do Caderno de Anotações (Rich Textbook)**:
  - **Paleta de Cores e Marca-texto**: Inclusão de seletor de cores de texto e cores de destaque (amarelo, verde, ciano, rosa, roxo, laranja) usando sintaxe compatível e renderização visual rica.
  - **Seleção de Tipografia**: Suporte à alternância de tipografia para o editor e preview (Sans-serif moderna, Serif acadêmica e Monospace para algoritmos/código).
  - **Diversidade de Estilos de Blocos e Parágrafos**: Inserção rápida de Callouts temáticos (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`), blocos de código com linguagem, citações acadêmicas estilizadas e checklists de tarefas (`- [ ]`).
  - **Formatação Inline Expandida**: Adição de Sublinhado (`<u>`), Tachado (`~~`), H1/H2/H3/H4, tabelas estruturadas e atalhos de teclado.
  - **Estatísticas da Nota**: Exibição de contagem de palavras, contagem de caracteres e tempo estimado de leitura no rodapé do editor.

## Capabilities

### Modified Capabilities
- `study-tasks`: Atualiza os requisitos da Sessão de Estudo na rota `/estudo`, especificando o novo layout full-width com Pomodoro e Metodologia dispostos lado a lado no topo, e o Caderno de Anotações expandido ocupando o restante da tela com barra de ferramentas rica de cores, fontes e estilos de parágrafo.

## Impact

- **Frontend**:
  - `frontend/src/pages/StudySessionPage.tsx`: Novo layout responsivo full-width com grade superior (Pomodoro + Metodologia) e área dedicada ao Textbook abaixo.
  - `frontend/src/components/StudyNotesWorkspace.tsx`: Expansão da barra de ferramentas com seletores de cores de texto/destaque, seletor de fontes (Sans/Serif/Mono), menus de blocos/callouts e preview estilizado com suporte a cores e tipografias.
  - `frontend/src/components/MethodologySelector.tsx`: Layout horizontal card-based ou painel compacto para posicionamento lado a lado com o Pomodoro.
  - `frontend/src/components/PomodoroTimer.tsx`: Ajuste visual para alinhamento horizontal harmônico com a metodologia.
- **Backend / Banco**: Nenhum impacto destrutivo ou alteração de esquema necessária; o conteúdo das notas continua salvo como Markdown/HTML estendido nos campos de texto existentes.
- **Segurança**: Sem impacto em autenticação ou permissões; isolamento por usuário preservado.
