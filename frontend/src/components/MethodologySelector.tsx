import { useMemo } from 'react'
import type { StudyMethodologyKey } from '../api/types'

export type MethodologyInfo = {
  key: StudyMethodologyKey
  title: string
  subtitle: string
  badgeColor: string
  description: string
  steps: string[]
  template: string
}

const METHODOLOGIES: MethodologyInfo[] = [
  {
    key: 'feynman',
    title: 'Método Feynman',
    subtitle: 'Aprenda explicando com máxima simplicidade',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    description:
      'Técnica baseada no princípio de que você só domina um assunto quando é capaz de explicá-lo sem rodeios para um iniciante.',
    steps: [
      'Escolha o conceito central a ser dominado.',
      'Escreva uma explicação como se estivesse ensinando uma pessoa sem experiência no assunto.',
      'Diagnostique as partes onde a explicação travou ou usou jargões desnecessários.',
      'Consulte as fontes, simplifique o raciocínio e use analogias práticas do mundo real.',
    ],
    template: `# [Método Feynman] Tópico: [Conceito Central]

## 1. Explicação em linguagem simples
> Explique aqui com máxima clareza, como se estivesse ensinando alguém sem experiência prévia.

## 2. Analogia do dia a dia
> "Isto é como..." (conecte com um exemplo prático).

## 3. Lacunas encontradas e dúvidas a sanar
- [ ] O que ainda não ficou 100% claro?
- [ ] Qual pergunta um iniciante faria aqui?

## 4. Síntese final refinada
> Redefinição final após consulta aos materiais.
`,
  },
  {
    key: 'spaced_repetition',
    title: 'Revisão Espaçada',
    subtitle: 'Combata a curva do esquecimento com ciclos programados',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
    description:
      'Distribui o esforço de memória ao longo de janelas temporais graduais para converter a retenção em memória de longo prazo.',
    steps: [
      'Primeira fixação (imediata): síntese ativa das ideias principais.',
      '1ª Revisão (+24h): recordar ativamente sem consultar as notas.',
      '2ª Revisão (+3 dias): aplicar em exercícios práticos e resolver problemas.',
      '3ª Revisão (+7 dias) e 4ª Revisão (+30 dias): consolidação final e checagem de retenção.',
    ],
    template: `# [Revisão Espaçada] Tema: [Título do Tópico]

## Checkpoints de Revisão
- [ ] **R1 (24 horas após aula)**: Recordação ativa dos conceitos-chave sem consulta.
- [ ] **R2 (3 dias depois)**: Resolução de exercícios práticos.
- [ ] **R3 (7 dias depois)**: Autoavaliação e identificação de pontos fracos.
- [ ] **R4 (30 dias depois)**: Revisão relâmpago de consolidação final.

## Perguntas de Autoavaliação (Active Recall)
1. Qual é o princípio fundamental deste tópico?
2. Quais são os 3 erros mais comuns ao aplicar esta técnica?
3. Como demonstrar esse funcionamento na prática?
`,
  },
  {
    key: 'mind_map',
    title: 'Mapas Mentais',
    subtitle: 'Estruturação visual e pensamento irradiante',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    description:
      'Organiza conceitos em torno de um nó central ramificando em tópicos principais, facilitando a visão sistêmica e hierárquica.',
    steps: [
      'Defina o conceito nuclear no topo.',
      'Ramifique os pilares fundamentais ou módulos da matéria.',
      'Desdobre sub-ramos com propriedades, regras e exemplos.',
      'Trace conexões cruzadas entre ramos que se relacionam.',
    ],
    template: `# [Mapa Mental] Núcleo Central: [Conceito Principal]

## 🌿 Ramo 1: Fundamentos
- **Definição essencial**: ...
- **Objetivo principal**: ...
- **Pré-requisitos**: ...

## 🌿 Ramo 2: Aplicações Práticas
- **Cenário Real A**: ...
- **Cenário Real B**: ...

## 🌿 Ramo 3: Conexões Interdisciplinares
- Conecta-se com a disciplina através de: ...
- Diferenças fundamentais em relação a outras abordagens: ...
`,
  },
  {
    key: 'elaborative_interrogation',
    title: 'Interrogação Elaborativa',
    subtitle: 'Aprofunde o porquê por trás dos fatos',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    description:
      'Técnica cognitiva focada em indagar ativamente "Por que isso é verdade?" e "Como isso acontece?", gerando conexões explicativas profundas.',
    steps: [
      'Selecione uma afirmação, regra ou fórmula técnica estudada.',
      'Pergunte-se: "Por que esse resultado faz sentido?" e "O que causa essa regra?".',
      'Elabore a resposta conectando com preceitos já aprendidos.',
      'Explore as condições de contorno: o que aconteceria se essa condição não existisse?',
    ],
    template: `# [Interrogação Elaborativa] Assunto: [Tema em Análise]

## Afirmação / Regra Técnica Analisada
> "Insira aqui a definição formal, regra de negócio ou teorema estudado."

## 1. Por que isso é verdadeiro?
> Explique o mecanismo causal por trás desta regra.

## 2. Por que não é o oposto?
> O que falharia ou quebraria no sistema se fosse feito de outra forma?

## 3. Quais são os limites de validade e exceções?
> Em quais situações esse princípio NÃO deve ser aplicado?

## 4. Como isso se conecta com tópicos anteriores?
> Conexão direta com outros conceitos já estudados.
`,
  },
]

export type MethodologySelectorProps = {
  selectedMethodology: StudyMethodologyKey | ''
  onSelectMethodology: (key: StudyMethodologyKey) => void
  onInsertTemplate?: (template: string) => void
}

export function MethodologySelector({
  selectedMethodology,
  onSelectMethodology,
  onInsertTemplate,
}: MethodologySelectorProps) {
  const current = useMemo(
    () => METHODOLOGIES.find((m) => m.key === selectedMethodology) || null,
    [selectedMethodology],
  )

  return (
    <section
      aria-label="Metodologias de Estudo Ativo"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Direcionamento Pedagógico
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">
            Metodologia Ativa de Estudo
          </h3>
        </div>
        {current && onInsertTemplate ? (
          <button
            type="button"
            onClick={() => onInsertTemplate(current.template)}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-50 px-4 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 sm:mt-0"
          >
            Inserir roteiro na anotação
          </button>
        ) : null}
      </div>

      {/* Grid of methodology selector cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METHODOLOGIES.map((m) => {
          const isSelected = m.key === selectedMethodology
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelectMethodology(m.key)}
              className={`flex flex-col items-start rounded-2xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 min-h-16 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/30 dark:ring-indigo-400'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-900'
              }`}
            >
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.badgeColor}`}>
                {m.title}
              </span>
              <span className="mt-2 line-clamp-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {m.subtitle}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected methodology details */}
      {current ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Guia Prático: {current.title}
            </h4>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {current.subtitle}
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {current.description}
          </p>

          <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Etapas recomendadas para este bloco de foco:
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-700 dark:text-slate-300">
              {current.steps.map((step, idx) => (
                <li key={idx} className="leading-snug">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </section>
  )
}
