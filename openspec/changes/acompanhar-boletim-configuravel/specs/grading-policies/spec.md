## Purpose

Permitir que cada aluno descreva a composição de notas de suas disciplinas sem assumir regras institucionais ainda desconhecidas, mantendo versões e cálculos explicáveis.

## ADDED Requirements

### Requirement: Configuração por disciplina e modelos
`GET|PUT /api/v1/student-subjects/{id}/grading-policy` MUST consultar/substituir uma configuração privada com `revision`, `confirmed`, `scale_max`, `passing_grade`, `components`, `map_mode`, `substitution`, `bonus` e `rounding`. GET sem configuração retorna 200 com política nula; PUT válido retorna 200 com nova revisão; envio de revisão desatualizada retorna 409 sem sobrescrever. Regras inválidas retornam 400; sessão ausente 401, CSRF inválido 403, matrícula alheia/inexistente 404. Apenas matrícula selecionada aceita nova configuração; arquivada conserva leitura.

Modelos sugeridos MUST preencher Com PAI: MAP 30%, PR 50%, PAI 20%; Sem PAI: MAP 50%, PR 50%. Escala 0–10 e média mínima 6 são sugestões editáveis; não ativar `confirmed` automaticamente. Componentes finais de peso positivo MUST somar 100%, escala máxima estar entre 1 e 100 e média mínima entre zero e escala. Nomes/códigos e pesos são editáveis, permitindo avaliações adicionais. Fórmulas de código arbitrário MUST ser rejeitadas.

#### Scenario: Personalizar um modelo
- **WHEN** o aluno escolhe Com PAI, muda os pesos para uma soma válida e confirma
- **THEN** apenas aquela disciplina usa a nova política, mostrando revisão e fórmula; futuras mudanças do modelo não alteram sua configuração.

#### Scenario: Configuração inválida ou concorrente
- **WHEN** pesos somam 90%, uma referência é cíclica ou a revisão está desatualizada
- **THEN** recebe 400, 400 ou 409 respectivamente e nenhuma nota/configuração anterior é perdida.

### Requirement: MAP, substitutiva, bônus e arredondamento declarados
MAP MUST permitir `unset`, `manual`, `arithmetic_mean` ou `weighted_mean`. Nos modos por AP, o usuário declara avaliações esperadas (por exemplo AP1/AP2), com pesos relativos positivos no modo ponderado; AP não lançada deixa MAP incompleta. Uma nota manual de MAP não pode ser combinada simultaneamente com APs para cálculo. Política inicial usa `unset` até escolha.

SUB MUST permitir `unset`, `disabled`, `replace_target` ou `best_of_target`, com alvo explícito de avaliação folha e nota substitutiva própria; no modo replace uma SUB lançada substitui o alvo mesmo se menor, best_of escolhe a maior. SUB ausente não altera o alvo. Alvo inexistente, grupo MAP ou cadeia de substituições é inválido. Bônus MUST permitir `unset`, `disabled` ou `add_after_weighted`, com pontos limitados pela escala e teto obrigatório igual a scale_max; sem regra escolhida não aplicar bônus nem emitir média final.

Arredondamento MUST permitir casas 0–2 e método `half_up|truncate`, com decisão de comparação `raw|rounded` explícita; arredondar apenas ao final. Sugestão inicial é duas casas half_up e comparação raw, confirmada pelo usuário como parte da política. Nenhuma dessas opções é afirmada como regra da Impacta.

#### Scenario: Duas avaliações parciais
- **WHEN** o aluno escolhe média aritmética para AP1=8 e AP2=6
- **THEN** MAP é 7; se AP2 estiver vazia, MAP fica pendente e não vira 4.

#### Scenario: Substitutiva configurada
- **WHEN** PR=5, SUB=4 e alvo PR está em replace_target
- **THEN** nota efetiva de PR é 4; mudar para best_of_target produz 5, com valores originais preservados.

#### Scenario: Regras desconhecidas
- **WHEN** existe uma nota de SUB ou bônus, mas a política correspondente está unset
- **THEN** a nota fica salva, o boletim explica a pendência e não inventa sua influência na média final.

#### Scenario: Revisão posterior
- **WHEN** o aluno aprende a regra fixa e altera sua política
- **THEN** uma nova revisão recalcula usando as mesmas notas originais, sem aplicar a alteração a outras disciplinas.
