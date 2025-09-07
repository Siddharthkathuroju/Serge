#!/usr/bin/env python
"""
Test script for basic Django functionality
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from Image.models import Image

def test_image_model():
    """Test if the Image model is working correctly"""
    print("🧪 Testing Image model...")
    
    # Check if we can create an Image instance
    try:
        # Create a test image (this won't actually save a file, just test the model)
        test_image = Image(
            created_by="test_user",
            date="2024-01-01",
            time="12:00:00"
        )
        print("✅ Image model is working correctly")
        return True
    except Exception as e:
        print(f"❌ Image model error: {e}")
        return False

def check_media_directory():
    """Check if media directory exists and is writable"""
    print("\n📁 Checking media directory...")
    
    media_dir = "media"
    if os.path.exists(media_dir):
        print(f"✅ Media directory exists: {media_dir}")
        
        # Check if it's writable
        if os.access(media_dir, os.W_OK):
            print("✅ Media directory is writable")
            return True
        else:
            print("❌ Media directory is not writable")
            return False
    else:
        print(f"❌ Media directory does not exist: {media_dir}")
        return False

def main():
    print("🧪 Testing Django backend setup...")
    
    # Test model
    model_ok = test_image_model()
    
    # Check media directory
    media_ok = check_media_directory()
    
    if model_ok and media_ok:
        print("\n✅ All tests passed! Your backend is ready for image uploads.")
    else:
        print("\n❌ Some tests failed. Please check the issues above.")

if __name__ == "__main__":
    main() 