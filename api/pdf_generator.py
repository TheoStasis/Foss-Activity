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

    try:
        # 1. Title
        filename = getattr(dataset, 'filename', 'Unknown')
        title = Paragraph(f"Equipment Analysis Report: {filename}", styles['Title'])
        elements.append(title)
        
        uploaded_at = getattr(dataset, 'uploaded_at', None)
        if uploaded_at:
            elements.append(Paragraph(f"Generated on: {uploaded_at.strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 20))

        # 2. Key Statistics Table
        stats = getattr(dataset, 'stats', {})
        if isinstance(stats, dict):
            count = stats.get('count', 0)
            avg_pressure = float(stats.get('avg_pressure', 0))
            avg_temp = float(stats.get('avg_temp', 0))
        else:
            count = 0
            avg_pressure = 0
            avg_temp = 0
            
        data_summary = [
            ['Metric', 'Value'],
            ['Total Count', str(count)],
            ['Avg Pressure', f"{avg_pressure:.2f} Pa"],
            ['Avg Temperature', f"{avg_temp:.2f} °C"]
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
        types = stats.get('types', {}) if isinstance(stats, dict) else {}
        for k, v in types.items():
            type_data.append([str(k), str(v)])
        
        if len(type_data) > 1:  # Only show table if there's data
            t_types = Table(type_data, colWidths=[200, 100])
            t_types.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#3b82f6')),
                ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            elements.append(t_types)
        else:
            elements.append(Paragraph("No equipment type data available", styles['Normal']))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        print(f"PDF Generator Error: {str(e)}")
        raise