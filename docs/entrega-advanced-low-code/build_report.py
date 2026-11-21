"""Monta report.html a partir de content.py e dos assets capturados.

Uso:
    python build_report.py

O HTML gerado e impresso em A4 pelo navegador (ver README da pasta) para
produzir o PDF final de entrega.
"""

from __future__ import annotations

import html
import re
from pathlib import Path

import content

BASE = Path(__file__).resolve().parent
ASSETS = BASE / "assets"
REPO = BASE.parent.parent

STATUS_CLASS = {
    content.STATUS_ATENDIDO: "ok",
    content.STATUS_EQUIVALENTE: "equiv",
    content.STATUS_PARCIAL: "partial",
    content.STATUS_NAO_APLICAVEL: "na",
}

CSS = """
@page { size: A4; margin: 13mm 11mm 14mm; }
* { box-sizing: border-box; }
html { font-size: 10.5pt; }
body {
  margin: 0;
  font-family: "Segoe UI", system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
h1, h2, h3, h4 { color: #0f172a; line-height: 1.2; margin: 0 0 6px; }
h1 { font-size: 22pt; }
h2 { font-size: 15pt; margin-top: 4px; }
h3 { font-size: 11.5pt; margin-top: 14px; }
h4 { font-size: 10.5pt; margin-top: 12px; }
p { margin: 0 0 8px; orphans: 2; widows: 2; }
ul, ol { margin: 0 0 10px; padding-left: 18px; }
li { margin-bottom: 3px; orphans: 2; widows: 2; }
code {
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 8.8pt;
  background: #f1f5f9;
  border-radius: 3px;
  padding: 0 2px;
}
a { color: #0f766e; text-decoration: none; word-break: break-all; }
.small { font-size: 9pt; color: #64748b; }
.muted { color: #64748b; }

/* Capa */
.cover { height: 255mm; display: flex; flex-direction: column; justify-content: space-between; }
.cover .brand { font-size: 12pt; letter-spacing: .18em; text-transform: uppercase; color: #0f766e; font-weight: 700; }
.cover h1 { font-size: 30pt; margin-top: 10mm; }
.cover .subtitle { font-size: 13pt; color: #0f172a; margin-top: 4mm; font-weight: 600; }
.cover .rule { height: 3px; background: #0f766e; width: 46mm; margin: 8mm 0; }
.cover dl { margin: 0; }
.cover dt { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .12em; color: #64748b; margin-top: 5mm; }
.cover dd { margin: 2px 0 0; font-size: 12pt; font-weight: 600; }
.cover footer { font-size: 8.5pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4mm; }

/* Secoes */
section { break-before: page; }
section.plain { break-before: page; }
.task-head { border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 10px; }
.task-head .kicker { font-size: 9pt; color: #0f766e; font-weight: 700; }
.modulo { font-size: 8.5pt; color: #64748b; margin-top: 3px; }

figure { margin: 10px 0; break-inside: avoid; }
figure img { max-width: 100%; max-height: 67mm; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; display: block; }
figcaption { font-size: 8.5pt; color: #64748b; margin-top: 4px; }
figcaption b { color: #0f172a; }

table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 9pt; }
tr { break-inside: avoid; }
thead { display: table-header-group; }
th, td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; vertical-align: top; }
th { background: #f1f5f9; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .04em; color: #475569; }
tbody tr:nth-child(even) td { background: #fafbfc; }
.status { font-weight: 700; white-space: nowrap; }
.status.ok { color: #047857; }
.status.equiv { color: #b45309; }
.status.partial { color: #b91c1c; }
.status.na { color: #475569; }

pre.term {
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 7pt;
  line-height: 1.3;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 8px 0 12px;
  break-inside: avoid;
}
pre.doc {
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 7.2pt;
  line-height: 1.4;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 10px;
  white-space: pre-wrap;
  margin: 8px 0 12px;
}
.label { font-size: 8pt; text-transform: uppercase; letter-spacing: .1em; color: #64748b; margin-top: 10px; }

.nota {
  border-left: 3px solid #b45309;
  background: #fffbeb;
  padding: 8px 10px;
  border-radius: 0 6px 6px 0;
  margin: 10px 0 4px;
  font-size: 9pt;
}
.nota b { color: #92400e; }

.toc { columns: 2; column-gap: 10mm; font-size: 10pt; }
.toc div { break-inside: avoid; margin-bottom: 3px; }
.toc .num { color: #0f766e; font-weight: 700; display: inline-block; width: 18mm; }

.callout { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 10px 12px; font-size: 9pt; }
"""


def safe(text: str) -> str:
    """Escapa o texto, preservando as tags <code> usadas no conteudo."""
    escaped = html.escape(text, quote=False)
    escaped = escaped.replace("&lt;code&gt;", "<code>").replace("&lt;/code&gt;", "</code>")
    return escaped


def read_txt(relative: str) -> str:
    path = ASSETS / relative
    return path.read_text(encoding="utf-8", errors="replace").rstrip()


def figure_counter() -> "callable":
    state = {"n": 0}

    def next_number() -> int:
        state["n"] += 1
        return state["n"]

    return next_number


def render_figure(rel: str, caption: str, source: str, number: int) -> str:
    path = ASSETS / rel
    if not path.exists():
        raise SystemExit(f"Figura ausente: {path}")
    return (
        "<figure>"
        f'<img src="assets/{rel}" alt="{html.escape(caption, quote=True)}">'
        f"<figcaption><b>Figura {number}</b> &mdash; {safe(caption)}. "
        f"<span class=\"muted\">Fonte: {safe(source)}.</span></figcaption>"
        "</figure>"
    )


def render_code(title: str, spec: str) -> str:
    if spec.startswith("literal:"):
        key = spec.split(":", 1)[1]
        lines = content.LITERAIS[key]
        body = "<br>".join(html.escape(line) for line in lines)
        return f'<div class="label">{safe(title)}</div><pre class="doc">{body}</pre>'
    raw = read_txt(spec)
    return (
        f'<div class="label">{safe(title)}</div>'
        f'<pre class="term">{html.escape(raw)}</pre>'
    )


def render_task(task: dict, next_number) -> str:
    numero = task["numero"]
    parts: list[str] = []
    parts.append('<section class="task">')
    parts.append(
        '<div class="task-head">'
        f'<div class="kicker">Tarefa {numero:02d}</div>'
        f"<h2>{safe(task['titulo'])}</h2>"
        f'<div class="modulo">Módulo: {safe(task["modulo"])}</div>'
        "</div>"
    )
    parts.append("<h3>Objetivo da tarefa</h3>")
    parts.append(f"<p>{safe(task['objetivo'])}</p>")

    parts.append("<h3>O que foi entregue</h3><ul>")
    for item in task["entregue"]:
        parts.append(f"<li>{safe(item)}</li>")
    parts.append("</ul>")

    if task.get("figuras"):
        parts.append("<h3>Evidências</h3>")
        for rel, caption, source in task.get("figuras", []):
            parts.append(render_figure(rel, caption, source, next_number()))

    if task.get("codigos"):
        parts.append("<h3>Saídas literais</h3>")
        for title, spec in task.get("codigos", []):
            parts.append(render_code(title, spec))

    parts.append("<h3>Critérios de avaliação</h3>")
    parts.append(
        "<table><thead><tr><th style=\"width:34%\">Critério original</th>"
        "<th style=\"width:46%\">Evidência neste projeto</th>"
        "<th style=\"width:20%\">Status</th></tr></thead><tbody>"
    )
    for criterio, evidencia, status in task["criterios"]:
        css = STATUS_CLASS.get(status, "na")
        parts.append(
            f"<tr><td>{safe(criterio)}</td><td>{safe(evidencia)}</td>"
            f'<td><span class="status {css}">{safe(status)}</span></td></tr>'
        )
    parts.append("</tbody></table>")

    if task.get("adaptacao"):
        parts.append(
            f'<div class="nota"><b>Nota de adaptação.</b> {safe(task["adaptacao"])}</div>'
        )
    parts.append("</section>")
    return "\n".join(parts)


def archived_changes() -> list[str]:
    archive = REPO / "openspec" / "changes" / "archive"
    return sorted(p.name for p in archive.iterdir() if p.is_dir())


def in_progress() -> list[tuple[str, str]]:
    raw = read_txt("txt/t03-openspec.txt")
    rows: list[tuple[str, str]] = []
    for line in raw.splitlines():
        stripped = line.strip()
        match = re.match(r"^([a-z0-9-]+)\s+(✓ Complete|\d+/\d+ tasks)", stripped)
        if match:
            rows.append((match.group(1), match.group(2)))
    return rows


def endpoints_from_agents() -> list[tuple[str, str]]:
    text = (REPO / "AGENTS.md").read_text(encoding="utf-8")
    rows: list[tuple[str, str]] = []
    for line in text.splitlines():
        match = re.match(r"^- `([^`]+)`(?: \((.*)\))?$", line.strip())
        if match and ("/api/" in match.group(1)):
            rows.append((match.group(1), (match.group(2) or "").strip()))
    return rows


def build() -> str:
    next_number = figure_counter()
    out: list[str] = []
    out.append("<!DOCTYPE html>")
    out.append('<html lang="pt-BR"><head><meta charset="utf-8">')
    out.append("<title>Entrega 16 Tarefas - Advanced Low Code</title>")
    out.append(f"<style>{CSS}</style></head><body>")

    # Capa
    out.append('<div class="cover">')
    out.append('<div><div class="brand">EduTrack / Impatrack</div>')
    out.append("<h1>Portfólio de evidências</h1>")
    out.append('<div class="subtitle">Innovation Lab: Desenvolvimento Avançado No/Low Code &mdash; 16 tarefas</div>')
    out.append('<div class="rule"></div>')
    out.append(
        '<p class="small">Documento produzido a partir do repositório e do ambiente local de '
        "desenvolvimento, com capturas reais de execução.</p></div>"
    )
    out.append("<div><dl>")
    out.append("<dt>Estudante</dt><dd>Erick Jonathan Vasquez Pereira</dd>")
    out.append("<dt>RA</dt><dd>2601617</dd>")
    out.append("<dt>Turma</dt><dd>CC 2A</dd>")
    out.append("<dt>Data</dt><dd>19/11/2026</dd>")
    out.append(f'<dt>Repositório</dt><dd><a href="{content.FATOS["repositorio"]}">{content.FATOS["repositorio"]}</a></dd>')
    out.append("</dl></div>")
    out.append(
        '<footer>As telas de Xano e FlutterFlow não foram reproduzidas nem simuladas. '
        "Onde a tarefa cita essas ferramentas, o capítulo apresenta o equivalente implementado "
        "neste projeto e registra a adaptação.</footer>"
    )
    out.append("</div>")

    # Sobre o documento
    out.append('<section class="plain">')
    out.append("<h2>Sobre este documento</h2>")
    out.append(
        "<p>Este portfólio reúne as 16 tarefas da disciplina em um único documento. Cada capítulo "
        "retoma o objetivo original da tarefa, lista o que foi efetivamente entregue, apresenta "
        "evidências capturadas do repositório e do sistema em execução e fecha com a tabela de "
        "critérios e, quando necessário, uma nota de adaptação.</p>"
    )
    out.append(
        "<p>As dezesseis tarefas escritas originalmente para Xano e FlutterFlow foram atendidas com a "
        "stack realmente usada no projeto: monorepo Django + React, versionado no GitHub, com "
        "especificação em OpenSpec. Nenhuma captura de tela foi simulada, desenhada ou editada; as "
        "imagens vêm de execução local do sistema, do editor, do navegador e do GitHub.</p>"
    )
    out.append("<h3>Stack do projeto</h3><table><thead><tr><th style=\"width:24%\">Camada</th><th>Tecnologia</th></tr></thead><tbody>")
    for camada, tec in content.STACK:
        out.append(f"<tr><td>{safe(camada)}</td><td>{safe(tec)}</td></tr>")
    out.append("</tbody></table>")

    out.append("<h3>Legenda de status</h3>")
    out.append(
        "<table><thead><tr><th style=\"width:32%\">Status</th><th>Significado</th></tr></thead><tbody>"
        f'<tr><td><span class="status ok">{content.STATUS_ATENDIDO}</span></td><td>O critério foi cumprido com a mesma ferramenta ou equivalente direto, com evidência no documento.</td></tr>'
        f'<tr><td><span class="status equiv">{content.STATUS_EQUIVALENTE}</span></td><td>O objetivo foi cumprido com ferramenta diferente da citada na tarefa original.</td></tr>'
        f'<tr><td><span class="status partial">{content.STATUS_PARCIAL}</span></td><td>Parte do critério está cumprida; a pendência está descrita no capítulo.</td></tr>'
        f'<tr><td><span class="status na">{content.STATUS_NAO_APLICAVEL}</span></td><td>A ferramenta citada não é usada no projeto; o equivalente está documentado.</td></tr>'
        "</tbody></table>"
    )
    out.append(
        '<div class="callout"><b>Escopo das capturas.</b> Todas as telas internas foram capturadas '
        "com um usuário de demonstração local (dados próprios, sem dados de outros estudantes). O "
        "relatório em PDF exibido no capítulo 15 foi gerado na hora para esse usuário; o artefato "
        "versionado no repositório pertence a outro estudante e aparece apenas como prova de "
        "existência. As extensões Gemini Code Assist e XanoScript não estão instaladas neste "
        "ambiente.</div>"
    )
    out.append("</section>")

    # Sumario
    out.append('<section class="toc-page">')
    out.append("<h2>Sumário</h2>")
    out.append('<div class="toc">')
    for task in content.TASKS:
        out.append(
            f'<div><span class="num">{task["numero"]:02d}</span>{safe(task["titulo"])}</div>'
        )
    out.append('<div><span class="num">A</span>Apêndice A &mdash; AGENTS.md integral</div>')
    out.append('<div><span class="num">B</span>Apêndice B &mdash; Inventário OpenSpec</div>')
    out.append('<div><span class="num">C</span>Apêndice C &mdash; Endpoints da API</div>')
    out.append('<div><span class="num">D</span>Apêndice D &mdash; Links</div>')
    out.append("</div>")
    out.append(
        '<div class="callout" style="margin-top:14px">A numeração das figuras é contínua ao longo '
        "do documento. Blocos com fundo escuro são saídas literais de terminal, copiadas da "
        "execução, sem edição de conteúdo.</div>"
    )
    out.append("</section>")

    # Tarefas
    for task in content.TASKS:
        out.append(render_task(task, next_number))

    # Apendice A
    agents = (REPO / "AGENTS.md").read_text(encoding="utf-8").rstrip()
    out.append('<section class="appendix">')
    out.append("<h2>Apêndice A &mdash; AGENTS.md integral</h2>")
    out.append(
        "<p>Conteúdo completo do arquivo de diretrizes na raiz do repositório, sem resumo. "
        "É o documento que orienta pessoas e agentes no projeto.</p>"
    )
    out.append(f'<pre class="doc">{html.escape(agents)}</pre>')
    out.append("</section>")

    # Apendice B
    out.append('<section class="appendix">')
    out.append("<h2>Apêndice B &mdash; Inventário OpenSpec</h2>")
    archived = archived_changes()
    out.append(
        f"<p>O repositório mantém <b>{len(archived)} propostas arquivadas</b> em "
        "<code>openspec/changes/archive/</code> e <b>6 mudancas em andamento</b> em "
        "<code>openspec/changes/</code>, todas validadas por <code>openspec validate --all</code>.</p>"
    )
    out.append("<h3>Mudanças em andamento</h3>")
    out.append("<table><thead><tr><th style=\"width:60%\">Change</th><th>Progresso das tarefas</th></tr></thead><tbody>")
    for name, progress in in_progress():
        out.append(f"<tr><td><code>{html.escape(name)}</code></td><td>{html.escape(progress)}</td></tr>")
    out.append("</tbody></table>")
    out.append("<h3>Propostas arquivadas</h3>")
    out.append("<table><thead><tr><th style=\"width:8%\">#</th><th>Diretório em openspec/changes/archive/</th></tr></thead><tbody>")
    for index, name in enumerate(archived, start=1):
        out.append(f"<tr><td>{index}</td><td><code>{html.escape(name)}</code></td></tr>")
    out.append("</tbody></table>")
    out.append("</section>")

    # Apendice C
    out.append('<section class="appendix">')
    out.append("<h2>Apêndice C &mdash; Endpoints da API</h2>")
    out.append(
        "<p>Contratos declarados em <code>AGENTS.md</code> e implementados em "
        "<code>backend/apps/academic/urls.py</code>, servidos sob <code>/api/v1/</code>.</p>"
    )
    out.append("<table><thead><tr><th style=\"width:44%\">Verbo e rota</th><th>Observação</th></tr></thead><tbody>")
    for rota, note in endpoints_from_agents():
        out.append(f"<tr><td><code>{html.escape(rota)}</code></td><td>{html.escape(note) or '&mdash;'}</td></tr>")
    out.append("</tbody></table>")
    out.append(
        "<p class=\"small\">Documentação interativa em <code>/api/docs/</code> e schema OpenAPI em "
        "<code>/api/schema/</code>.</p>"
    )
    out.append("</section>")

    # Apendice D
    out.append('<section class="appendix">')
    out.append("<h2>Apêndice D &mdash; Links</h2>")
    links = [
        ("Repositório", content.FATOS["repositorio"]),
        ("Pull request final", "https://github.com/ErickJV/edutrack/pull/56"),
        ("Diretrizes do projeto", "https://github.com/ErickJV/edutrack/blob/main/AGENTS.md"),
        ("Pesquisa de referências", "https://github.com/ErickJV/edutrack/blob/main/docs/pesquisa/referencias.md"),
        ("Proposta arquivada", "https://github.com/ErickJV/edutrack/tree/main/openspec/changes/archive/2026-11-16-gestao-academica-e-estudos"),
        ("Relatório versionado", "https://github.com/ErickJV/edutrack/blob/main/docs/relatorio-desempenho-edutrack.pdf"),
        ("Aplicação publicada", "https://impatrack.dev"),
    ]
    out.append("<table><thead><tr><th style=\"width:30%\">Item</th><th>URL</th></tr></thead><tbody>")
    for label, url in links:
        out.append(f'<tr><td>{html.escape(label)}</td><td><a href="{url}">{url}</a></td></tr>')
    out.append("</tbody></table>")
    out.append(
        "<p class=\"small\">Documento gerado a partir de "
        f"{len(content.TASKS)} tarefas, {next_number() - 1} figuras e saídas literais de terminal "
        "capturadas durante a execução local do projeto.</p>"
    )
    out.append("</section>")

    out.append("</body></html>")
    return "\n".join(out)


def main() -> None:
    markup = build()
    target = BASE / "report.html"
    target.write_text(markup, encoding="utf-8")
    figures = markup.count("<figure>")
    print(f"report.html gerado: {target}")
    print(f"tarefas: {len(content.TASKS)} | figuras: {figures} | bytes: {len(markup)}")


if __name__ == "__main__":
    main()
