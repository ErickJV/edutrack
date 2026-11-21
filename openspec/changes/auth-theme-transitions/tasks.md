# Tasks

## 1. Implementation

- [x] 1.1 Criar `frontend/src/utils/motion.ts` (não existe equivalente; `utils/usePresence.ts` exporta hoje só `prefersReducedMotion`, que passa a viver aqui): and verify changes

## 2. Verification

- [x] 2.1 Pré-requisitos (execução; `pnpm` não está no PATH — usar os binários locais):
- [x] 2.2 ```bash
- [x] 2.3 cd frontend
- [x] 2.4 node node_modules/typescript/bin/tsc -b --pretty false
- [x] 2.5 node node_modules/vite/bin/vite.js build
- [x] 2.6 node node_modules/eslint/bin/eslint.js src
- [x] 2.7 Lint: comparar com a linha de base — as únicas violações aceitáveis são as pré-existentes em `StudyDocumentsHub.tsx:136/141`, `CalendarPage.tsx:345`, `FlashcardsPage.tsx:134`, `ProfilePage.tsx:31`.
- [x] 2.8 Servidores (terminais separados):
- [x] 2.9 ```bash
- [x] 2.10 cd backend && DB_ENGINE=sqlite ./.venv/Scripts/python.exe manage.py migrate
- [x] 2.11 cd backend && DB_ENGINE=sqlite ./.venv/Scripts/python.exe manage.py runserver 8000 --noreload
- [x] 2.12 cd frontend && VITE_GOOGLE_ENABLED=true node node_modules/vite/bin/vite.js --port 5173
- [x] 2.13 `VITE_GOOGLE_ENABLED=true` é obrigatório para o botão Google existir na UI. Conta de teste (a verificação de e-mail está ativa neste ambiente):
- [x] 2.14 ```bash
- [x] 2.15 cd backend && DB_ENGINE=sqlite ./.venv/Scripts/python.exe manage.py shell -c "
- [x] 2.16 from apps.accounts.models import User
- [x] 2.17 from allauth.account.models import EmailAddress
- [x] 2.18 from apps.catalog.models import CourseOffering
- [x] 2.19 from django.utils import timezone
- [x] 2.20 u=User.objects.get(email='animacao.teste2@aluno.impacta.edu.br')
- [x] 2.21 EmailAddress.objects.filter(user=u).update(verified=True, primary=True)
- [x] 2.22 u.course_offering=CourseOffering.objects.first(); u.profile_completed_at=timezone.now(); u.save()
- [x] 2.23 print(u.email, u.profile_complete)
- [x] 2.24 Criar a conta em `/cadastro` primeiro (senha ≥ 12) se ela não existir. Navegador: WebKit headless funciona (`browser.open({app:'webkit'})`); o Chromium compartilhado falhou no ambiente (`Edge exited with code 0`), então não conte com ele — e WebKit não emula `prefers-reduced-motion`, use o stub de `matchMedia` num tab com `init_scripts` para os testes de movimento reduzido.
- [x] 2.25 **Login por senha com fade**: em `/entrar`, preencher a conta de teste e clicar "Entrar". Esperado: `document.getElementById('root').classList.contains('is-exiting')` é `true` imediatamente após o clique, `getComputedStyle(root).animationName === 'page-out'`; após ~200ms a URL é `/home` e `is-exiting` já não está presente.
- [x] 2.26 **Google**: clicar "Entrar com Google". Esperado: `is-exiting` aparece, e ~200ms depois sai uma requisição `POST` para `/_allauth/browser/v1/auth/provider/redirect` (`tab.requests()`), sem a página navegar antes disso.
- [x] 2.27 **Troca de modo sem remontar**: em `/entrar` digitar `x@aluno.impacta.edu.br` no campo de e-mail, clicar "Cadastre-se". Esperado: URL `/cadastro`, o valor digitado continua no DOM (mesma instância), `page-enter` não reinicia (`getComputedStyle(wrapper).animationName` não muda) e os dois painéis têm `opacity` intermediária (~0.5) durante a transição de 700ms. Screenshot em `/cadastro` para confirmar que não há textos sobrepostos.
- [x] 2.28 **Véu de navegação**: de `/home` clicar "Tarefas". Esperado: existe `.route-veil` com `animationName === 'veil-pulse'`, `pointer-events: none`, `opacity` entre 0 e 0.92 durante ~220ms, e o elemento não existe depois disso; nenhum clique é bloqueado durante o pulso.
- [x] 2.29 **Cross-fade do loader**: recarregar `/tarefas` autenticado. Esperado: `[data-presence='closed'] .page-loader` com `animationName === 'loader-out'` no momento em que a auth resolve, `pointer-events: none`, e o loader sai do DOM após ~200ms com a página já visível.
- [x] 2.30 **Fade do tema**: em `/home`, clicar no tema escuro. Esperado: `document.documentElement.classList.contains('theme-transition')` e `.dark` ambos `true`; `getComputedStyle(document.getElementById('root')).animationName === 'theme-fade-in'`; `getComputedStyle(uma seção).transitionDuration === '0.38s'`; após ~420ms `theme-transition` sai. Repetir clicando no tema já ativo: nenhuma classe `theme-transition` é adicionada.
- [x] 2.31 **Logout**: em `/home` clicar "Sair". Esperado: `is-exiting` presente, e após ~200ms `/entrar` visível com `is-exiting` removido (página não fica apagada).
- [x] 2.32 **Movimento reduzido** (tab com `matchMedia` stubado para `reduce`, ver utilitários): repetir 1, 4, 5 e 6. Esperado: `is-exiting` nunca é adicionado; `.route-veil` fica com `opacity: 0` e `animationName: 'none'`; o loader desaparece em ~0ms; a troca de tema não adiciona `theme-transition`; `transitionProperty` de um `button` é `none`.
- [x] 2.33 **Sem regressões**: `pnpm`-equivalente build limpo, console sem erros/warnings de React, foco por teclado mantém outline de 2px em nav e botões, e o overlay de task (`Nova Tarefa Detalhada`) continua animando entrada/saída como antes.
