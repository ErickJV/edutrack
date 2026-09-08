## Why

O bloco "Próximos passos / Recursos de organização em breve" na Home foi introduzido como um placeholder estático durante a fase inicial do MVP de autenticação para anunciar módulos futuros (como planejamento de tarefas e acompanhamento de disciplinas). Com esses módulos já implementados e funcionais no EduTrack, esse bloco tornou-se obsoleto e redundante, ocupando espaço desnecessário no painel principal.

## What Changes

- Remover a seção "Próximos passos" (`section[aria-labelledby="coming-soon"]`) de `frontend/src/pages/HomePage.tsx`.
- Ajustar o layout do container inferior para exibir o card "Seu perfil / Informações acadêmicas" de forma limpa, com largura total e responsividade preservada em todas as resoluções (360 px a 1920×1080).
- Limpar ícones e imports que eram utilizados exclusivamente por essa seção (`ArrowRight`).

## Capabilities

### Modified Capabilities
- `student-dashboard`: remoção do card de avisos preliminares e readequação do layout de apresentação do perfil acadêmico no Dashboard.

## Impact

- **Backend:** Não afetado.
- **Frontend:** Atualização simples de layout em `HomePage.tsx`.
- **Banco:** Não afetado.
- **Segurança:** Não afetada.
- **Operação:** Não afetada.
