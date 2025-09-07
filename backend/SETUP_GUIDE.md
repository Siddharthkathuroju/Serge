# Text Removal Tool Setup Guide

This guide will help you set up the text removal tool using the ClickDrop API.

## 🚀 Quick Start

### 1. Get ClickDrop API Key
1. Visit [https://clickdrop.co/](https://clickdrop.co/)
2. Sign up for an account
3. Navigate to API section
4. Generate your API key

### 2. Set Environment Variables
Create a `.env` file in your backend directory:
```bash
# Backend/.env
CLICKDROP_API_KEY=your_actual_api_key_here
DEBUG=True
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run Django Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Start Django Server
```bash
python manage.py runserver
```

## 🔧 Configuration

### Environment Variables
- `CLICKDROP_API_KEY`: Your ClickDrop API key (required)
- `DEBUG`: Django debug mode (optional, defaults to True)

### API Endpoints
- `POST /image/upload/` - Upload image and start text removal
- `POST /image/remove-text/<id>/` - Remove text from specific image
- `GET /image/status/<id>/` - Check text removal status
- `GET /image/details/<id>/` - Get image details

## 📁 Project Structure

```
backend/
├── Image/
│   ├── models.py              # Image model with text removal fields
│   ├── views.py               # API views for text removal
│   ├── text_removal_service.py # ClickDrop API integration
│   └── urls.py                # URL routing
├── media/
│   ├── uploads/               # Original images
│   └── processed/             # Text-removed images
├── config.py                  # Configuration settings
└── requirements.txt           # Python dependencies
```

## 🧠 How It Works

### 1. Image Upload
- User uploads image through Next.js frontend
- Django saves image to media/uploads/
- Automatically starts text removal process

### 2. Text Removal Process
- Django sends image to ClickDrop API
- ClickDrop processes image and removes text
- Returns processed image URL or task ID

### 3. Status Monitoring
- Frontend polls status every 2 seconds
- Shows real-time progress updates
- Downloads processed image when complete

### 4. Result Storage
- Processed image downloaded and saved
- Stored in media/processed/ directory
- Available for download through frontend

## 🔍 API Response Examples

### Upload Response
```json
{
  "success": true,
  "image": {
    "id": 1,
    "url": "/media/uploads/image.jpg",
    "text_removal_status": "processing",
    "text_removed": false
  },
  "text_removal": {
    "success": true,
    "task_id": "task_12345",
    "message": "Text removal task submitted successfully"
  }
}
```

### Status Response
```json
{
  "success": true,
  "status": "completed",
  "result": {
    "success": true,
    "status": "completed",
    "message": "Text removal completed successfully",
    "processed_image_url": "/media/processed/image.jpg"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Not Configured**
   - Ensure CLICKDROP_API_KEY is set in environment
   - Check .env file exists in backend directory

2. **Text Removal Fails**
   - Verify API key is valid
   - Check ClickDrop API status
   - Review error logs in Django console

3. **Images Not Processing**
   - Ensure media directories exist and are writable
   - Check file permissions
   - Verify image format is supported

4. **Status Not Updating**
   - Check network connectivity to ClickDrop API
   - Verify task ID is being saved correctly
   - Review Django logs for errors

### Debug Mode
```bash
# Enable verbose Django logging
python manage.py runserver --verbosity 2

# Check environment variables
python -c "import os; print('CLICKDROP_API_KEY:', os.environ.get('CLICKDROP_API_KEY', 'NOT SET'))"
```

## 📊 Monitoring & Logs

### Django Logs
- Check Django console for API request logs
- Monitor text removal service logs
- Review error messages and stack traces

### API Monitoring
- Monitor ClickDrop API response times
- Track success/failure rates
- Check API quota usage

## 🔒 Security Considerations

- Keep API keys secure and private
- Don't commit .env files to version control
- Use HTTPS in production
- Implement rate limiting if needed
- Validate file uploads

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
CLICKDROP_API_KEY=your_production_api_key
DEBUG=False
SECRET_KEY=your_production_secret_key
```

### File Permissions
```bash
# Ensure media directories are writable
chmod 755 backend/media/
chmod 755 backend/media/uploads/
chmod 755 backend/media/processed/
```

### Database
- Consider using PostgreSQL for production
- Set up proper database backups
- Configure connection pooling

## 📚 Additional Resources

- [ClickDrop API Documentation](https://clickdrop.co/api-docs)
- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Support

If you encounter issues:
1. Check this setup guide
2. Review Django console logs
3. Verify API key configuration
4. Test ClickDrop API directly
5. Check network connectivity

---

**Note**: This tool is for educational and development purposes. Ensure compliance with ClickDrop's terms of service and any applicable regulations. 