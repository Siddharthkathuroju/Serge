# Configuration file for ClickDrop API and other settings
import os

# ClickDrop API Configuration
# Get your API key from: https://clickdrop.co/
# Set it in your .env file or environment variables
CLICKDROP_API_KEY = os.environ.get('CLICKDROP_API_KEY', '')

# Django Configuration
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-68((jhbnogo-*drf-6@m%&2+n0+rs+)q+bcb$$%gn8x6*_1on0')

# API Configuration
CLICKDROP_API_URL = 'https://api.clickdrop.co/api/v1'
CLICKDROP_TIMEOUT = 60  # seconds

# File Upload Configuration
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] 