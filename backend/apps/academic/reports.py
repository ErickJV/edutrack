from __future__ import annotations

from datetime import datetime
from typing import Any


def _pdf_escape(text: str) -> bytes:
    """Converte string UTF-8 para bytes WinAnsi (Latin-1) escapando delimitadores PDF."""
    cleaned = (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("–", "-")
        .replace("—", "-")
        .replace("•", "-")
    )
    return cleaned.encode("latin-1", errors="replace")


def render_academic_report_pdf(report_data: dict[str, Any]) -> bytes:
    """
    Gera um documento PDF (A4, 595x842 pt) com o resumo de desempenho acadêmico
    do estudante, disciplinas do semestre vigente, tarefas e progresso ponderado.
    """
    lines: list[bytes] = []

    def add(cmd: str) -> None:
        lines.append(cmd.encode("ascii"))

    def add_text(x: float, y: float, text: str, font: str = "F1", size: float = 10) -> None:
        escaped = _pdf_escape(text)
        lines.append(
            f"BT /{font} {size:.1f} Tf 1 0 0 1 {x:.1f} {y:.1f} Tm (".encode("ascii")
            + escaped
            + b") Tj ET"
        )

    # Cabeçalho institucional (#005063 -> RGB 0.0, 0.314, 0.388)
    add("0.000 0.314 0.388 rg")
    add("0 752 595 90 re f")

    add("1 1 1 rg")
    add_text(40, 804, "EDUTRACK | RELATORIO DE DESEMPENHO ACADEMICO", "F2", 15)
    student_label = f"Estudante: {report_data.get('student_name', 'Estudante Impacta')} ({report_data.get('student_email', '')})"
    add_text(40, 784, student_label, "F1", 10)
    course_label = (
        f"Curso: {report_data.get('course_name', 'Graduacao Impacta')}  |  "
        f"Semestre Vigente: {report_data.get('semester_label', '2o Semestre')}  |  "
        f"Emissao: {report_data.get('generated_at', datetime.now().strftime('%d/%m/%Y %H:%M'))}"
    )
    add_text(40, 767, course_label, "F1", 9)

    # Bloco de métricas executivas
    y_cursor = 720.0
    add("0.06 0.09 0.16 rg")
    add_text(40, y_cursor, "1. Indicadores Consolidados da Rotina", "F2", 12)

    y_cursor -= 52
    cards = [
        ("Disciplinas Ativas", str(report_data.get("subjects_count", 0))),
        ("Tarefas Concluidas", f"{report_data.get('completed_tasks_count', 0)}/{report_data.get('total_tasks_count', 0)}"),
        ("Tarefas Pendentes", str(report_data.get("pending_tasks_count", 0))),
        ("Progresso Ponderado", f"{report_data.get('weighted_progress_percent', 0)}%"),
    ]
    card_width = 122.0
    gap = 9.0
    for idx, (label, val) in enumerate(cards):
        cx = 40.0 + idx * (card_width + gap)
        add("0.95 0.97 0.98 rg")
        add(f"{cx:.1f} {y_cursor:.1f} {card_width:.1f} 42 re f")
        add("0.82 0.87 0.90 RG 0.8 w")
        add(f"{cx:.1f} {y_cursor:.1f} {card_width:.1f} 42 re S")
        add("0.35 0.42 0.48 rg")
        add_text(cx + 8, y_cursor + 27, label, "F1", 8.5)
        add("0.00 0.31 0.39 rg")
        add_text(cx + 8, y_cursor + 10, val, "F2", 13)

    # Tabela de disciplinas do semestre vigente
    y_cursor -= 32
    add("0.06 0.09 0.16 rg")
    add_text(40, y_cursor, "2. Desempenho por Disciplina no Semestre Vigente", "F2", 12)

    y_cursor -= 22
    add("0.00 0.31 0.39 rg")
    add(f"40 {y_cursor:.1f} 515 20 re f")
    add("1 1 1 rg")
    add_text(46, y_cursor + 6, "Disciplina", "F2", 9)
    add_text(305, y_cursor + 6, "Carga", "F2", 9)
    add_text(365, y_cursor + 6, "Tarefas", "F2", 9)
    add_text(445, y_cursor + 6, "Progresso", "F2", 9)

    subjects: list[dict[str, Any]] = report_data.get("subjects", [])
    for idx, subj in enumerate(subjects[:10]):
        y_cursor -= 20
        if idx % 2 == 0:
            add("0.97 0.98 0.99 rg")
        else:
            add("1 1 1 rg")
        add(f"40 {y_cursor:.1f} 515 20 re f")
        add("0.88 0.91 0.94 RG 0.5 w")
        add(f"40 {y_cursor:.1f} 515 20 re S")

        add("0.12 0.16 0.22 rg")
        name_str = str(subj.get("name", ""))[:46]
        add_text(46, y_cursor + 6, name_str, "F1", 9)
        add_text(305, y_cursor + 6, f"{subj.get('workload_hours', 80)}h", "F1", 9)
        add_text(
            365,
            y_cursor + 6,
            f"{subj.get('completed_tasks', 0)}/{subj.get('total_tasks', 0)}",
            "F1",
            9,
        )
        pct = int(subj.get("progress_percent", 0))
        add_text(445, y_cursor + 6, f"{pct}%", "F2", 9)

        # Barra de progresso gráfica
        bar_x = 480.0
        bar_y = y_cursor + 6.0
        bar_w = 65.0
        add("0.86 0.90 0.92 rg")
        add(f"{bar_x:.1f} {bar_y:.1f} {bar_w:.1f} 6 re f")
        if pct > 0:
            fill_w = max(2.0, min(bar_w, (pct / 100.0) * bar_w))
            add("0.00 0.48 0.58 rg")
            add(f"{bar_x:.1f} {bar_y:.1f} {fill_w:.1f} 6 re f")

    # Lista de tarefas e entregas recentes/próximas
    y_cursor -= 32
    add("0.06 0.09 0.16 rg")
    add_text(40, y_cursor, "3. Relacao de Tarefas e Entregas Academicas", "F2", 12)

    y_cursor -= 22
    add("0.18 0.24 0.31 rg")
    add(f"40 {y_cursor:.1f} 515 20 re f")
    add("1 1 1 rg")
    add_text(46, y_cursor + 6, "Atividade / Avaliacao", "F2", 9)
    add_text(275, y_cursor + 6, "Disciplina", "F2", 9)
    add_text(425, y_cursor + 6, "Prazo", "F2", 9)
    add_text(490, y_cursor + 6, "Status", "F2", 9)

    tasks: list[dict[str, Any]] = report_data.get("tasks", [])
    for idx, t in enumerate(tasks[:12]):
        y_cursor -= 18
        if y_cursor < 65:
            break
        if idx % 2 == 0:
            add("0.98 0.99 1.00 rg")
        else:
            add("1 1 1 rg")
        add(f"40 {y_cursor:.1f} 515 18 re f")
        add("0.90 0.92 0.95 RG 0.4 w")
        add(f"40 {y_cursor:.1f} 515 18 re S")

        add("0.15 0.18 0.24 rg")
        add_text(46, y_cursor + 5, str(t.get("title", ""))[:40], "F1", 8.5)
        add_text(275, y_cursor + 5, str(t.get("subject_name", "Geral"))[:26], "F1", 8.5)
        add_text(425, y_cursor + 5, str(t.get("due_date", "-")), "F1", 8.5)
        status_label = str(t.get("status_label", "Pendente"))
        add_text(490, y_cursor + 5, status_label[:12], "F2", 8.5)

    # Rodapé
    add("0.45 0.50 0.56 rg")
    add_text(
        40,
        32,
        "Documento gerado automaticamente pelo modulo de relatorios do EduTrack (Faculdade Impacta).",
        "F1",
        8,
    )

    content_stream = b"\n".join(lines)

    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
        f"<< /Length {len(content_stream)} >>\nstream\n".encode("ascii")
        + content_stream
        + b"\nendstream",
    ]

    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets: list[int] = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for off in offsets:
        output.extend(f"{off:010d} 00000 n \n".encode("ascii"))

    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(output)
