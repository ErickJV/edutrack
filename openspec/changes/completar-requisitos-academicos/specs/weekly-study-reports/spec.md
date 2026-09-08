## Purpose

Disponibilizar uma síntese semanal privada que o estudante possa consultar e baixar em PDF, com métricas consistentes e limitações de dados claramente identificadas.

## ADDED Requirements

### Requirement: Relatório semanal sob demanda
`GET /api/v1/reports/weekly?week_start=YYYY-MM-DD&format=json|pdf` MUST exigir sessão, aceitar segunda-feira local como início (padrão segunda da semana atual) e gerar intervalo até a segunda seguinte, exclusivo, em America/Sao_Paulo. Data futura ou dia não segunda retorna 400. JSON retorna 200 com intervalo, instante de geração, minutos por disciplina datados naquela semana, conclusões atuais com data naquela semana, tarefas atualmente atrasadas/urgentes, progresso atual por tarefas/aulas e insights com amostra; cada seção MUST distinguir informação da semana de retrato atual. Sem dados retorna relatório vazio informativo. PDF MUST usar os mesmos valores do JSON e resposta `application/pdf`, download com nome seguro, `Cache-Control: private, no-store`; nenhuma URL pública é criada.

#### Scenario: Fechamento semanal consistente
- **WHEN** o aluno gera JSON e PDF para uma semana com 90 minutos datados e 120 sem data
- **THEN** ambos apresentam 90 na semana e saldo sem data separado, com o mesmo fuso e regras de cálculo
- **AND** a semana atual é marcada parcial; corrigir registros e gerar de novo atualiza os dados, sem alegar histórico imutável.

#### Scenario: Limites de data e privacidade
- **WHEN** o aluno informa terça-feira, data futura ou requisita sem sessão
- **THEN** recebe 400, 400 ou 401, sem exposição de relatórios de terceiros.

### Requirement: Apresentação e falhas
A UI MUST oferecer consulta de semana, versão HTML acessível e botão de download, com estado gerando, erro recuperável e prevenção de múltiplos disparos simultâneos. PDF MUST manter texto pesquisável, acentos, tabelas/gráficos legíveis, cabeçalhos e paginação sem cortes; seus dados equivalentes MUST continuar disponíveis em HTML. Geração MUST respeitar limite de 1.000 linhas de detalhe e 15s: exceder retorna erro explícito 422/503, sem arquivo truncado e sem omitir totais silenciosamente. Mais de dez gerações PDF por minuto por usuário MUST retornar 429 com Retry-After. Um relatório semanal de até 100 tarefas e 200 registros MUST ser gerado em até 2s no ambiente de referência documentado.

#### Scenario: Falha de geração
- **WHEN** a geração excede o limite ou falha
- **THEN** a interface mantém a versão HTML/JSON e informa como tentar novamente, sem disponibilizar PDF incompleto.

#### Scenario: Renderização longa
- **WHEN** o relatório contém nomes longos, acentos e múltiplas páginas
- **THEN** valores e textos continuam legíveis e conferem com a visualização HTML, inclusive sem estudo na semana.
