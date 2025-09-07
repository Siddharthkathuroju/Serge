# Django Text Removal Tool

This Django backend provides a powerful text removal service using the ClickDrop API. It automatically removes text from uploaded images and provides real-time status updates.

## 🚀 Features

- **AI-Powered Text Removal**: Uses ClickDrop API for advanced text removal
- **Automatic Processing**: Starts text removal immediately after upload
- **Real-Time Status**: Live updates on processing progress
- **Image Storage**: Stores both original and processed images
- **RESTful API**: Clean API endpoints for frontend integration
- **CORS Support**: Configured for Next.js frontend
- **File Validation**: Image type and size validation

## 🧠 How It Works

1. **Upload Image** → Django receives and stores image
2. **Send to ClickDrop** → Image sent to ClickDrop API for text removal
3. **Process & Monitor** → Real-time status monitoring
4. **Download Result** → Processed image downloaded and stored
5. **Display Results** → Both original and processed images shown

## 📁 Project Structure

```
backend/
├── Image/                          # Django app
│   ├── models.py                  # Image model with text removal fields
│   ├── views.py                   # Upload and text removal views
│   ├── text_removal_service.py    # ClickDrop API integration
│   └── urls.py                    # URL routing
├── Backend/                       # Django project
│   ├── settings.py                # Django configuration
│   └── urls.py                    # Main URL routing
├── media/                         # Image storage
│   ├── uploads/                   # Original images
│   └── processed/                 # Text-removed images
├── config.py                      # Configuration settings
├── setup.py                       # Setup script
└── requirements.txt               # Python dependencies
```

## 🛠️ Quick Setup

### 1. Get ClickDrop API Key
1. Visit [https://clickdrop.co/](https://clickdrop.co/)
2. Sign up and get your API key

### 2. Set Environment Variables
Create `.env` file in backend directory:
```bash
CLICKDROP_API_KEY=your_api_key_here
DEBUG=True
```

### 3. Run Setup
```bash
cd backend
python setup.py
```

### 4. Start Server
```bash
python manage.py runserver
```

## 🚀 Usage

### API Endpoints

- **POST** `/image/upload/` - Upload image and start text removal
- **POST** `/image/remove-text/<id>/` - Remove text from specific image
- **GET** `/image/status/<id>/` - Check text removal status
- **GET** `/image/details/<id>/` - Get image details

### Example Upload Response
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

## 🔧 Configuration

### Environment Variables
- **CLICKDROP_API_KEY**: Your ClickDrop API key (required)
- **DEBUG**: Django debug mode (optional)

### File Settings
- **Max file size**: 5MB
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Storage**: Local media directory

## 📊 Frontend Integration

Your Next.js frontend will receive:
- ✅ Upload confirmation
- ✅ Real-time processing status
- ✅ Original and processed image URLs
- ✅ Download links for processed images
- ✅ Error messages and status updates

## 🐛 Troubleshooting

### Common Issues

1. **API Key Not Configured**
   - Set CLICKDROP_API_KEY environment variable
   - Check .env file exists

2. **Text Removal Fails**
   - Verify API key is valid
   - Check ClickDrop API status
   - Review Django logs

3. **Images Not Processing**
   - Ensure media directories exist
   - Check file permissions
   - Verify image format

### Debug Mode
```bash
python manage.py runserver --verbosity 2
```

## 📚 Additional Resources

- **Setup Guide**: `SETUP_GUIDE.md` - Detailed setup instructions
- **ClickDrop API**: [https://clickdrop.co/](https://clickdrop.co/)
- **Django Docs**: https://docs.djangoproject.com/

## 🔒 Security

- Keep API keys secure
- Don't commit .env files
- Use HTTPS in production
- Validate file uploads

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

---

**Note**: This tool uses the ClickDrop API for text removal. Ensure compliance with their terms of service. 