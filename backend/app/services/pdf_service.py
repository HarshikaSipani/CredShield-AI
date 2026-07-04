import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class PdfService:
    @staticmethod
    def generate_audit_pdf(prediction: dict, applicant: dict, output_path: str) -> str:
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54
        )
        
        styles = getSampleStyleSheet()
        
        # Define Custom Styles for Fintech Look
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=colors.HexColor('#0f172a'),
            alignment=0,
            spaceAfter=20
        )
        
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#4f46e5'),
            spaceBefore=15,
            spaceAfter=10
        )
        
        body_style = ParagraphStyle(
            'Body',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )

        bold_body_style = ParagraphStyle(
            'BoldBody',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("CrediShield AI", title_style))
        story.append(Paragraph("<b>CREDIT DECISION AUDIT RECORD</b>", ParagraphStyle('Sub', parent=body_style, fontSize=12, leading=16, textColor=colors.HexColor('#64748b'))))
        story.append(Spacer(1, 15))
        
        # 2. Metadata Grid
        meta_data = [
            [Paragraph("<b>Evaluation ID:</b>", body_style), Paragraph(str(prediction.get('id', 'N/A')), body_style),
             Paragraph("<b>Date Generated:</b>", body_style), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), body_style)],
            [Paragraph("<b>Applicant Name:</b>", body_style), Paragraph(f"{applicant.get('first_name')} {applicant.get('last_name')}", body_style),
             Paragraph("<b>Evaluator ID:</b>", body_style), Paragraph(str(prediction.get('evaluator_id', 'N/A')), body_style)],
            [Paragraph("<b>Model Version:</b>", body_style), Paragraph(str(prediction.get('model_version', 'N/A')), body_style),
             Paragraph("<b>Compliance Status:</b>", body_style), Paragraph("Approved Audit Trail", ParagraphStyle('GreenText', parent=body_style, textColor=colors.HexColor('#10b981'), fontName='Helvetica-Bold'))]
        ]
        
        t_meta = Table(meta_data, colWidths=[1.2*inch, 2.3*inch, 1.3*inch, 2.2*inch])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 20))

        # 3. Decision Card
        story.append(Paragraph("Executive Risk Assessment Summary", section_heading))
        rec_color = '#10b981' if prediction.get('decision_recommendation') == 'approve' else '#f59e0b' if prediction.get('decision_recommendation') == 'manual_review' else '#ef4444'
        
        decision_data = [
            [Paragraph("<b>Probability of Default:</b>", body_style), Paragraph(f"{float(prediction.get('default_probability', 0.0))*100:.2f}%", bold_body_style)],
            [Paragraph("<b>Credit Risk Score:</b>", body_style), Paragraph(str(prediction.get('risk_score', 300)), bold_body_style)],
            [Paragraph("<b>Risk Category Tier:</b>", body_style), Paragraph(str(prediction.get('risk_category')).upper().replace("_", " "), bold_body_style)],
            [Paragraph("<b>Decision Action Recommendation:</b>", body_style), Paragraph(str(prediction.get('decision_recommendation')).upper().replace("_", " "), ParagraphStyle('Rec', parent=bold_body_style, textColor=colors.HexColor(rec_color)))]
        ]
        t_dec = Table(decision_data, colWidths=[2.5*inch, 4.5*inch])
        t_dec.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('PADDING', (0,0), (-1,-1), 6),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ]))
        story.append(t_dec)
        story.append(Spacer(1, 20))

        # 4. Explainable AI section
        story.append(Paragraph("Explainable AI (Local SHAP Attributions)", section_heading))
        story.append(Paragraph("Below is the local attribution weighting of variables contributing to default risk. Positive values push default risk higher; negative values indicate mitigating factors.", body_style))
        story.append(Spacer(1, 10))

        shap_vals = prediction.get('shap_values', {})
        shap_rows = [[Paragraph("<b>Credit Variable Feature</b>", bold_body_style), Paragraph("<b>SHAP Value Contribution</b>", bold_body_style), Paragraph("<b>Risk Attribution</b>", bold_body_style)]]
        
        for k, v in shap_vals.items():
            friendly_name = k.replace("NumberOf", "Number of ").replace("Of", " of ").replace("Days", " Days").replace("RealEstate", " Real Estate").title()
            attr = "High Risk Factor" if v > 0 else "Mitigating Factor" if v < 0 else "Neutral Impact"
            attr_color = '#ef4444' if v > 0 else '#10b981' if v < 0 else '#64748b'
            
            shap_rows.append([
                Paragraph(friendly_name, body_style),
                Paragraph(f"{v:+.4f}", body_style),
                Paragraph(attr, ParagraphStyle('Attr', parent=bold_body_style, textColor=colors.HexColor(attr_color)))
            ])
            
        t_shap = Table(shap_rows, colWidths=[3.2*inch, 1.8*inch, 2.0*inch])
        t_shap.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t_shap)
        story.append(Spacer(1, 20))

        # 5. Natural Language explanation
        story.append(Paragraph("AI-Generated Decision Narration", section_heading))
        story.append(Paragraph(prediction.get('ai_explanation', ''), body_style))
        story.append(Spacer(1, 30))

        # 6. Compliance Signatures
        story.append(Paragraph("Compliance Attestation Signature Block", section_heading))
        sig_data = [
            [Paragraph("_____________________________<br/>Compliance Officer Representative", body_style),
             Paragraph("_____________________________<br/>Risk Committee Chair Signee", body_style)]
        ]
        t_sig = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
        t_sig.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(t_sig)

        # Build PDF
        doc.build(story)
        return output_path

pdf_service = PdfService()
