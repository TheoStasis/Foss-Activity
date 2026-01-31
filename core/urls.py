from django.contrib import admin
from django.urls import path
from api.views import StatsView, PDFDownloadView  # Add import

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/stats/', StatsView.as_view()),
    path('api/report/<int:dataset_id>/', PDFDownloadView.as_view()), # New URL
]