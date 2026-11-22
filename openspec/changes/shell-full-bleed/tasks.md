# Tasks

## 1. Implementation

- [x] 1.1 Linhas 95–96. Substituir o par de `className` por: and verify changes

## 2. Verification

- [x] 2.1 Prerrequisitos (nesta máquina `pnpm` não existe; usar os binários locais):
- [x] 2.2 ```bash
- [x] 2.3 cd frontend && ./node_modules/.bin/tsc -b --pretty false && ./node_modules/.bin/vite build
- [x] 2.4 Servidores (duas abas de terminal/serviço):
- [x] 2.5 ```bash
- [x] 2.6 cd backend && DB_ENGINE=sqlite ./.venv/Scripts/python.exe manage.py runserver 127.0.0.1:8000 --noreload
- [x] 2.7 cd frontend && ./node_modules/.bin/vite --host 127.0.0.1 --port 5173
- [x] 2.8 Login: criar usuário temporário no sqlite e apagar ao final.
- [x] 2.9 ```bash
- [x] 2.10 cd backend && DB_ENGINE=sqlite ./.venv/Scripts/python.exe manage.py shell -c "
- [x] 2.11 from django.contrib.auth import get_user_model
- [x] 2.12 from django.utils import timezone
- [x] 2.13 U=get_user_model(); base=U.objects.exclude(is_superuser=True).first()
- [x] 2.14 u,_=U.objects.get_or_create(email='ui.verify@aluno.impacta.edu.br', defaults={'full_name':'UI Verify'})
- [x] 2.15 u.course_offering=base.course_offering; u.profile_completed_at=u.profile_completed_at or timezone.now()
- [x] 2.16 u.is_active=True; u.set_password('VerifyPass!2026'); u.save(); print(u.email,'ok')"
- [x] 2.17 Entrar em `http://127.0.0.1:5173/entrar` com `ui.verify@aluno.impacta.edu.br` / `VerifyPass!2026`; se cair em `/completar-perfil`, selecionar qualquer graduação, marcar o consentimento e concluir.
- [x] 2.18 Checagens (viewport 1440×900, tema claro):
- [x] 2.19 Sem camada: `document.querySelector('.app-backdrop')` e `document.querySelector('.app-frame')` retornam `null`; nenhum elemento tem `box-shadow` começando com `rgba(21, 21, 47, 0.22)`.
- [x] 2.20 Fundo da página: `getComputedStyle(document.querySelector('#app-sidebar').closest('div.min-h-dvh')).backgroundColor` = `rgb(255, 255, 255)`; com `document.documentElement.classList.add('dark')` = `rgb(19, 19, 38)`.
- [x] 2.21 Sidebar: `const r=document.querySelector('#app-sidebar').getBoundingClientRect()` → `left === 12`, `top === 12`, `bottom === window.innerHeight - 12`, `width === 202`.
- [x] 2.22 Conteúdo full-bleed: `document.querySelector('#app-sidebar').parentElement.parentElement.children[1].getBoundingClientRect()` → `left === 236` (12 + 202 + gap 22 do `xl`) e `right === document.documentElement.clientWidth`.
- [x] 2.23 `/estudo`: `const c=document.querySelector('[aria-label="Bloco de Anotações de Estudo"]').getBoundingClientRect()` → o documento termina exatamente 24px (`pb-6`) depois do cartão (`Math.abs(document.documentElement.scrollHeight - (c.bottom + window.scrollY) - 24) < 2`) e `c.bottom >= window.innerHeight - 24` (nenhuma faixa vazia no rodapé, mesmo quando o caderno rola). Idem em `?tab=readings` com `[aria-label="Leituras e Livros Vinculados a Provas"]`.
- [x] 2.24 Sem rolagem horizontal: `document.documentElement.scrollWidth === document.documentElement.clientWidth` em 1440×900 e em 390×844.
- [x] 2.25 Screenshot 1440×900 comparado ao mock: página branca contínua, sidebar escura flutuante com 12px de margem, cartão de anotações indo até perto da borda direita, zero cinza em volta. Screenshot em tema escuro: `#131326` de fundo, sidebar `#0C0C1E`.
- [x] 2.26 Mobile 390×844: `#app-sidebar` não existe (wrapper `hidden lg:flex`), botão "Abrir menu" abre o drawer e o fecha; layout sem overflow.
- [x] 2.27 Regressão de abas: em `/estudo` alternar Anotações → Leituras → Upload de arquivos mantém o header único e o cartão ocupando a altura disponível.
- [x] 2.28 Limpeza obrigatória ao fim: apagar o usuário (`U.objects.filter(email='ui.verify@aluno.impacta.edu.br').delete()`) e parar os dois servidores.
