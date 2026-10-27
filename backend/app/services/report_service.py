import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.core.config import settings
from app.models import Application, Document, Finding, VerificationAttempt, ReviewAction

class ReportService:
    @staticmethod
    def generate_validation_report_pdf(db: Session, application_id: str) -> str:
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise ValueError("Application not found")

        inst = application.institution
        documents = db.query(Document).filter(Document.application_id == application.id).all()
        findings = db.query(Finding).filter(Finding.application_id == application.id).all()
        verifications = db.query(VerificationAttempt).filter(VerificationAttempt.application_id == application.id).all()
        reviews = db.query(ReviewAction).filter(ReviewAction.application_id == application.id).all()

        report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
        filename = f"{report_id}_{application.application_number}.pdf"
        output_path = os.path.join(settings.REPORTS_STORAGE_PATH, filename)

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            "SubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
            spaceAfter=12
        )
        heading_style = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1E3A8A"),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#1E293B")
        )
        disclaimer_style = ParagraphStyle(
            "Disclaimer",
            parent=styles["Normal"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748B"),
            spaceBefore=14
        )

        story = []

        # Header
        story.append(Paragraph("PRAMAAN — AICTE APPROVAL & COMPLIANCE PLATFORM", title_style))
        story.append(Paragraph(f"Official Application Verification Report | Report ID: <b>{report_id}</b>", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=12))

        # Institution & Application Metadata Table
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        meta_data = [
            [Paragraph("<b>Application ID:</b>", body_style), Paragraph(application.application_number, body_style),
             Paragraph("<b>Category:</b>", body_style), Paragraph(application.category, body_style)],
            [Paragraph("<b>Institution Code:</b>", body_style), Paragraph(inst.institution_code if inst else "N/A", body_style),
             Paragraph("<b>Academic Year:</b>", body_style), Paragraph(application.academic_year, body_style)],
            [Paragraph("<b>Institution Name:</b>", body_style), Paragraph(inst.name if inst else "N/A", body_style),
             Paragraph("<b>Validation Status:</b>", body_style), Paragraph(application.status.upper(), body_style)],
            [Paragraph("<b>Generated On:</b>", body_style), Paragraph(now_str, body_style),
             Paragraph("<b>Rule Engine Version:</b>", body_style), Paragraph("v2.4-APH2026", body_style)]
        ]
        meta_table = Table(meta_data, colWidths=[110, 160, 120, 150])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # Documents Processed Section
        story.append(Paragraph("1. Submitted Supporting Documents", heading_style))
        if documents:
            doc_rows = [[Paragraph("<b>Document Type</b>", body_style),
                         Paragraph("<b>Filename</b>", body_style),
                         Paragraph("<b>Pages</b>", body_style),
                         Paragraph("<b>Status</b>", body_style),
                         Paragraph("<b>SHA-256 (truncated)</b>", body_style)]]
            for d in documents:
                doc_rows.append([
                    Paragraph(d.document_type, body_style),
                    Paragraph(d.original_filename, body_style),
                    Paragraph(str(d.page_count), body_style),
                    Paragraph(d.processing_status.capitalize(), body_style),
                    Paragraph(d.sha256[:16] + "...", body_style)
                ])
            doc_table = Table(doc_rows, colWidths=[130, 170, 45, 75, 120])
            doc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(doc_table)
        else:
            story.append(Paragraph("<i>No documents attached to this application.</i>", body_style))
        story.append(Spacer(1, 10))

        # Compliance Findings Section
        story.append(Paragraph(f"2. Regulatory Intelligence Findings ({len(findings)})", heading_style))
        if findings:
            find_rows = [[Paragraph("<b>Rule Code</b>", body_style),
                          Paragraph("<b>Severity</b>", body_style),
                          Paragraph("<b>Explanation</b>", body_style),
                          Paragraph("<b>Status</b>", body_style)]]
            for f in findings:
                sev_color = "#DC2626" if f.severity in ("critical", "high") else "#D97706" if f.severity == "medium" else "#2563EB"
                sev_p = Paragraph(f"<font color='{sev_color}'><b>{f.severity.upper()}</b></font>", body_style)
                find_rows.append([
                    Paragraph(f.rule_code, body_style),
                    sev_p,
                    Paragraph(f"{f.explanation}<br/><i>Next action: {f.suggested_action or 'Review required'}</i>", body_style),
                    Paragraph(f.status.upper(), body_style)
                ])
            find_table = Table(find_rows, colWidths=[110, 65, 290, 75])
            find_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(find_table)
        else:
            story.append(Paragraph("<i>All configured regulatory checks passed with zero non-compliances.</i>", body_style))
        story.append(Spacer(1, 10))

        # Verification Outcomes Section
        story.append(Paragraph(f"3. Authorized Source Verifications ({len(verifications)})", heading_style))
        if verifications:
            v_rows = [[Paragraph("<b>Source</b>", body_style),
                       Paragraph("<b>Reference</b>", body_style),
                       Paragraph("<b>Outcome</b>", body_style),
                       Paragraph("<b>Response Summary</b>", body_style)]]
            for v in verifications:
                v_rows.append([
                    Paragraph(v.source_name, body_style),
                    Paragraph(v.reference_number, body_style),
                    Paragraph(f"<b>{v.status.upper()}</b>", body_style),
                    Paragraph(v.response_summary, body_style)
                ])
            v_table = Table(v_rows, colWidths=[140, 110, 90, 200])
            v_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(v_table)
        else:
            story.append(Paragraph("<i>No external verification records requested for this submission.</i>", body_style))
        story.append(Spacer(1, 10))

        # Officer Review Trail
        story.append(Paragraph(f"4. Officer Review Trail & Actions ({len(reviews)})", heading_style))
        if reviews:
            rev_rows = [[Paragraph("<b>Officer</b>", body_style),
                         Paragraph("<b>Action</b>", body_style),
                         Paragraph("<b>Reason & Notes</b>", body_style),
                         Paragraph("<b>Timestamp</b>", body_style)]]
            for r in reviews:
                rev_rows.append([
                    Paragraph(r.actor_name, body_style),
                    Paragraph(r.action_type.replace("_", " ").upper(), body_style),
                    Paragraph(f"Reason: {r.reason}" + (f"<br/>Notes: {r.notes}" if r.notes else ""), body_style),
                    Paragraph(r.created_at.strftime("%Y-%m-%d %H:%M"), body_style)
                ])
            rev_table = Table(rev_rows, colWidths=[120, 110, 210, 100])
            rev_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(rev_table)
        else:
            story.append(Paragraph("<i>No officer review actions recorded yet.</i>", body_style))

        # Mandatory Statutory Disclaimer
        story.append(Spacer(1, 15))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94A3B8"), spaceAfter=8))
        disclaimer_text = (
            "<b>STATUTORY DISCLAIMER & LIMITATIONS:</b> This validation report was generated by NiyamAI, "
            "an automated regulatory intelligence decision-support platform for the All India Council for Technical Education (AICTE). "
            "Automated findings, cross-document discrepancy flags, OCR extractions, and verification sandbox responses are advisory only "
            "and do not constitute an official statutory approval, rejection, or formal regulatory determination. "
            "Final regulatory decisions are reserved exclusively to authorized AICTE committees and competent authorities."
        )
        story.append(Paragraph(disclaimer_text, disclaimer_style))

        # Build PDF
        doc.build(story)
        return output_path
