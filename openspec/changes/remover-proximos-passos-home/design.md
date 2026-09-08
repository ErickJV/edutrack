## Context

Ver `proposal.md - Why`. O Dashboard (`frontend/src/pages/HomePage.tsx`) exibe no rodapé um grid em duas colunas (`lg:grid-cols-[0.78fr_1.22fr]`) com o perfil acadêmico à esquerda e o card de "Próximos passos" à direita. Como as funcionalidades acadêmicas já foram entregues, este card deve ser removido.

## Goals / Non-Goals

**Goals:**
- Remover integralmente o bloco de "Próximos passos" e os imports/ícones não utilizados em `HomePage.tsx`.
- Ajustar a seção de perfil acadêmico para ocupar a largura total de forma elegante e responsiva.
- Atualizar os testes de frontend para refletir a nova estrutura da Home.

**Non-Goals:**
- Alterar as métricas, dados do perfil ou qualquer comportamento de backend.

## Decisions

### 1. Reestruturação do Rodapé da Home
- **Decisão:** Remover a tag `<section aria-labelledby="coming-soon">` e o grid assimétrico `lg:grid-cols-[0.78fr_1.22fr]`. A seção de informações acadêmicas (`aria-labelledby="academic-profile"`) passa a ser exibida com largura total (`w-full`), com disposição interna em colunas responsivas para graduação, modalidade e vínculo.
- **Racional:** Proporciona uma interface mais direta, focada e sem distrações de funcionalidades fictícias ou preliminares.

## Risks / Trade-offs

- **Testes de UI:** Verificar se `HomePage.test.tsx` possui asserções sobre o texto "Próximos passos" e atualizá-las para refletir a remoção.
