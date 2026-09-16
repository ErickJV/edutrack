## 1. Backend: Modelos, Migrações e Endpoints de Leitura Acadêmica

- [ ] 1.1 Criar os modelos `AcademicReading` e `ReadingLog` em `backend/apps/academic/models.py` e adicionar FK opcional `reading` em `StudyNote`.
- [ ] 1.2 Gerar migração Django (`makemigrations`) e aplicar no banco de dados, verificando com `makemigrations --check`.
- [ ] 1.3 Implementar serializers `AcademicReadingSerializer` e `ReadingLogSerializer` em `backend/apps/academic/serializers.py` com validações de propriedade do usuário e cálculo dinâmico de progresso (%) e ritmo diário sugerido.
- [ ] 1.4 Criar as views e viewsets para listagem, criação, atualização, arquivamento e registro diário de leitura em `backend/apps/academic/views.py` e mapear rotas em `backend/apps/academic/urls.py`.
- [ ] 1.5 Escrever e rodar testes de API para leitura acadêmica e logs em `backend/tests/test_academic_reading_api.py`, validando cálculo de streak, metas, paginação e isolamento entre usuários.

## 2. Frontend: Tipos, Clientes de API e Utilitários

- [ ] 2.1 Adicionar tipagens `AcademicReading`, `AcademicReadingPayload`, `ReadingLog` e `ReadingSummary` em `frontend/src/api/types.ts`.
- [ ] 2.2 Implementar métodos no cliente HTTP (`frontend/src/api/client.ts`) para gerenciar leituras (`listAcademicReadings`, `createAcademicReading`, `updateAcademicReading`, `deleteAcademicReading`, `logReadingPages`).
- [ ] 2.3 Implementar utilitários para cálculo de sequência diária (*streak*) e agregação de histórico dos últimos 14 dias para o gráfico.

## 3. Frontend: Refatoração da UI da Sessão de Estudo

- [ ] 3.1 Refatorar `PomodoroTimer.tsx` para versão compacta/minimalista, reduzindo sua altura em >50% com foco em botões rápidos de ação, display limpo e contador discreto de ciclos.
- [ ] 3.2 Refatorar `MethodologySelector.tsx` transformando os cards em uma gaveta colapsável (accordion) para a barra lateral.
- [ ] 3.3 Expandir `StudyNotesWorkspace.tsx` aumentando a área útil horizontal/vertical e enriquecendo a barra de ferramentas com botões para H3, itálico, highlight (`==`), tabelas simples e callouts (`> [!NOTE]`).
- [ ] 3.4 Reestruturar `StudySessionPage.tsx` removendo o cabeçalho "Ambiente de alta performance" e aplicando o novo grid de 2 colunas (~25% lateral esquerda e ~75% workspace do Textbook).

## 4. Frontend: Submódulo de Leitura Acadêmica

- [ ] 4.1 Criar o componente `ReadingStreakTracker.tsx` com meta diária, dias de streak e gráfico minimalista de barras dos últimos 14 dias com linha de corte da meta.
- [ ] 4.2 Criar o componente `ReadingCard.tsx` com informações da leitura, exame universitário vinculado (P1/P2/P3, número de questões, data), barra de progresso em %, estimativa de dias até o término, botão de incremento rápido (+10 págs) e atalho para criar nota no Textbook.
- [ ] 4.3 Criar modal de criação e edição de leitura `ReadingModal.tsx` com campos de título, autor, páginas totais/lidas, disciplina e dados da prova.
- [ ] 4.4 Integrar o dashboard de Leitura Acadêmica na aplicação com suporte a navegação por abas ou seção dedicada na Sessão de Estudo.

## 5. Validação Integrada, Testes e Acessibilidade

- [ ] 5.1 Criar e atualizar testes unitários do frontend (`StudySessionPage.test.tsx`, `ReadingStreakTracker.test.tsx`, `PomodoroTimer.test.tsx`).
- [ ] 5.2 Executar testes automatizados do frontend (`pnpm test --run`) e checagem de tipos (`pnpm typecheck`).
- [ ] 5.3 Executar testes do backend (`uv run pytest -q`) e linting (`uv run ruff check .` e `pnpm lint`).
- [ ] 5.4 Validar responsividade em 360 px, sem overflow e alvos de toque com no mínimo 44 px (WCAG AA).
