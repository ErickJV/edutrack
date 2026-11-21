# clippit-assistant Specification

## Purpose
Define o comportamento do assistente acadêmico Clippit, que responde com o contexto acadêmico isolado do estudante autenticado através do módulo LLM compartilhado do backend, sem expor provedor ou modelo na interface.

## Requirements

### Requirement: Clippit usa o módulo LLM compartilhado
O assistente Clippit MUST construir o contexto acadêmico isolado do usuário autenticado e enviar o prompt de persona pelo módulo `apps.llm`, sem descoberta de OAuth local ou header de token customizado.

#### Scenario: Mensagem do aluno com chave configurada
- **WHEN** o aluno envia uma mensagem em `POST /api/v1/assistant/chat`
- **THEN** o backend envia o contexto acadêmico e o histórico recente via `LLMClient.chat`, retorna `reply`, `animation` e `timestamp`, e não expõe provedor nem modelo

#### Scenario: Chave não configurada no servidor
- **WHEN** `DEEPSEEK_API_KEY` está vazia e o aluno envia uma mensagem
- **THEN** o backend responde com a mensagem de fallback do Clippit e `animation = alert`, sem realizar chamada HTTP
