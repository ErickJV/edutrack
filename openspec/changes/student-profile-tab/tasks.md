# Tasks

## 1. Implementation

- [ ] 1.1 1. **Modelos & Regras de Negócio**: Não há alteração de esquemas no banco de dados; reutilizam-se os campos `full_name`, `course_offering`, `email` e `password` do modelo `User` existente. and verify changes

## 2. Verification

- [ ] 2.1 Executar `make lint` / `pnpm typecheck` no frontend para garantir conformidade estrita de tipos.
- [ ] 2.2 Testar chamada `PATCH /api/v1/profile` com alteração de nome e graduação, conferindo retorno 200 com os novos dados serializados.
- [ ] 2.3 Testar chamada `PATCH /api/v1/profile` com e-mail inválido (ex: `@gmail.com`), conferindo retorno 400 com mensagem de validação institucional.
- [ ] 2.4 Testar chamada `POST /api/v1/profile/password` com senha atual incorreta, conferindo retorno 400, e com senha correta, conferindo retorno 200 mantendo sessão ativa.
- [ ] 2.5 Navegar visualmente em `/perfil`, preencher os formulários, verificar mensagens de sucesso em `Alert` e conferir a remoção do card na rota `/home`.
