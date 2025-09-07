from django.urls import path, include
from . import views

from .image_to_text_api import ImageToTextAPIView

urlpatterns = [
    path('upload/', views.upload_image, name='upload_image'),
    path('remove-text/<int:image_id>/', views.remove_text, name='remove_text'),
    path('status/<int:image_id>/', views.check_text_removal_status, name='check_status'),
    path('details/<int:image_id>/', views.get_image_details, name='get_image_details'),
    path('download/<int:image_id>/', views.download_processed, name='download_processed'),
    path('compress/<int:image_id>/', views.compress_image, name='compress_image'),
    path('compression-status/<int:image_id>/', views.check_compression_status, name='check_compression_status'),
    path('download-compressed/<int:image_id>/', views.download_compressed, name='download_compressed'),
    path('image2text/', ImageToTextAPIView.as_view(), name='image_to_text'),
]