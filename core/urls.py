from django.contrib import admin
from django.urls import path
from api.views import StatsView, PDFDownloadView, RegisterView  # Added RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/stats/', StatsView.as_view()),
    path('api/report/<str:dataset_id>/', PDFDownloadView.as_view()),
    
    # AUTH ENDPOINTS
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # Login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='auth_register'),
]