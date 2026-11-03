# Design

## Context
O assistente acadêmico Clippit do EduTrack está operacional, porém apresenta ruídos visuais na interface (badge circular azul sobreposto ao avatar do Clippy e rodapé técnico informando atalhos de teclado e o modelo de IA) e requer configuração manual de token através de um botão de engrenagem na janela. Para proporcionar uma experiência retro mais limpa, fiel ao Office 97 e totalmente transparente ao usuário, o assistente deve remover os indicadores desnecessários, ampliar a escala do Clippy e extrair automaticamente as credenciais OAuth do Google Antigravity armazenadas no diretório local do oh-my-pi (`~/.omp/agent/agent.db`), eliminando a necessidade do botão e diálogo de configurações manuais.

## Goals / Non-Goals
**Goals:**
- Implement Clippit UI Refinements e Autenticação Automática via oh-my-pi (.omp) cleanly and reliably

**Non-Goals:**
- Scope outside the core requirements of Clippit UI Refinements e Autenticação Automática via oh-my-pi (.omp)

## Decisions
1. **Leitura Dinâmica do Banco SQLite do `.omp`**:
   - *Decisão*: Criar função utilitária em `backend/apps/assistant/antigravity.py` que abre em modo somente-leitura o arquivo `Path.home() / ".omp" / "agent" / "agent.db"`, executa `SELECT data FROM auth_credentials WHERE provider = 'google-antigravity'` e decodifica o JSON de credenciais (`access`, `refresh`, `projectId`, `expires`).
   - *Racional*: O arquivo é mantido e renovado automaticamente pelo ambiente do usuário. Ler dinamicamente garante que qualquer renovação efetuada pelo omp seja imediatamente refletida no EduTrack sem necessidade de reiniciar o backend ou copiar tokens para o `.env`.
   - *Alternativa considerada*: Copiar manualmente o token para o `.env`. Descartado por expirar periodicamente e exigir intervenção manual frequente.

2. **Mapeamento de Modelo e Formatação de Payload do Antigravity**:
   - *Decisão*: Enviar requisição para `https://daily-cloudcode-pa.googleapis.com/v1internal:generateContent` com fallback para `https://cloudcode-pa.googleapis.com/v1internal:generateContent`, utilizando o modelo `gemini-3.8-flash-tiered` (com fallback para `gemini-3-flash` e `gemini-2.5-flash`), com extração limpa de candidatos ignorando partes com `thought: true`.
   - *Racional*: Verificado e validado empiricamente nesta sessão com resposta HTTP 200 OK e geração fluida de respostas do Clippit.

3. **Simplificação da Interface Retro Windows 98**:
   - *Decisão*: Em `ClippitWindow.tsx`, remover o botão `⚙` da barra de título e a linha de rodapé com atalhos e nome do modelo. Em `ClippitFloatingWidget.tsx`, remover o elemento `<span className="absolute bottom-1 right-1 ...">` e aumentar a propriedade `size` do `ClippitAnimation`.
   - *Racional*: Atende 100% às solicitações do usuário, mantendo o visual limpo, nostálgico e sem ruídos desnecessários.

## Risks / Trade-offs
[Unforeseen edge cases or regression] → Mitigation: Comprehensive end-to-end and unit verification tests.
