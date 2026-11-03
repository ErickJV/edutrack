# Tasks

## 1. Implementation

- [ ] 1.1 Implement core logic for Clippit UI Refinements e Autenticação Automática via oh-my-pi (.omp) and verify changes
- [ ] 1.2 Add integration wiring and configuration and verify changes

## 2. Verification

- [ ] 2.1 **Verificação Backend**: Execução de `python manage.py test apps.assistant` com todos os testes passando e teste de chamada HTTP contra o endpoint de chat confirmando resposta 200 OK com token do `.omp`.
- [ ] 2.2 **Verificação Frontend**: Build do frontend sem erros via `npx pnpm build` e `npx pnpm typecheck`.
- [ ] 2.3 **Verificação de UI**: Inspeção visual dos componentes garantindo: ausência do badge azul, Clippy ampliado, barra de título sem botão de engrenagem e ausência do rodapé técnico de instruções.
