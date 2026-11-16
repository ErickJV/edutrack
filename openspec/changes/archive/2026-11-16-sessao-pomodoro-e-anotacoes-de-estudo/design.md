# Design Técnico: Sessão de Estudo Pomodoro, Metodologias e Caderno de Anotações

## Context

Atualmente a página `/tarefas` possui um cronômetro inline que incrementa minutos sem estrutura de ciclos Pomodoro nem espaço para anotações reflexivas. Para apoiar o aprendizado autônomo dos estudantes da Faculdade Impacta, esta mudança projeta um ambiente completo de estudo concentrado integrando timer Pomodoro personalizável, roteiros pedagógicos de metodologias ativas e um caderno de anotações ("textbook") organizado por pastas. Veja a motivação em `proposal.md` e os requisitos normativos em `specs/`.

## Goals / Non-Goals

**Goals:**
- Prover uma nova tela imersiva `/estudo` acessível diretamente pelo menu ou via redirecionamento de qualquer tarefa em `/tarefas`.
- Implementar timer Pomodoro completo com alternância entre foco, pausa curta e pausa longa, tempos customizáveis pelo aluno e sincronização automática dos minutos executados com a tarefa vinculada.
- Disponibilizar seletor de metodologias ativas (Feynman, Revisão Espaçada, Mapas Mentais e Interrogação Elaborativa) com roteiros práticos exibidos durante a sessão.
- Criar um workspace de anotações (textbook) com árvore de pastas personalizáveis, editor de texto fluido com formatação (estilo Notion) e salvamento automático no backend.
- Garantir isolamento rigoroso de dados entre alunos e suporte a navegação mobile a partir de 360 px com contraste WCAG AA.

**Non-Goals:**
- Não construir um editor com sincronização multiusuário em tempo real (CRDTs/WebSockets); cada aluno gerencia exclusivamente suas próprias notas.
- Não incluir uploads de vídeos ou imagens de alta resolução nas anotações nesta versão.
- Não alterar a grade curricular ou permissões de autenticação do sistema.

## Decisions

### 1. Modelagem de Dados no Backend (`apps/academic`)
- **Decisão**: Criar dois novos modelos relacionais:
  ```python
  class StudyFolder(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
      user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="study_folders")
      name = models.CharField(max_length=100)
      color = models.CharField(max_length=30, default="indigo")
      icon = models.CharField(max_length=50, default="folder")
      created_at = models.DateTimeField(auto_now_add=True)
      updated_at = models.DateTimeField(auto_now=True)

  class StudyNote(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
      user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="study_notes")
      folder = models.ForeignKey(StudyFolder, on_delete=models.SET_NULL, null=True, blank=True, related_name="notes")
      student_subject = models.ForeignKey(StudentSubject, on_delete=models.SET_NULL, null=True, blank=True)
      task = models.ForeignKey(AcademicTask, on_delete=models.SET_NULL, null=True, blank=True)
      title = models.CharField(max_length=200, default="Sem título")
      content = models.TextField(blank=True, default="")
      methodology = models.CharField(max_length=50, blank=True, default="")
      created_at = models.DateTimeField(auto_now_add=True)
      updated_at = models.DateTimeField(auto_now=True)
  ```
- **Justificativa**: Garante que o estudante possa categorizar suas anotações por pastas (como disciplinas, semestres ou temas gerais) e opcionalmente vincular anotações a uma tarefa ou matéria específica.
- **Alternativas consideradas**:
  - *Armazenar notas apenas no localStorage do navegador*: Descartado porque perderia as anotações ao trocar de dispositivo ou limpar cookies/cache.
  - *Embutir notas como campo de texto dentro de AcademicTask*: Descartado porque o usuário solicitou um textbook com pastas no estilo Notion, que precisa existir independentemente de haver uma tarefa pontual.

### 2. Arquitetura do Timer Pomodoro
- **Decisão**: O timer opera em máquina de estados React com 3 modos: `focus` (padrão 25m), `short_break` (padrão 5m) e `long_break` (padrão 15m). O usuário pode alterar as durações através de um modal de preferências, que persiste as configurações no `localStorage` (`edutrack_pomodoro_settings`).
- **Sincronização de Tempo**: Ao concluir um ciclo de foco (ou ao pausar e optar por salvar), o tempo de foco cumprido é adicionado ao `actual_minutes` da tarefa selecionada via chamada à API `PATCH /api/v1/tasks/{id}`.
- **Acessibilidade**: Indicador circular de progresso (SVG acessível com atributos `aria-valuenow`, `aria-valuemin`, `aria-valuemax`), exibição clara de minutos e segundos no título da aba do navegador (`document.title`) e feedback sonoro/visual ao zerar o timer.

### 3. Guias de Metodologias Ativas
- **Decisão**: Implementar um componente `MethodologySelector` que oferece 4 técnicas pedagógicas estruturadas:
  1. **Método Feynman**: 4 etapas estruturadas (escolha do conceito, explicação simples como se fosse para um iniciante, diagnóstico de pontos cegos e refinamento da síntese).
  2. **Revisão Espaçada**: Organização de checkpoints de fixação (revisões em 24h, 3 dias, 1 semana, 1 mês) e autoavaliação de retenção.
  3. **Mapas Mentais**: Estruturação visual com nó principal, ramificações de tópicos e palavras-chave.
  4. **Interrogação Elaborativa**: Perguntas reflexivas do tipo "Por que isto é verdade?", "Qual o impacto prático?" e "Como se conecta a conhecimentos anteriores?".
- **Integração com Anotações**: Ao selecionar uma metodologia, o usuário tem a opção de inserir o template correspondente de perguntas/etapas direto na anotação atual com um clique.

### 4. Interface do Caderno de Anotações (Estilo Notion com Pastas)
- **Decisão**: Layout de dois painéis responsivos:
  - **Sidebar de Pastas e Notas**: Lista de pastas com contagem de notas, botão de nova pasta e nova nota, busca rápida e ações de exclusão/renomeação. Em mobile (< 768 px), funciona como gaveta recolhível (drawer).
  - **Área de Edição**: Título de edição imediata, seletor de pasta associada, barra de atalhos rápidos de formatação (títulos H1/H2, listas de tarefas, destaques de código, citações) e salvamento automático com debounce de 1 segundo.

### 5. Navegação e Redirecionamento
- **Decisão**:
  - Nova rota `/estudo` e `/estudo?taskId=<uuid>` registrada em `App.tsx`.
  - Na tela `/tarefas`, o botão "Iniciar estudo" é transformado em um link acessível que direciona para `/estudo?taskId=<id>`, carregando a tarefa automaticamente como foco da sessão.
  - `AppNavigation.tsx` ganha a aba "Estudo" com ícone de cronômetro/timer (`Timer` do `lucide-react`) entre Tarefas e Disciplinas.

## Risks / Trade-offs

- **[Risco] O usuário fecha a aba durante o ciclo Pomodoro**:
  - *Mitigação*: Armazenar o timestamp de início e término esperado no `sessionStorage`/`localStorage` para que a contagem seja restaurada se a página for recarregada durante o estudo.
- **[Risco] Conflito de salvamento em anotações ao digitar rapidamente**:
  - *Mitigação*: Debounce de 1000 ms nas requisições `PATCH` de notas, com indicador visual de status ("Salvando...", "Salvo") para transparência ao aluno.
