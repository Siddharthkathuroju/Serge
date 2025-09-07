# VQGAN Model Setup Guide

This guide explains how to set up the VQGAN model for AI-powered image compression.

## Prerequisites

1. **PyTorch Installation**: Make sure PyTorch is installed
   ```bash
   pip install torch torchvision
   ```

2. **Model File**: You need a trained VQGAN model checkpoint file

## Model Setup

### Option 1: Using Your Trained Model

1. **Place your model file** in the backend directory:
   ```bash
   backend/
   ├── models/
   │   └── vqgan_model.pth  # Your trained model
   ```

2. **Set environment variable** in `backend/.env`:
   ```bash
   VQGAN_MODEL_PATH=./models/vqgan_model.pth
   VQGAN_ENABLED=True
   ```

### Option 2: Train Your Own Model

1. **Run the training script** (place your training code in `backend/train_vqgan.py`):
   ```python
   # Your training code here
   # Make sure to save the model as:
   # torch.save({
   #     'encoder': encoder.state_dict(),
   #     'decoder': decoder.state_dict(),
   #     'quantizer': quantizer.state_dict(),
   #     'disc': disc.state_dict(),
   #     'epoch': epoch
   # }, 'vqgan_model.pth')
   ```

2. **Move the trained model** to the models directory:
   ```bash
   mkdir -p backend/models
   mv vqgan_model.pth backend/models/
   ```

## Configuration

### Environment Variables

Add these to your `backend/.env` file:

```bash
# VQGAN Configuration
VQGAN_MODEL_PATH=./models/vqgan_model.pth
VQGAN_ENABLED=True

# Existing configurations
CLICKDROP_API_KEY=your_clipdrop_key
DEBUG=True
```

### Model Parameters

The VQGAN model uses these default parameters:
- **Input Size**: 64x64 pixels (resized automatically)
- **Embedding Dimension**: 256
- **Number of Embeddings**: 1024
- **Hidden Channels**: 256

## Testing the Setup

1. **Start the Django server**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Check the logs** for VQGAN loading status:
   - ✅ "VQGAN model loaded successfully" - Model is ready
   - ⚠️ "Failed to load VQGAN model, falling back to PIL" - Using fallback compression
   - ℹ️ "VQGAN model path not configured, using PIL compression" - No model configured

3. **Test compression**:
   - Upload an image through the web interface
   - Click "🤖 AI Compress Image"
   - Check if compression uses VQGAN or PIL fallback

## Troubleshooting

### Common Issues

1. **Model not found**:
   ```
   Error: VQGAN model not loaded
   ```
   - Check if `VQGAN_MODEL_PATH` is correct
   - Verify the model file exists
   - Check file permissions

2. **CUDA out of memory**:
   ```
   RuntimeError: CUDA out of memory
   ```
   - The model will automatically fall back to CPU
   - For large images, consider reducing batch size

3. **Model loading error**:
   ```
   Error loading VQGAN model: ...
   ```
   - Check model file format
   - Verify model architecture matches the code
   - Check PyTorch version compatibility

### Fallback Behavior

If VQGAN fails to load or process an image, the system automatically falls back to PIL compression:
- Uses JPEG compression with 85% quality
- Resizes large images to 1920x1080 max
- Provides basic compression functionality

## Performance Notes

- **VQGAN**: Higher quality compression, slower processing
- **PIL Fallback**: Faster processing, basic compression
- **Memory Usage**: VQGAN requires more RAM/VRAM
- **Processing Time**: VQGAN takes 2-5x longer than PIL

## Model Architecture

The VQGAN model consists of:
- **Encoder**: Converts image to latent representation
- **Vector Quantizer**: Discretizes latent space
- **Decoder**: Reconstructs image from quantized latents

This architecture enables high-quality compression by learning optimal representations of image data.
