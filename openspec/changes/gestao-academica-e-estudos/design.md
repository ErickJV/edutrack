## Context

Ver `proposal.md - Why`. O EduTrack possui monorepo configurado com Django 5.2 (DRF) e React 19 (TypeScript/Tailwind 4), autenticação institucional validada e catálogo de cursos (`apps.catalog.Course` e `CourseOffering`). O usuário autenticado possui `course_offering` associado.

## Goals / Non-Goals

**Goals:**
- Modelar o domínio acadêmico com tabelas normalizadas para disciplinas da matriz (`Subject`), matrícula ativa do estudante (`StudentSubject`) e tarefas acadêmicas (`AcademicTask`).
- Disponibilizar matriz curricular das graduações da Impacta sem exigir scraping dinâmico com credenciais do aluno no portal em tempo de execução.
- Garantir isolamento rigoroso por usuário em todas as consultas e mutações de dados acadêmicos.
- Oferecer endpoints REST otimizados com tempo de resposta < 1s e documentação OpenAPI via drf-spectacular.
- Entregar frontend com design system existente, navegação responsiva e suporte WCAG AA.

**Non-Goals:**
- Scraping automatizado em tempo real contra o portal acadêmico da Impacta.
- Gestão de notas e faltas oficiais da instituição.
- Compartilhamento social ou multiusuário de tarefas.

## Decisions

### 1. Novo App Django: `apps.academic`
- **Decisão:** Centralizar `Subject`, `StudentSubject` e `AcademicTask` em um novo app `apps.academic`, mantendo `apps.catalog` restrito às definições gerais de cursos e ofertas.
- **Racional:** Desacopla o catálogo geral da instituição das entidades mutáveis de acompanhamento do estudante, facilitando testes e futuras evoluções.
- **Alternativas consideradas:**
  - *Colocar tudo em `apps.catalog`:* Poluiria o catálogo com regras de negócios específicas de tarefas e alunos.
  - *Criar múltiplos apps (`apps.subjects`, `apps.tasks`):* Fragmentação excessiva para a complexidade atual do projeto.

### 2. Matriz Curricular Pré-carregada e Determinística
- **Decisão:** As disciplinas dos cursos (ex.: Análise e Desenvolvimento de Sistemas, Ciência da Computação, Sistemas de Informação) serão cadastradas via migração com sementes idempotentes, utilizando `uuid.uuid5` baseado no slug do curso e código da disciplina.
- **Racional:** Elimina a necessidade do aluno digitar matérias manualmente e atende à permissão do professor de utilizar os dados oficiais da faculdade, sem os riscos de instabilidade ou bloqueio de um web scraper em tempo de execução.
- **Alternativa descartada:** Scraping sob demanda no portal do aluno durante o cadastro (inviável por exigir credenciais do portal, fragilidade de mudanças de layout e risco de lentidão extrema).

### 3. Associação de Disciplinas Ativas (`StudentSubject`)
- **Decisão:** O estudante escolhe o semestre letivo de referência (1º ao 8º) e o sistema sugere as disciplinas padrão daquele semestre do seu curso, permitindo marcar/desmarcar matérias.
- **Racional:** Oferece excelente experiência de uso (um clique para carregar o semestre inteiro), mas permite personalização caso o estudante esteja cursando dependências ou matérias em outros semestres.

### 4. Modelo de Tarefas (`AcademicTask`) e Cálculo de Progresso
- **Decisão:** Cada tarefa possui `estimated_minutes` (tempo previsto) e `actual_minutes` (tempo realizado acumulado).
- **Fórmula de Progresso:**
  - Progresso da Disciplina: $\text{tarefas\_concluídas} / \text{tarefas\_totais} \times 100$ (0% se não houver tarefas).
  - Progresso Global no Dashboard: Média ponderada pela carga horária:
    $$\text{Progresso Global} = \frac{\sum (\text{progresso}_i \times \text{carga\_horaria}_i)}{\sum \text{carga\_horaria}_i}$$
- **Racional:** Reflete com precisão o peso real de matérias mais longas (ex.: 80h vs 40h).

### 5. Frontend: Rotas e Estrutura de Telas
- **Decisão:** Adicionar barra de navegação superior/lateral acessível conectando:
  - `/home` (Dashboard com métricas, progresso e próximas entregas)
  - `/disciplinas` (Minhas Disciplinas e Grade Curricular)
  - `/tarefas` (Quadro/Lista de Tarefas com filtros e apontamento de tempo)
- **Racional:** Mantém a simplicidade de uso mobile-first respeitando a paleta já consolidada em `styles.css`.

## Risks / Trade-offs

- **Descompasso da grade com turmas veteranas:** Novas turmas podem ter matrizes com disciplinas ligeiramente diferentes. *Mitigação:* Versionar a grade por matriz curricular e permitir, em versões futuras, a inclusão de disciplina avulsa se necessário.
- **Sobrecarga de chamadas no dashboard:** O dashboard consolida métricas de múltiplas tabelas. *Mitigação:* Endpoint dedicado `GET /api/v1/dashboard/summary` com consultas otimizadas (`select_related`, contagens agregadas em um único `QuerySet`) respondendo em < 100ms.
