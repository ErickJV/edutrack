## Why

Os estudantes utilizam o Caderno de Anotações (*Textbook*) para criar resumos de matérias com diferentes estilos visuais de estudo. Para tornar o editor verdadeiramente personalizado e flexível, os alunos necessitam de uma ampla variedade de fontes tipográficas (como Arial, Montserrat, Comfortaa, Segoe UI, Fira Code, Merriweather) e de um seletor avançado de cores livre (com roda de cores, conta-gotas e código hexadecimal), além de uma gaveta lateral retrátil inteligente para ocultar ou expandir o menu de pastas/anotações de forma fluida.

## What Changes

- **Seleção Avançada de Famílias Tipográficas**:
  - Integração e suporte às famílias: **Montserrat**, **Comfortaa**, **Segoe UI**, **Arial**, **Inter**, **Merriweather** e **JetBrains Mono / Fira Code**.
  - Menu suspenso estilizado na barra de ferramentas do editor que altera instantaneamente a tipografia do editor e da visualização.
- **Seletor Avançado de Cores (Color Picker, Hexadecimal & Conta-Gotas)**:
  - Adição de seletor livre com círculo/seletor de matiz, input hexadecimal nativo (`#RRGGBB`) e suporte a conta-gotas (*EyeDropper API* nos navegadores compatíveis).
  - Capacidade de aplicar qualquer cor customizada tanto para **Texto** (`<span style="color: ...">`) quanto para **Marca-Texto / Realce** (`<mark style="background-color: ...">`), mantendo paletas de acesso rápido.
- **Menu Lateral Retrátil de Pastas com Gaveta**:
  - Transformação da coluna lateral de pastas em um menu lateral retrátil com botão explícito de colapso/expansão ("Pastas & Anotações").
  - Quando fechado, a barra lateral recolhe totalmente com transição suave, permitindo que a área do editor ocupe 100% da largura útil da tela com atalho discreto para reabrir.

## Capabilities

### Modified Capabilities
- `study-tasks`: Atualiza os requisitos do Caderno de Anotações para incluir seletor rico de fontes (Montserrat, Comfortaa, Segoe UI, Arial, etc.), seletor de cores customizadas com hexadecimal/color-picker/conta-gotas e barra lateral de pastas colapsável retrátil.

## Impact

- **Frontend**:
  - `frontend/index.html` / `frontend/src/index.css`: Inclusão das fontes web (Montserrat, Comfortaa).
  - `frontend/src/components/StudyNotesWorkspace.tsx`: Componente de Color Picker avançado, seletor de fontes com preview e gaveta retrátil de pastas.
- **Backend / Banco**: Sem alterações no backend; compatibilidade preservada com tags HTML/Markdown sanitizadas.
- **Segurança**: Sem impacto em autenticação ou permissões.
