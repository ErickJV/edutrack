## Context

Ver `proposal.md - Why`. O editor de anotações precisa de flexibilidade visual estética para permitir que o usuário adapte o ambiente de escrita às suas preferências individuais de estudo (fontes modernas, arredondadas ou clássicas, cores livres e foco total com retração de pastas).

## Goals / Non-Goals

**Goals:**
- Integrar as fontes Montserrat e Comfortaa via Google Fonts e oferecer Segoe UI, Arial, Inter, Merriweather e Monospace no menu do editor.
- Fornecer Color Picker com input hexadecimal, seletor de matiz/círculo e botão de conta-gotas (*EyeDropper API*).
- Tornar o menu lateral de pastas e anotações retrátil com animação suave e botão de alternância claro.
- Suportar renderização de cores inline (`style="color: ..."` e `style="background-color: ..."`) com sanitização segura.

**Non-Goals:**
- Não alterar os contratos do backend ou modelos de banco de dados.

## Decisions

### 1. Carregamento de Fontes Web
- **Decisão**: Incluir fontes Google Fonts (`Montserrat` e `Comfortaa`) no `index.html` com `display=swap` e `preconnect` para alta velocidade e sem bloqueio de renderização.
- **Lista de Fontes Disponíveis**:
  - `inter`: Inter / Sistema (Sans Padrão)
  - `montserrat`: Montserrat (Sans Geométrica)
  - `comfortaa`: Comfortaa (Arredondada Criativa)
  - `segoe`: 'Segoe UI', system-ui (Moderna)
  - `arial`: Arial, Helvetica, sans-serif (Universal)
  - `merriweather`: Merriweather, Georgia, serif (Acadêmica)
  - `mono`: JetBrains Mono, Fira Code, monospace (Código)

### 2. Seletor de Cores Dinâmico (Color Picker & Hex)
- **Decisão**: Criar um componente integrado de seleção de cores na barra de ferramentas contendo:
  - Input nativo `type="color"` estilizado (círculo seletor de cores).
  - Input textual para digitação de hexadecimal (ex: `#4F46E5`).
  - Botão de Conta-Gotas integrado acionando `window.EyeDropper` quando disponível.
  - Paleta com 8 atalhos de cores populares (Amarelo, Verde, Azul, Roxo, Rosa, Vermelho, Laranja, Grafite).
  - Botão de alternância: aplicar como **Cor de Texto** ou **Marca-Texto (Highlight)**.

### 3. Barra Lateral de Pastas Retrátil
- **Decisão**: Controlar o estado da barra lateral com estado colapsável (`sidebarOpen: boolean`), exibindo um cabeçalho com botão "Pastas & Anotações" e ícone de gaveta retrátil. Quando recolhido, a área do editor expande fluidamente.

## Risks / Trade-offs

- **[Risco] Suporte a EyeDropper no navegador** → *Mitigação*: Exibir o botão de conta-gotas somente quando `'EyeDropper' in window`, com fallback no input de cor nativo e hexadecimal.
