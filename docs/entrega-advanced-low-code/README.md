# Entrega — 16 tarefas (Advanced Low Code)

Documento de entrega das 16 tarefas da disciplina, montado a partir deste repositório.

## Arquivos

- `Entrega-16-Tarefas-Advanced-Low-Code.pdf` — documento final (45 páginas, 41 figuras).
- `content.py` — texto das 16 tarefas: objetivo, entregas, figuras, blocos de terminal e critérios.
- `build_report.py` — gera `report.html` a partir de `content.py` e dos assets.
- `report.html` — versão navegável do documento.
- `seed_demo.py` — cria o usuário de demonstração e os dados usados nas capturas.
- `assets/` — capturas (`app/`, `github/`, `ide/`, `prints/`), saídas de terminal (`txt/`),
  PDF gerado na hora (`relatorio-demo.pdf`) e páginas renderizadas para conferência (`validacao/`).

## Regerar

```bash
cd docs/entrega-advanced-low-code
python build_report.py          # regrava report.html
chrome --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=Entrega-16-Tarefas-Advanced-Low-Code.pdf \
  "file:///<caminho absoluto>/report.html"
```

Qualquer navegador Chromium serve para a última etapa; a impressão usa A4, margens do
próprio CSS e `printBackground` habilitado por padrão na impressão de `report.html`.

## Dados de demonstração

As capturas de tela usam apenas o usuário `erick.demo@aluno.impacta.edu.br` (banco SQLite
local, removido após a geração). O PDF versionado em `docs/relatorio-desempenho-edutrack.pdf`
pertence a outro estudante e não é exibido no documento.
