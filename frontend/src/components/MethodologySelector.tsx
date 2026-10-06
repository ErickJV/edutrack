import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
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
    badgeColor: 'bg-[#0d3950]/10 text-[#0d3950] dark:bg-[#005063]/30 dark:text-[#a8d5e5]',
    description:
      'Técnica baseada no princípio de que você só domina um assunto quando é capaz de explicá-lo sem rodeios para um iniciante.',
    steps: [
      'Escolha o conceito central a ser dominado.',
      'Escreva uma explicação como se estivesse ensinando uma pessoa sem experiência.',
      'Diagnostique as partes onde a explicação travou ou usou jargões desnecessários.',
      'Consulte as fontes, simplifique o raciocínio e use analogias práticas.',
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
    subtitle: 'Combata a curva do esquecimento com ciclos',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
    description:
      'Distribui o esforço de memória ao longo de janelas temporais graduais para converter a retenção em memória de longo prazo.',
    steps: [
      'Primeira fixação (imediata): síntese ativa das ideias principais.',
      '1ª Revisão (+24h): recordar ativamente sem consultar as notas.',
      '2ª Revisão (+3 dias): aplicar em exercícios práticos.',
      '3ª Revisão (+7 dias) e 4ª Revisão (+30 dias): consolidação final.',
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
      'Técnica focada em indagar ativamente "Por que isso é verdade?" e "Como isso acontece?", gerando conexões explicativas profundas.',
    steps: [
      'Selecione uma afirmação, regra ou teorema estudado.',
      'Pergunte-se: "Por que esse resultado faz sentido?".',
      'Elabore a resposta conectando com preceitos aprendidos.',
      'Explore as condições de contorno e exceções.',
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
  const [isOpen, setIsOpen] = useState(false)

  const current = useMemo(
    () => METHODOLOGIES.find((m) => m.key === selectedMethodology) || METHODOLOGIES[0],
    [selectedMethodology],
  )

  return (
    <section
      aria-label="Metodologias de Estudo Ativo"
      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition dark:border-[#005063]/30 dark:bg-[#081a26]"
    >
      <div>
        {/* Header with Title and Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#005063]/10 text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
              <BookOpen className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-tight text-[#0d3950] dark:text-white">
                Metodologia de Estudo
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {current.title} · {current.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label="Expandir ou recolher guia de metodologias"
            className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {/* Collapsible Drawer Content */}
        {isOpen ? (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            {/* Methodology Selection Tabs/Pills */}
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" aria-label="Escolher metodologia">
              {METHODOLOGIES.map((m) => {
                const isSelected = m.key === (selectedMethodology || 'feynman')
                return (
                  <button
                    key={m.key}
                    type="button"
                    aria-label={`Selecionar ${m.title}`}
                    onClick={() => onSelectMethodology(m.key)}
                    className={`inline-flex min-h-7 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-[#005063] ${
                      isSelected
                        ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#041019] dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{m.title}</span>
                  </button>
                )
              })}
            </div>

            {/* Active Guide Card */}
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-[#005063]/20 dark:bg-[#041019]">
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {current.description}
              </p>

              <div className="mt-2.5 grid grid-cols-1 gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-800/60 sm:grid-cols-2">
                {current.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#005063]/10 text-[9px] font-black text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
                      {idx + 1}
                    </span>
                    <span className="leading-tight">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insert template button */}
            {onInsertTemplate ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onInsertTemplate(current.template)}
                  aria-label="Inserir roteiro na anotação"
                  className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0d3950] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#005063] focus-visible:outline-2 focus-visible:outline-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
                >
                  <Sparkles className="size-3.5 text-amber-400 dark:text-amber-500" aria-hidden="true" />
                  <span>Inserir roteiro na anotação</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
