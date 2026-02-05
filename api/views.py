from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse
from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.serializers import ModelSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import pandas as pd
import os
import datetime
from .mongo_models import UserDataset, UserProfile
from .pdf_generator import generate_equipment_pdf

# Serializer for Registration
class RegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        # Create MongoDB user profile
        UserProfile.objects.create(username=user.username, email=user.email or "")
        return user

# Register View
@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "User registered successfully. Please login."}, 
            status=201
        )

@method_decorator(csrf_exempt, name='dispatch')
class StatsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def get(self, request):
        """Get history for logged-in user only"""
        try:
            username = request.user.username
            # Get only this user's datasets from MongoDB
            datasets = UserDataset.objects(user=username).order_by('-uploaded_at')[:10]
            
            history = []
            for item in datasets:
                history.append({
                    "id": str(item.id),
                    "filename": item.filename,
                    "date": item.uploaded_at.strftime("%Y-%m-%d %H:%M"),
                    "stats": item.stats
                })
            return Response(history)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def post(self, request):
        """Upload and process a new file - store with user"""
        try:
            username = request.user.username
            file_obj = request.FILES['file']
            
            # Read with Pandas
            df = pd.read_csv(file_obj)
            
            # Calculate Stats
            stats_data = {
                "count": len(df),
                "avg_pressure": float(df['Pressure'].mean()) if 'Pressure' in df.columns else 0,
                "avg_temp": float(df['Temperature'].mean()) if 'Temperature' in df.columns else 0,
                "types": df['Type'].value_counts().to_dict() if 'Type' in df.columns else {},
                "recent_entries": df.head(10).to_dict(orient='records')
            }

            # Save to MongoDB with username
            dataset = UserDataset(
                user=username,
                filename=file_obj.name,
                stats=stats_data,
                file_path=f"uploads/{file_obj.name}",
                uploaded_at=datetime.datetime.utcnow()
            )
            dataset.save()
            
            return Response({
                "id": str(dataset.id),
                "filename": dataset.filename,
                "date": dataset.uploaded_at.strftime("%Y-%m-%d %H:%M"),
                "stats": stats_data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)

class PDFDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, dataset_id):
        try:
            username = request.user.username
            
            # Try to find dataset with string ID first (MongoDB ObjectId as string)
            try:
                from mongoengine import ObjectId
                try:
                    obj_id = ObjectId(dataset_id)
                    dataset = UserDataset.objects(id=obj_id, user=username).first()
                except:
                    # If ObjectId conversion fails, try direct string match
                    dataset = UserDataset.objects(id=dataset_id, user=username).first()
            except:
                dataset = UserDataset.objects(id=dataset_id, user=username).first()
            
            if not dataset:
                return Response({"error": f"Dataset {dataset_id} not found or access denied for user {username}"}, status=404)
            
            try:
                pdf_buffer = generate_equipment_pdf(dataset)
                response = HttpResponse(pdf_buffer, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="report_{dataset.id}.pdf"'
                return response
            except Exception as pdf_err:
                return Response({"error": f"PDF generation failed: {str(pdf_err)}"}, status=400)
            
        except Exception as e:
            import traceback
            print(f"PDFDownloadView Error: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": f"Server error: {str(e)}"}, status=500)

class DeleteDatasetView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, dataset_id):
        try:
            username = request.user.username
            
            # Try to find and delete dataset with user ownership check
            try:
                from mongoengine import ObjectId
                try:
                    obj_id = ObjectId(dataset_id)
                    dataset = UserDataset.objects(id=obj_id, user=username).first()
                except:
                    dataset = UserDataset.objects(id=dataset_id, user=username).first()
            except:
                dataset = UserDataset.objects(id=dataset_id, user=username).first()
            
            if not dataset:
                return Response({"error": f"Dataset not found or access denied"}, status=404)
            
            dataset.delete()
            return Response({"message": "Dataset deleted successfully"}, status=200)
            
        except Exception as e:
            return Response({"error": f"Failed to delete dataset: {str(e)}"}, status=400)