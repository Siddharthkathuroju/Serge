import os
import logging
from django.conf import settings
from PIL import Image
import io
from .vqgan_model import vqgan_service

logger = logging.getLogger(__name__)

class ImageCompressionService:
    def __init__(self):
        self.max_width = 1920
        self.max_height = 1080
        self.quality = 85
        self.supported_formats = ['JPEG', 'PNG', 'WEBP']
        self.use_vqgan = True  # Enable VQGAN by default
        self.vqgan_model_path = getattr(settings, 'VQGAN_MODEL_PATH', None)
        
        # Try to load VQGAN model
        if self.use_vqgan and self.vqgan_model_path:
            if vqgan_service.load_model(self.vqgan_model_path):
                logger.info("VQGAN model loaded successfully")
            else:
                logger.warning("Failed to load VQGAN model, falling back to PIL compression")
                self.use_vqgan = False
        else:
            logger.info("VQGAN model path not configured, using PIL compression")
            self.use_vqgan = False
    
    def compress_image(self, image_path, output_path=None):
        """
        Compress an image using VQGAN (if available) or PIL fallback
        Returns: dict with compression results
        """
        # Try VQGAN compression first
        if self.use_vqgan:
            vqgan_result = vqgan_service.compress_image(image_path, output_path)
            if vqgan_result['success']:
                vqgan_result['method'] = 'VQGAN'
                return vqgan_result
            else:
                logger.warning(f"VQGAN compression failed: {vqgan_result['error']}, falling back to PIL")
        
        # Fallback to PIL compression
        try:
            # Open the image
            with Image.open(image_path) as img:
                # Convert to RGB if necessary (for JPEG output)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create a white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Get original size
                original_size = os.path.getsize(image_path)
                
                # Resize if too large
                if img.width > self.max_width or img.height > self.max_height:
                    img.thumbnail((self.max_width, self.max_height), Image.Resampling.LANCZOS)
                
                # Determine output format
                if output_path is None:
                    output_path = image_path.replace('.', '_compressed.')
                
                # Save with compression
                img.save(
                    output_path,
                    'JPEG',
                    quality=self.quality,
                    optimize=True,
                    progressive=True
                )
                
                # Get compressed size
                compressed_size = os.path.getsize(output_path)
                compression_ratio = compressed_size / original_size if original_size > 0 else 0
                
                return {
                    'success': True,
                    'original_size': original_size,
                    'compressed_size': compressed_size,
                    'compression_ratio': compression_ratio,
                    'output_path': output_path,
                    'method': 'PIL',
                    'message': f'PIL compressed from {original_size} to {compressed_size} bytes ({compression_ratio:.2%} of original)'
                }
                
        except Exception as e:
            logger.error(f"Compression error: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'PIL',
                'message': f'Compression failed: {str(e)}'
            }
    
    def compress_image_bytes(self, image_bytes, format='JPEG'):
        """
        Compress image from bytes using VQGAN (if available) or PIL fallback
        """
        # Try VQGAN compression first
        if self.use_vqgan:
            vqgan_result = vqgan_service.compress_image_bytes(image_bytes, format)
            if vqgan_result['success']:
                vqgan_result['method'] = 'VQGAN'
                return vqgan_result
            else:
                logger.warning(f"VQGAN compression failed: {vqgan_result['error']}, falling back to PIL")
        
        # Fallback to PIL compression
        try:
            # Open image from bytes
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > self.max_width or img.height > self.max_height:
                img.thumbnail((self.max_width, self.max_height), Image.Resampling.LANCZOS)
            
            # Compress to bytes
            output = io.BytesIO()
            img.save(
                output,
                format=format,
                quality=self.quality,
                optimize=True,
                progressive=True
            )
            
            return {
                'success': True,
                'compressed_bytes': output.getvalue(),
                'original_size': len(image_bytes),
                'compressed_size': len(output.getvalue()),
                'method': 'PIL'
            }
            
        except Exception as e:
            logger.error(f"Compression error: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'PIL'
            }

# Create a singleton instance
compression_service = ImageCompressionService()
