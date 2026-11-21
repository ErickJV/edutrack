# Spec Delta

## Purpose

Define a linguagem de movimento única do frontend do EduTrack: transição de rota, presença de overlays, entrada escalonada de listas, contadores/barras animados e micro-interações, sempre desativáveis pelo usuário.

## ADDED Requirements

### Requirement: Transição de rota com reset de scroll

O sistema SHALL animar a entrada de cada rota com fade e leve deslocamento vertical (`page-in`, 320ms) e SHALL reposicionar o scroll no topo a cada mudança de `pathname`.

#### Scenario: Navegação entre páginas autenticadas

- **WHEN** o usuário rola a página até o fim e aciona um item da navegação principal
- **THEN** o novo conteúdo é montado com a animação `page-in` e `window.scrollY` volta a 0

### Requirement: Presença de overlays com entrada e saída animadas

Todo overlay (`fixed inset-0`) SHALL animar a abertura (fade do backdrop e escala/deslocamento do painel) e SHALL manter-se montado por ~180ms ao fechar para exibir a animação de saída, preservando o conteúdo exibido durante esse intervalo.

#### Scenario: Fechamento de modal com dados do registro

- **WHEN** o usuário fecha um modal que recebe um objeto por prop (disciplina, leitura ou imagem do lightbox)
- **THEN** o painel anima `modal-dialog-out`, o conteúdo continua visível durante a animação e o nó é removido do DOM em seguida

### Requirement: Entrada escalonada e animações de dados

Listas e cards SHALL entrar com `rise` escalonado por índice (delay incremental), indicadores numéricos SHALL contar até o valor alvo em ~900ms e barras de progresso SHALL crescer da esquerda (`bar-grow`).

#### Scenario: Carregamento do painel inicial

- **WHEN** os dados do dashboard são exibidos
- **THEN** os cards entram em sequência, os números sobem do zero até o valor final e as barras de progresso crescem

### Requirement: Respeito a prefers-reduced-motion

O sistema SHALL desativar animações e transições próprias quando `prefers-reduced-motion: reduce` estiver ativo: sem `page-in`, `rise`, `bar-grow`, `shimmer`, animações de modal, `card-lift` e `press`; contadores SHALL renderizar o valor final imediatamente e overlays SHALL desmontar sem espera.

#### Scenario: Preferência de movimento reduzido

- **WHEN** o navegador reporta `prefers-reduced-motion: reduce`
- **THEN** nenhuma animação customizada é executada, os valores numéricos já aparecem finais e o fechamento de modal não atrasa a desmontagem
