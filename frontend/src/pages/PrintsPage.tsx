import { useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Eye,
  CheckCircle2,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { ThemeToggle } from '../components/ThemeToggle'

interface CrudItem {
  id: string
  entity: 'Tarefas' | 'Matérias' | 'Usuário'
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  endpoint: string
  title: string
  description: string
  statusCode: number
  statusText: string
  image: string
  requestPayload?: string
  responsePayload?: string
}

const METHOD_BADGE_COLORS: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-emerald-600 text-white',
  PATCH: 'bg-amber-600 text-white',
  PUT: 'bg-orange-600 text-white',
  DELETE: 'bg-rose-600 text-white',
}

const CRUD_OPERATIONS: CrudItem[] = [
  // ==========================================
  // TAREFAS
  // ==========================================
  {
    id: 'tasks-post',
    entity: 'Tarefas',
    method: 'POST',
    endpoint: '/api/v1/tasks',
    title: 'Criar Tarefa Acadêmica (Create)',
    description: 'Criação de nova tarefa de estudo vinculada a uma disciplina, com título, prazo fatal e tempo estimado.',
    statusCode: 201,
    statusText: 'Created',
    image: '/prints/crud_tasks_post.png',
    requestPayload: JSON.stringify(
      {
        student_subject: '833d0a99-bc77-4cda-9552-87c41976694f',
        title: 'Entrega AC2 - Estruturas de Dados Avançadas',
        description: 'Desenvolver testes e documentação das funções de balanceamento AVL.',
        due_date: '2026-10-25T23:59:00Z',
        estimated_minutes: 120,
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        id: '30777911-5c6b-4b6b-b82c-16cdca7e5717',
        student_subject: '833d0a99-bc77-4cda-9552-87c41976694f',
        subject_id: '5a3d7134-ebdf-56e9-bb65-c10a0cd683a7',
        subject_name: 'Application Data Persistence',
        subject_semester: 1,
        title: 'Entrega AC2 - Estruturas de Dados Avançadas',
        description: 'Desenvolver testes e documentação das funções de balanceamento AVL.',
        due_date: '2026-10-25T20:59:00-03:00',
        status: 'pending',
        estimated_minutes: 120,
        actual_minutes: 0,
        completed_at: null,
        created_at: '2026-10-06T21:38:14.537188-03:00',
        updated_at: '2026-10-06T21:38:14.537193-03:00',
      },
      null,
      2
    ),
  },
  {
    id: 'tasks-get',
    entity: 'Tarefas',
    method: 'GET',
    endpoint: '/api/v1/tasks',
    title: 'Listar Tarefas do Estudante (Read)',
    description: 'Consulta todas as tarefas cadastradas pelo aluno autenticado com status, tempos e disciplina vinculada.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_tasks_get.png',
    responsePayload: JSON.stringify(
      [
        {
          id: '2e4eea29-f391-49b4-8501-1acbe40ea468',
          student_subject: '833d0a99-bc77-4cda-9552-87c41976694f',
          subject_id: '5a3d7134-ebdf-56e9-bb65-c10a0cd683a7',
          subject_name: 'Application Data Persistence',
          subject_semester: 1,
          title: 'Implementação de Árvore Binária de Busca',
          description: 'Construir métodos de inserção, remoção e percurso em-ordem.',
          due_date: '2026-10-15T20:59:00-03:00',
          status: 'pending',
          estimated_minutes: 90,
          actual_minutes: 0,
          completed_at: null,
          created_at: '2026-10-06T20:40:03.980024-03:00',
          updated_at: '2026-10-06T20:40:03.980029-03:00',
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'tasks-patch',
    entity: 'Tarefas',
    method: 'PATCH',
    endpoint: '/api/v1/tasks/{id}',
    title: 'Atualizar Tarefa (Update)',
    description: 'Atualização parcial de campos da tarefa: transição de status para "em andamento" e registro de minutos investidos.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_tasks_patch.png',
    requestPayload: JSON.stringify(
      {
        status: 'in_progress',
        actual_minutes: 45,
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        id: '2e4eea29-f391-49b4-8501-1acbe40ea468',
        student_subject: '833d0a99-bc77-4cda-9552-87c41976694f',
        subject_id: '5a3d7134-ebdf-56e9-bb65-c10a0cd683a7',
        subject_name: 'Application Data Persistence',
        subject_semester: 1,
        title: 'Implementação de Árvore Binária de Busca',
        description: 'Construir métodos de inserção, remoção e percurso em-ordem.',
        due_date: '2026-10-15T20:59:00-03:00',
        status: 'in_progress',
        estimated_minutes: 90,
        actual_minutes: 45,
        completed_at: null,
        created_at: '2026-10-06T20:40:03.980024-03:00',
        updated_at: '2026-10-06T21:38:19.329734-03:00',
      },
      null,
      2
    ),
  },
  {
    id: 'tasks-delete',
    entity: 'Tarefas',
    method: 'DELETE',
    endpoint: '/api/v1/tasks/{id}',
    title: 'Excluir Tarefa (Delete)',
    description: 'Remoção definitiva de uma tarefa acadêmica por UUID com retorno de confirmação sem corpo (RFC 204 No Content).',
    statusCode: 204,
    statusText: 'No Content',
    image: '/prints/crud_tasks_delete.png',
    requestPayload: 'Parâmetro de rota: id = "30777911-5c6b-4b6b-b82c-16cdca7e5717"',
    responsePayload: '/* HTTP 204 No Content — Objeto removido do banco com sucesso */',
  },

  // ==========================================
  // MATÉRIAS (STUDENT SUBJECTS & CURRICULUM)
  // ==========================================
  {
    id: 'subjects-post',
    entity: 'Matérias',
    method: 'POST',
    endpoint: '/api/v1/student-subjects',
    title: 'Matricular Disciplinas do Semestre (Create)',
    description: 'Matrícula em lote de disciplinas oficiais do curso para o período letivo ativo.',
    statusCode: 201,
    statusText: 'Created',
    image: '/prints/crud_subjects_post.png',
    requestPayload: JSON.stringify(
      {
        semester_period: '2026/1',
        subject_ids: [
          '5a3d7134-ebdf-56e9-bb65-c10a0cd683a7',
          '0a44cb2e-b6a6-5fa4-9721-a3fc6b1a3e6f',
        ],
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      [
        {
          id: '833d0a99-bc77-4cda-9552-87c41976694f',
          subject: {
            id: '5a3d7134-ebdf-56e9-bb65-c10a0cd683a7',
            name: 'Application Data Persistence',
            workload_hours: 80,
          },
          status: 'active',
          semester_period: '2026/1',
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'subjects-get',
    entity: 'Matérias',
    method: 'GET',
    endpoint: '/api/v1/student-subjects',
    title: 'Listar Disciplinas Matriculadas (Read)',
    description: 'Consulta detalhada das matérias em andamento do aluno, progresso percentual e professor titular.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_subjects_get.png',
    responsePayload: JSON.stringify(
      [
        {
          id: '833d0a99-bc77-4cda-9552-87c41976694f',
          subject: {
            id: '5a3d7134-ebdf-56e9-bb65-c10a0cd683a7',
            course_name: 'Ciência da Computação',
            name: 'Application Data Persistence',
            code: 'CC101',
            semester: 1,
            workload_hours: 80,
          },
          professor: null,
          custom_workload_hours: null,
          effective_workload_hours: 80,
          status: 'active',
          semester_period: '2026/1',
          progress_percent: 0,
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'subjects-patch',
    entity: 'Matérias',
    method: 'PATCH',
    endpoint: '/api/v1/student-subjects/{id}',
    title: 'Atualizar Dados da Disciplina (Update)',
    description: 'Ajuste de carga horária declarada customizada e vinculação nominal de professor.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_subjects_patch.png',
    requestPayload: JSON.stringify(
      {
        custom_workload_hours: 90,
        professor_name: 'Prof. Alan Turing',
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        id: '833d0a99-bc77-4cda-9552-87c41976694f',
        professor_name: 'Prof. Alan Turing',
        display_professor_name: 'Prof. Alan Turing',
        custom_workload_hours: 90,
        effective_workload_hours: 90,
        status: 'active',
        semester_period: '2026/1',
      },
      null,
      2
    ),
  },
  {
    id: 'curriculum-get',
    entity: 'Matérias',
    method: 'GET',
    endpoint: '/api/v1/curriculum',
    title: 'Consultar Matriz Curricular Oficial (Catalog Read)',
    description: 'Lista todas as disciplinas oficiais cadastradas no curso do aluno autenticado.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_curriculum_get.png',
    responsePayload: JSON.stringify(
      [
        {
          id: '5a3d7134-ebdf-56e9-bb65-c10a0cd683a7',
          course_name: 'Ciência da Computação',
          name: 'Application Data Persistence',
          code: 'CC101',
          semester: 1,
          workload_hours: 80,
          active: true,
        },
        {
          id: '0a44cb2e-b6a6-5fa4-9721-a3fc6b1a3e6f',
          course_name: 'Ciência da Computação',
          name: 'Innovation Lab: Agile Dev in No/Low-Code',
          code: 'CC102',
          semester: 1,
          workload_hours: 80,
          active: true,
        },
      ],
      null,
      2
    ),
  },

  // ==========================================
  // USUÁRIO E PERFIL
  // ==========================================
  {
    id: 'profile-get',
    entity: 'Usuário',
    method: 'GET',
    endpoint: '/api/v1/profile',
    title: 'Consultar Perfil do Estudante (Read)',
    description: 'Obtém os dados cadastrais do aluno autenticado, graduação, modalidade e status de conclusão.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_profile_get.png',
    responsePayload: JSON.stringify(
      {
        id: '814faf62-bcf6-4647-9217-6cc3929e039a',
        email: 'erick.jonathan@aluno.impacta.edu.br',
        full_name: 'Erick Jonathan Vasquez Pereira',
        course_offering: {
          id: 'ab4d5145-92b6-5b2c-8208-6ffc5f159eaf',
          course_name: 'Ciência da Computação',
          degree_type_label: 'Bacharelado',
          modality_label: 'Presencial',
          label: 'Ciência da Computação — Presencial',
        },
        profile_complete: true,
        has_usable_password: true,
      },
      null,
      2
    ),
  },
  {
    id: 'profile-put',
    entity: 'Usuário',
    method: 'PUT',
    endpoint: '/api/v1/profile',
    title: 'Atualizar Perfil do Estudante (Update)',
    description: 'Atualização do nome completo, vinculação de oferta de graduação e registro de consentimento legal.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_profile_put.png',
    requestPayload: JSON.stringify(
      {
        full_name: 'Erick Jonathan Vasquez Pereira',
        course_offering_id: 'ab4d5145-92b6-5b2c-8208-6ffc5f159eaf',
        accept_legal: true,
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        id: '814faf62-bcf6-4647-9217-6cc3929e039a',
        email: 'erick.jonathan@aluno.impacta.edu.br',
        full_name: 'Erick Jonathan Vasquez Pereira',
        profile_complete: true,
      },
      null,
      2
    ),
  },
  {
    id: 'course-offerings-get',
    entity: 'Usuário',
    method: 'GET',
    endpoint: '/api/v1/course-offerings',
    title: 'Listar Cursos e Modalidades (Catalog Read)',
    description: 'Consulta pública das ofertas ativas de graduação da Faculdade Impacta.',
    statusCode: 200,
    statusText: 'OK',
    image: '/prints/crud_course_offerings_get.png',
    responsePayload: JSON.stringify(
      [
        {
          id: '9da7a3e1-e180-5bc0-9c00-ae907181451e',
          course_name: 'Análise e Desenvolvimento de Sistemas',
          degree_type_label: 'Tecnólogo',
          modality_label: 'Presencial',
        },
        {
          id: 'ab4d5145-92b6-5b2c-8208-6ffc5f159eaf',
          course_name: 'Ciência da Computação',
          degree_type_label: 'Bacharelado',
          modality_label: 'Presencial',
        },
      ],
      null,
      2
    ),
  },
]

export function PrintsPage() {
  const [selectedEntity, setSelectedEntity] = useState<string>('Todas')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeCodeTab, setActiveCodeTab] = useState<Record<string, 'request' | 'response'>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredItems =
    selectedEntity === 'Todas'
      ? CRUD_OPERATIONS
      : CRUD_OPERATIONS.filter((item) => item.entity === selectedEntity)

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#030d14] dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-[#041019]/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-[#071926] dark:text-slate-300 dark:hover:bg-[#0a2336]"
            >
              <ArrowLeft size={14} />
              Voltar ao Início
            </Link>
            <Brand />
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/docs/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#005063] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#003d4d]"
            >
              <ExternalLink size={14} />
              Abrir Swagger UI
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white px-4 py-8 dark:border-white/10 dark:bg-[#041019] sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005063] dark:text-[#52c8dc]">
                <CheckCircle2 size={16} />
                Comprovação de APIs &amp; CRUDs em Produção
              </div>
              <h1 className="mt-1 font-montserrat text-2xl font-black text-[#0d3950] dark:text-white sm:text-3xl">
                Prints e Evidências dos CRUDs
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                Execuções reais das rotas REST de <strong>Tarefas</strong>, <strong>Matérias</strong> e <strong>Usuário</strong> capturadas no Swagger UI OpenAPI 3.0. Cada registro exibe os cabeçalhos, o <strong>Request Payload</strong>, o status HTTP retornado e o <strong>Response Body</strong> completo sem cortes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-white/10 dark:bg-[#071926]">
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">11 Operações</div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">GET, POST, PATCH, DEL</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-white/10 dark:bg-[#071926]">
                <div className="text-xl font-black text-[#005063] dark:text-[#52c8dc]">200 / 201</div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Respostas HTTP</div>
              </div>
            </div>
          </div>

          {/* Module Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
            <span className="text-xs font-bold text-slate-500 mr-1">Filtrar Módulo:</span>
            {['Todas', 'Tarefas', 'Matérias', 'Usuário'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedEntity(tab)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  selectedEntity === tab
                    ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-[#081e2e] dark:text-slate-300 dark:hover:bg-[#0d2a3f]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid of CRUD Operations */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const currentTab = activeCodeTab[item.id] || (item.requestPayload ? 'request' : 'response')
            return (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md dark:border-white/10 dark:bg-[#041019]"
              >
                {/* Card Top Header */}
                <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4 dark:border-white/10 dark:bg-[#071926]/90">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`rounded-md px-2.5 py-1 font-mono text-xs font-black uppercase tracking-wider ${METHOD_BADGE_COLORS[item.method] || 'bg-slate-600 text-white'}`}>
                        {item.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                        {item.endpoint}
                      </span>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black ${
                      item.statusCode >= 200 && item.statusCode < 300
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400'
                    }`}>
                      {item.statusCode} {item.statusText}
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-base font-extrabold text-[#0d3950] dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Screenshot Preview with Tap to Zoom */}
                <div className="relative border-b border-slate-200 bg-slate-900 dark:border-white/10 group">
                  <img
                    src={item.image}
                    alt={`${item.title} Screenshot Swagger`}
                    className="w-full object-cover max-h-72 object-top transition duration-300 group-hover:opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setSelectedImage(item.image)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-lg hover:bg-slate-100"
                    >
                      <Eye size={14} />
                      Ver Print Completo
                    </button>
                    <a
                      href={item.image}
                      download
                      className="inline-flex items-center gap-2 rounded-xl bg-[#005063] px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-[#003d4d]"
                    >
                      <Download size={14} />
                      Baixar PNG
                    </a>
                  </div>
                </div>

                {/* Interactive Code Viewer (Request / Response Payloads) */}
                <div className="flex flex-1 flex-col p-4 bg-slate-50/50 dark:bg-[#030d14]/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-white/10">
                    <div className="flex gap-2">
                      {item.requestPayload ? (
                        <button
                          type="button"
                          onClick={() => setActiveCodeTab((prev) => ({ ...prev, [item.id]: 'request' }))}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            currentTab === 'request'
                              ? 'bg-[#005063] text-white'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          Request Payload
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab((prev) => ({ ...prev, [item.id]: 'response' }))}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          currentTab === 'response'
                            ? 'bg-[#005063] text-white'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        Response Body
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const content = currentTab === 'request' ? item.requestPayload : item.responsePayload
                        if (content) copyToClipboard(content, `${item.id}-${currentTab}`)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                      {copiedId === `${item.id}-${currentTab}` ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copiar JSON
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Block Content */}
                  <div className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3.5 text-xs text-slate-100 font-mono shadow-inner max-h-56">
                    <pre className="leading-relaxed">
                      {currentTab === 'request' ? item.requestPayload : item.responsePayload}
                    </pre>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mt-4 flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedImage(item.image)}
                      className="text-xs font-bold text-[#005063] hover:underline dark:text-[#52c8dc] inline-flex items-center gap-1"
                    >
                      <Eye size={13} />
                      Visualizar Print sem Cortes &rarr;
                    </button>
                    <a
                      href={item.image}
                      download
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-[#071926] dark:text-slate-300 dark:hover:bg-[#0a2336] inline-flex items-center gap-1.5"
                    >
                      <Download size={12} />
                      Baixar Imagem
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>

      {/* Lightbox Modal (Full-Resolution Unclipped Screenshot Viewer) */}
      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative flex max-h-[95vh] max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-3 text-white">
              <span className="font-mono text-xs text-slate-400">{selectedImage}</span>
              <div className="flex items-center gap-3">
                <a
                  href={selectedImage}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#005063] px-3 py-1 text-xs font-bold text-white hover:bg-[#003d4d]"
                >
                  <Download size={14} />
                  Baixar Imagem
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-auto p-2">
              <img
                src={selectedImage}
                alt="Visualização Completa do Swagger"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-[#041019]">
        <p>Impatrack &copy; {new Date().getFullYear()} &mdash; Faculdade Impacta de Tecnologia. Comprovação de APIs e CRUDs desenvolvidos.</p>
      </footer>
    </div>
  )
}
