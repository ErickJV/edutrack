# Proposal

## Why
O assistente acadêmico Clippit do EduTrack está operacional, porém apresenta ruídos visuais na interface (badge circular azul sobreposto ao avatar do Clippy e rodapé técnico informando atalhos de teclado e o modelo de IA) e requer configuração manual de token através de um botão de engrenagem na janela. Para proporcionar uma experiência retro mais limpa, fiel ao Office 97 e totalmente transparente ao usuário, o assistente deve remover os indicadores desnecessários, ampliar a escala do Clippy e extrair automaticamente as credenciais OAuth do Google Antigravity armazenadas no diretório local do oh-my-pi (`~/.omp/agent/agent.db`), eliminando a necessidade do botão e diálogo de configurações manuais.

## What Changes
- **Frontend - Widget Flutuante (`frontend/src/components/clippit/ClippitFloatingWidget.tsx`)**:
  - Remoção do badge circular azul pulsante (`animate-ping` e círculo azul no canto inferior do avatar).
  - Aumento da dimensão do avatar do Clippit de `size={76}` para `size={96}` para torná-lo mais proeminente e legível.
- **Frontend - Janela do Clippit (`frontend/src/components/clippit/ClippitWindow.tsx`)**:
  - Remoção do rodapé técnico contendo *"Enter envia • Shift+Enter nova linha"* e *"Gemini 3.8 Flash via Antigravity"*.
  - Remoção do botão de configuração (`⚙`) na barra de título retro e de todo o modal/diálogo de configurações e auditoria manual.
  - Limpeza dos estados e chamadas de override manual (`customToken`, `showConfigModal`, etc.).
  - Aumento do avatar animado no cabeçalho da janela de `size={56}` para `size={64}` para harmonizar com a nova escala.
- **Backend - Resolução Automática de Autenticação (`backend/apps/assistant/antigravity.py`)**:
  - Implementação da função `get_omp_antigravity_credentials()` que lê dinamicamente `Path.home() / ".omp" / "agent" / "agent.db"`, consultando a tabela `auth_credentials` onde `provider = 'google-antigravity'`.
  - Extração automática de `access` token, `refresh` token e `projectId` (`aicode-consumers`), utilizando esses dados como credencial padrão caso não haja variáveis explícitas no ambiente.
  - Atualização dos endpoints e modelo Antigravity:
    - Uso prioritário de `https://daily-cloudcode-pa.googleapis.com/v1internal:generateContent` com fallback para `https://cloudcode-pa.googleapis.com/v1internal:generateContent`.
    - Mapeamento automático de `gemini-3.8-flash` para o identificador ativo do Antigravity (`gemini-3.8-flash-tiered` / `gemini-3-flash`).
    - Tratamento de extração das partes de resposta filtrando fragmentos de raciocínio interno (`thought: true`).
    - Atualização do método `get_status()` reportando `mode: "omp_credentials"` e status configurado quando o token local do `.omp` for detectado.
- **Backend - Testes Unitários (`backend/apps/assistant/tests.py`)**:
  - Atualização dos testes para cobrir a resolução automática de credenciais via `.omp` e validar o novo fluxo sem dependência de headers manuais.

## Capabilities

### New Capabilities
- `clippit-ui-and-omp-auth`: Implements capabilities and behavior for Clippit UI Refinements e Autenticação Automática via oh-my-pi (.omp)

### Modified Capabilities

## Impact
1. `frontend/src/components/clippit/ClippitFloatingWidget.tsx`: Remoção do badge azul e ampliação de `size={76}` para `size={96}`.
2. `frontend/src/components/clippit/ClippitWindow.tsx`: Remoção do botão de configuração, remoção do modal de configuração e remoção da linha de rodapé.
3. `backend/apps/assistant/antigravity.py`: Implementação da descoberta de credenciais no banco SQLite do `.omp`, ajuste de endpoint para `daily-cloudcode-pa` e suporte ao modelo `gemini-3.8-flash-tiered`.
4. `backend/apps/assistant/tests.py`: Testes unitários para a resolução automática via `.omp` e payload do Antigravity.

---
