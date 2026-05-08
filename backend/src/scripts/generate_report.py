import sys
import json
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate_pdf(title, subtitle, headers, data, output_path):
    # Determine orientation based on number of columns
    num_cols = len(headers)
    # If more than 6 month columns + Indicator + Total, use landscape
    pagesize = landscape(A4) if num_cols > 8 else A4
    
    doc = SimpleDocTemplate(
        output_path, 
        pagesize=pagesize,
        rightMargin=1*cm, leftMargin=1*cm, topMargin=1.5*cm, bottomMargin=1.5*cm
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=5,
        textColor=colors.HexColor('#0F172A'),
        alignment=0 # Left
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=25,
        textColor=colors.HexColor('#64748B'),
        alignment=0
    )

    # Header section
    elements.append(Paragraph(title.upper(), title_style))
    elements.append(Paragraph(subtitle, subtitle_style))
    elements.append(Spacer(1, 15))
    
    # Table data
    header_keys = list(headers.keys())
    header_labels = [headers[k] for k in header_keys]
    
    table_data = [header_labels]
    for row in data:
        row_values = []
        for k in header_keys:
            val = row.get(k, 0) if k != 'indicador' else row.get(k, '')
            # Truncate indicator names if too long
            if k == 'indicador' and len(str(val)) > 50:
                val = str(val)[:47] + '...'
            row_values.append(str(val))
        table_data.append(row_values)
        
    # Calculate column widths
    avail_width = pagesize[0] - 2*cm
    if num_cols > 1:
        # Give more space to the "Indicador" column
        first_col_width = avail_width * 0.45 if pagesize == A4 else avail_width * 0.35
        other_cols_width = (avail_width - first_col_width) / (num_cols - 1)
        col_widths = [first_col_width] + [other_cols_width] * (num_cols - 1)
    else:
        col_widths = [avail_width]

    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Professional styling
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'), # Left align indicator names
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8 if num_cols > 10 else 9),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]
    
    # Highlight subindicators (rows with " > ")
    for i, row in enumerate(data):
        if " > " in str(row.get('indicador', '')):
            # Make subindicator text slightly indented or different color if possible
            # Here we just make the font a bit smaller or normal weight if parent is bold
            style.append(('TEXTCOLOR', (0, i+1), (0, i+1), colors.HexColor('#475569')))
            style.append(('LEFTPADDING', (0, i+1), (0, i+1), 20))
        else:
            # Parent indicator rows
            style.append(('FONTNAME', (0, i+1), (-1, i+1), 'Helvetica-Bold'))
            style.append(('BACKGROUND', (0, i+1), (-1, i+1), colors.HexColor('#F1F5F9')))

    # Bold the Total column if it exists
    if 'total' in header_keys:
        total_idx = header_keys.index('total')
        style.append(('FONTNAME', (total_idx, 0), (total_idx, -1), 'Helvetica-Bold'))
        style.append(('BACKGROUND', (total_idx, 1), (total_idx, -1), colors.HexColor('#F1F5F9')))
        style.append(('TEXTCOLOR', (total_idx, 1), (total_idx, -1), colors.HexColor('#1E293B')))

    t.setStyle(TableStyle(style))
    
    elements.append(t)
    
    # Footer
    elements.append(Spacer(1, 40))
    footer_text = f"RELATÓRIO GERADO EM {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} - INDICADORES HEALTHMAIS"
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, textColor=colors.grey, alignment=1, letterSpacing=1)))
    
    doc.build(elements)
    return output_path

def main():
    try:
        # Standardize UTF-8
        if hasattr(sys.stdin, 'buffer'):
            sys.stdin = __import__('io').TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
        
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
            
        payload = json.loads(input_data)
        
        fmt = payload.get("format", "pdf")
        title = payload.get("title", "RELATÓRIO DE INDICADORES")
        subtitle = payload.get("subtitle", "")
        headers = payload.get("headers", {})
        data = payload.get("data", [])
        
        # Temp dir
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tmp')
        os.makedirs(temp_dir, exist_ok=True)
        
        output_filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        output_path = os.path.join(temp_dir, output_filename)
        
        generate_pdf(title, subtitle, headers, data, output_path)
            
        print(json.dumps({"success": True, "filePath": output_path}))
        
    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "trace": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
