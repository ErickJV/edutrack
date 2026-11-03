# Design

## Context
Os estudantes do EduTrack possuem diversas informações acadêmicas dispersas entre disciplinas, tarefas pendentes, controle de faltas, calendário de avaliações e metas de leitura. A plataforma necessita de um assistente inteligente proativo e carismático, inspirado no clássico Clippit (Clippy) dos anos 90 com a roupagem nostálgica do projeto de Felix Rieseberg (janela Windows 98 via 98.css, animações originais e balões de diálogo). A IA utilizará o modelo **Gemini 3.8 Flash** via **Google Antigravity OAuth** (com suporte híbrido via `.env` e override no próprio Clippy), injetando no prompt exclusivamente o contexto do estudante autenticado (disciplinas ativas, faltas, prazos, notas e leituras) com isolamento rigoroso entre usuários.

## Goals / Non-Goals
**Goals:**
- Implement Clippit Assistant (Felix Rieseberg Style) com Gemini 3.8 Flash via Antigravity OAuth cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Clippit Assistant (Felix Rieseberg Style) com Gemini 3.8 Flash via Antigravity OAuth

## Decisions
1. **Arquitetura Backend do Módulo `apps.assistant`**:
   - *Decisão*: Criar um app Django dedicado `backend/apps/assistant/` com separação de responsabilidades entre `context.py` (agregação de dados do aluno), `antigravity.py` (cliente HTTP do Antigravity) e `views.py` (endpoints REST).
   - *Racional*: Mantém o código do assistente e a integração com LLMs desacoplados das regras de negócio de `accounts` e `academic`, facilitando testes, manutenibilidade e extensibilidade futura.
   - *Alternativa considerada*: Colocar os endpoints diretamente em `apps/academic/views.py`. Descartado por violar o princípio de responsabilidade única.

2. **Isolamento de Contexto do Aluno no Prompt**:
   - *Decisão*: Em `context.py`, todo acesso ao banco é explicitamente filtrado por `user=request.user`. O resumo estruturado em Markdown/JSON sintetiza:
     - Dados do perfil (nome, curso, campus);
     - Disciplinas ativas, professores, carga horária e total de faltas computadas;
     - Tarefas pendentes, prazos mais próximos e tarefas em atraso;
     - Provas e entregas agendadas nos próximos 30 dias;
     - Livros em leitura e progresso de páginas.
     Esse bloco é inserido no campo `systemInstruction` da requisição ao Gemini 3.8 Flash, com a instrução de persona do Clippit em português brasileiro.
   - *Racional*: Garante privacidade absoluta (zero vazamento de dados entre estudantes) e fornece à LLM todo o histórico necessário para respostas contextualizadas ("Você tem prova de Banco de Dados na sexta-feira!").

3. **Integração com Gateway Google Antigravity OAuth (Gemini 3.8 Flash)**:
   - *Decisão*: Utilizar o endpoint de produção `https://cloudcode-pa.googleapis.com/v1internal:generateContent` com modelo `gemini-3.8-flash`.
     - Cabeçalhos: `User-Agent: antigravity/1.15.8 windows/amd64`, `X-Goog-Api-Client: google-cloud-sdk vscode_cloudshelleditor/0.1`, `Client-Metadata: {"ideType":"ANTIGRAVITY","platform":"WINDOWS","pluginType":"GEMINI"}`.
     - Suporte híbrido: Se a requisição contiver o header `X-Antigravity-Token`, ele tem precedência; caso contrário, utiliza o access token gerado a partir do `ANTIGRAVITY_REFRESH_TOKEN` / `ANTIGRAVITY_ACCESS_TOKEN` configurado no backend. Se houver `refresh_token`, o backend renova o token automaticamente via `https://oauth2.googleapis.com/token`.
     - Caso não haja credenciais configuradas, o backend responde com uma mensagem amigável no estilo Clippit instruindo o usuário a configurar suas chaves.
   - *Racional*: Cumpre à risca o requisito de autenticação Antigravity OAuth especificado e permite flexibilidade tanto em ambientes de desenvolvimento quanto para uso individual.

4. **Estilo Visual e Animações (Felix Rieseberg / Windows 98)**:
   - *Decisão*: Implementar o design em CSS nativo (inspirado no `98.css` utilizado por Felix Rieseberg), combinando classes Tailwind e estilos retro para borders 3D chanfradas (`outset`/`inset`), botões de relevo clássicos, barra de título azul em gradiente e paleta Windows 98 (`#c0c0c0`, `#000080`, `#ffffff`, `#808080`).
   - As animações são executadas utilizando os sprites extraídos do Clippit (`CLIPPIT.ACS` / `codex-clippy`), alternando entre WebP/PNGs com base no estado do chat (`Thinking`, `Writing`, `Congratulate`, `Alert`).
   - *Racional*: Evita dependências pesadas e conflitos com o Tailwind CSS v4 já presente no projeto, garantindo compatibilidade total e carregamento instantâneo.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
