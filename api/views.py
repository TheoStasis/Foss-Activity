from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import Dataset
from .pdf_generator import generate_equipment_pdf # Import the new file
from django.http import HttpResponse  # <--- ADD THIS
import pandas as pd
import os

class StatsView(APIView):
    parser_classes = [MultiPartParser]

    def get(self, request):
        """Get the last 5 datasets"""
        recent = Dataset.objects.all()[:5]
        history = []
        for item in recent:
            history.append({
                "id": item.id,
                "filename": os.path.basename(item.filename),
                "date": item.uploaded_at.strftime("%Y-%m-%d %H:%M"),
                "stats": item.stats
            })
        return Response(history)

    def post(self, request):
        """Upload and process a new file"""
        try:
            file_obj = request.FILES['file']
            
            # 1. Read with Pandas FIRST to ensure it's valid
            df = pd.read_csv(file_obj)
            
            # 2. Calculate Stats
            stats_data = {
                "count": len(df),
                "avg_pressure": df['Pressure'].mean() if 'Pressure' in df.columns else 0,
                "avg_temp": df['Temperature'].mean() if 'Temperature' in df.columns else 0,
                "types": df['Type'].value_counts().to_dict() if 'Type' in df.columns else {},
                "recent_entries": df.head(5).to_dict(orient='records')
            }

            # 3. Save to Database
            # Reset file pointer to beginning so Django can save it
            file_obj.seek(0)
            dataset = Dataset.objects.create(file=file_obj, stats=stats_data)
            
            # 4. Return the same structure as history items
            return Response({
                "id": dataset.id,
                "filename": os.path.basename(dataset.filename),
                "date": dataset.uploaded_at.strftime("%Y-%m-%d %H:%M"),
                "stats": stats_data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)

class PDFDownloadView(APIView):
    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id)
            pdf_buffer = generate_equipment_pdf(dataset)
            
            # Return as a downloadable file
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="report_{dataset.id}.pdf"'
            return response
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=404)