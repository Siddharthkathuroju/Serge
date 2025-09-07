#!/usr/bin/env python
"""
Setup script for Django backend
"""
import os
import subprocess
import sys

def run_command(command):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {command} failed: {e}")
        print(f"Error output: {e.stderr}")
        return None

def main():
    print("🚀 Setting up Django backend...")
    
    # Create media directory
    media_dir = "media"
    if not os.path.exists(media_dir):
        os.makedirs(media_dir)
        print(f"✅ Created media directory: {media_dir}")
    
    # Install requirements
    print("\n📦 Installing requirements...")
    run_command("pip install -r requirements.txt")
    
    # Make migrations
    print("\n🔄 Making migrations...")
    run_command("python manage.py makemigrations")
    
    # Migrate
    print("\n🚀 Running migrations...")
    run_command("python manage.py migrate")
    
    print("\n✅ Setup complete! You can now run: python manage.py runserver")

if __name__ == "__main__":
    main() 