import os
import requests
import logging
from django.conf import settings
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from urllib.parse import urlparse
import tempfile

logger = logging.getLogger(__name__)

class ClickDropTextRemovalService:
    """Service for removing text from images using ClickDrop API"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'CLICKDROP_API_KEY', '')
        self.api_url = getattr(settings, 'CLICKDROP_API_URL', 'https://api.clickdrop.co/api/v1')
        
        if not self.api_key:
            logger.warning("ClickDrop API key not configured. Set CLICKDROP_API_KEY environment variable.")
    
    def remove_text_from_image(self, image_instance):
        """Remove text from an image using ClickDrop API"""
        
        if not self.api_key:
            return {
                'success': False,
                'error': 'API key not configured'
            }
        
        try:
            # Update status to processing
            image_instance.text_removal_status = 'processing'
            image_instance.save()
            
            # Prepare the image file for API
            image_path = image_instance.image.path
            
            # Make API request to Clipdrop (synchronous binary response)
            with open(image_path, 'rb') as image_file:
                files = {'image_file': image_file}
                headers = {'x-api-key': self.api_key}
                
                response = requests.post(
                    f'{self.api_url}/remove-text/v1',
                    files=files,
                    headers=headers,
                    timeout=60
                )
            
            if response.status_code == 200:
                # Response is image bytes; save directly as processed image
                try:
                    # Create a temporary file
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
                        temp_file.write(response.content)
                        temp_file_path = temp_file.name

                    # Save to Django model
                    with open(temp_file_path, 'rb') as f:
                        original_filename = os.path.basename(image_instance.image.name)
                        processed_filename = f"processed_{original_filename}"

                        image_instance.processed_image.save(
                            processed_filename,
                            File(f),
                            save=True
                        )

                    # Clean up temp file
                    os.unlink(temp_file_path)

                    # Update status
                    image_instance.text_removal_status = 'completed'
                    image_instance.text_removed = True
                    image_instance.save()

                    return {
                        'success': True,
                        'status': 'completed',
                        'message': 'Text removal completed successfully',
                        'processed_image_url': image_instance.processed_image.url
                    }
                except Exception as save_err:
                    raise Exception(f"Failed to save processed image: {str(save_err)}")
            
            else:
                error_msg = f"API request failed with status {response.status_code}"
                # Try to parse an error body
                try:
                    error_data = response.json()
                    if isinstance(error_data, dict):
                        error_msg = error_data.get('error', error_data.get('message', error_msg))
                except Exception:
                    # Fall back to text preview (often HTML for blocked/invalid requests)
                    preview = response.text[:200] if hasattr(response, 'text') else '<no text>'
                    error_msg = f"{error_msg}. Preview: {preview}"

                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"Text removal failed for image {image_instance.id}: {str(e)}")
            
            # Update status to failed
            image_instance.text_removal_status = 'failed'
            image_instance.text_removal_error = str(e)
            image_instance.save()
            
            return {
                'success': False,
                'error': str(e)
            }
    
    def check_task_status(self, image_instance):
        """Check the status of a text removal task"""
        
        # Clipdrop is synchronous; no task status. Return current model state.
        try:
            return {
                'success': True,
                'status': image_instance.text_removal_status,
                'processed_image_url': image_instance.processed_image.url if image_instance.processed_image else None
            }
        except Exception as e:
            logger.error(f"Status retrieval failed for image {image_instance.id}: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _download_processed_image(self, image_instance, image_url):
        """Download and save the processed image"""
        
        try:
            # Download the processed image
            response = requests.get(image_url, timeout=60)
            response.raise_for_status()
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(response.content)
                temp_file_path = temp_file.name
            
            # Save to Django model
            with open(temp_file_path, 'rb') as f:
                # Generate filename
                original_filename = os.path.basename(image_instance.image.name)
                processed_filename = f"processed_{original_filename}"
                
                # Save the processed image
                image_instance.processed_image.save(
                    processed_filename,
                    File(f),
                    save=True
                )
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            # Update status
            image_instance.text_removal_status = 'completed'
            image_instance.text_removed = True
            image_instance.save()
            
            return {
                'success': True,
                'status': 'completed',
                'message': 'Text removal completed successfully',
                'processed_image_url': image_instance.processed_image.url
            }
            
        except Exception as e:
            logger.error(f"Failed to download processed image for {image_instance.id}: {str(e)}")
            
            # Update status to failed
            image_instance.text_removal_status = 'failed'
            image_instance.text_removal_error = f"Failed to download processed image: {str(e)}"
            image_instance.save()
            
            return {
                'success': False,
                'error': f"Failed to download processed image: {str(e)}"
            }

# Global instance
text_removal_service = ClickDropTextRemovalService() 