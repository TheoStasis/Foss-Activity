from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

def generate_equipment_pdf(dataset):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # 1. Title
    title = Paragraph(f"Equipment Analysis Report: {dataset.filename}", styles['Title'])
    elements.append(title)
    elements.append(Paragraph(f"Generated on: {dataset.uploaded_at.strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # 2. Key Statistics Table
    stats = dataset.stats
    data_summary = [
        ['Metric', 'Value'],
        ['Total Count', str(stats.get('count', 0))],
        ['Avg Pressure', f"{stats.get('avg_pressure', 0):.2f} Pa"],
        ['Avg Temperature', f"{stats.get('avg_temp', 0):.2f} °C"]
    ]
    
    t_summary = Table(data_summary, colWidths=[200, 200])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f1f5f9')),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(Paragraph("Executive Summary", styles['Heading2']))
    elements.append(t_summary)
    elements.append(Spacer(1, 20))

    # 3. Equipment Types
    elements.append(Paragraph("Equipment Distribution", styles['Heading2']))
    type_data = [['Equipment Type', 'Count']]
    for k, v in stats.get('types', {}).items():
        type_data.append([k, str(v)])
    
    t_types = Table(type_data, colWidths=[200, 100])
    t_types.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    elements.append(t_types)

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer