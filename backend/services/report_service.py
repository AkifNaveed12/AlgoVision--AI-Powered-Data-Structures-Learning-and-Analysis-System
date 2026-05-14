from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime


def generate_full_report(user_data: dict, runs: list, attempts: list) -> bytes:
    """
    Generate a PDF report using ReportLab.
    Returns raw PDF bytes.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    story = []

    # ── Header ────────────────────────────────────────────────────
    story.append(Paragraph("AlgoVision — Learning Progress Report", styles["Title"]))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(f"User: {user_data.get('email', 'N/A')}", styles["Normal"]))
    if user_data.get("full_name"):
        story.append(Paragraph(f"Name: {user_data['full_name']}", styles["Normal"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
    story.append(Spacer(1, 0.3 * inch))

    # ── Algorithm Runs Table ───────────────────────────────────────
    story.append(Paragraph("Algorithm Run History", styles["Heading2"]))
    story.append(Spacer(1, 0.1 * inch))

    if runs:
        run_data = [["Algorithm", "Operation", "Size", "Time (ms)", "Memory (KB)", "Steps", "Date"]]
        for run in runs[:50]:  # Cap at 50 rows
            run_data.append([
                run.get("algorithm", "")[:20],
                run.get("operation", ""),
                str(run.get("input_size", "")),
                f"{run.get('execution_time_ms', 0):.3f}",
                f"{run.get('memory_usage_kb', 0):.3f}",
                str(run.get("operation_count", "")),
                (run.get("ran_at") or "")[:10],
            ])
        t = Table(
            run_data,
            colWidths=[1.4 * inch, 0.9 * inch, 0.6 * inch, 0.9 * inch, 1.0 * inch, 0.6 * inch, 1.0 * inch],
        )
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("No algorithm runs recorded yet.", styles["Normal"]))

    story.append(Spacer(1, 0.3 * inch))

    # ── Practice Attempts Table ────────────────────────────────────
    story.append(Paragraph("Practice Problem Attempts", styles["Heading2"]))
    story.append(Spacer(1, 0.1 * inch))

    if attempts:
        att_data = [["Problem ID", "Status", "Language", "Time (ms)", "Memory (KB)", "Date"]]
        for att in attempts[:50]:
            lang = "Python 3" if att.get("language_id") == 71 else str(att.get("language_id", ""))
            att_data.append([
                str(att.get("problem_id", "")),
                att.get("status", ""),
                lang,
                f"{att.get('execution_time_ms') or 0:.1f}",
                f"{att.get('memory_usage_kb') or 0:.2f}",
                (att.get("attempted_at") or "")[:10],
            ])
        t2 = Table(
            att_data,
            colWidths=[0.9 * inch, 1.2 * inch, 1.0 * inch, 1.0 * inch, 1.0 * inch, 1.2 * inch],
        )
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#155724")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t2)
    else:
        story.append(Paragraph("No practice attempts recorded yet.", styles["Normal"]))

    # ── Summary Stats ──────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Summary", styles["Heading2"]))

    accepted = sum(1 for a in attempts if a.get("status") == "Accepted")
    total_runs = len(runs)
    total_attempts = len(attempts)

    summary_data = [
        ["Metric", "Value"],
        ["Total Algorithm Runs", str(total_runs)],
        ["Total Practice Attempts", str(total_attempts)],
        ["Accepted Submissions", str(accepted)],
        ["Success Rate", f"{(accepted/total_attempts*100):.1f}%" if total_attempts else "N/A"],
    ]
    ts = Table(summary_data, colWidths=[2.5 * inch, 2.0 * inch])
    ts.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6c757d")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(ts)

    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("— AlgoVision AI-Powered Learning Platform —", styles["Normal"]))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
