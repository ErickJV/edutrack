## Purpose

Permitir leitura confortável em ambientes claros e escuros, mantendo a escolha de aparência entre visitas e a acessibilidade de todas as telas do EduTrack.

## ADDED Requirements

### Requirement: Escolha de tema persistente
A interface MUST oferecer Claro, Escuro e Sistema em controle acessível nas telas públicas e autenticadas, com Sistema como padrão. A escolha MUST persistir por navegador, sem depender da sessão ou sincronização entre dispositivos; indisponibilidade do armazenamento MUST manter a aplicação utilizável.

#### Scenario: Escolha manual e recarga
- **WHEN** o usuário seleciona Escuro e recarrega ou faz logout
- **THEN** o tema permanece escuro desde a primeira renderização, sem clarão de tema claro
- **AND** em Sistema, alterações na preferência do dispositivo são refletidas; em modo manual, não substituem a escolha.

#### Scenario: Armazenamento indisponível
- **WHEN** o navegador bloqueia persistência ou contém uma preferência inválida
- **THEN** a aplicação usa Sistema como padrão e permite alternância na sessão atual sem erro bloqueante.

### Requirement: Cobertura e acessibilidade dos temas
Todos os temas MUST cobrir autenticação, páginas legais, Home, disciplinas, tarefas, professores, calendário, formulários, modais e estados vazio/carregando/erro. Controles MUST ter nome acessível, foco visível e alvos mínimos de 44 px; texto normal MUST ter contraste de pelo menos 4,5:1 e componentes visuais essenciais 3:1.

#### Scenario: Navegação responsiva
- **WHEN** o usuário navega por teclado em larguras de 360, 768 e 1280 px em ambos os temas
- **THEN** o conteúdo permanece legível, sem overflow horizontal da página ou informação indicada apenas por cor
- **AND** a seleção do tema é anunciada por tecnologia assistiva.
