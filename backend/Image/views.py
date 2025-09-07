from django.http import JsonResponse, FileResponse, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt
from .models import Image
from .text_removal_service import text_removal_service
from .compression_service import compression_service
import datetime
import logging
import os

logger = logging.getLogger(__name__)

@csrf_exempt
def upload_image(request):
    if request.method == "POST":
        image_file = request.FILES.get("image")
        created_by = request.POST.get("created_by", "anonymous")
        
        # Get date/time or use current if not provided
        date = request.POST.get("date", datetime.date.today().strftime("%Y-%m-%d"))
        time = request.POST.get("time", datetime.datetime.now().strftime("%H:%M:%S"))

        if not image_file:
            return JsonResponse({"error": "No image file provided."}, status=400)

        try:
            # Create image instance
            image_instance = Image.objects.create(
                image=image_file,
                created_by=created_by,
                date=date,
                time=time,
            )
            
            logger.info(f"Image {image_instance.id} uploaded successfully")
            
            # Start text removal process
            text_removal_result = text_removal_service.remove_text_from_image(image_instance)
            
            # Return successful response with text removal status
            return JsonResponse({
                "success": True,
                "image": {
                    "id": image_instance.id,
                    "url": image_instance.image.url,
                    "original_url": image_instance.image.url,
                    "processed_url": image_instance.processed_image.url if image_instance.processed_image else None,
                    "created_by": image_instance.created_by,
                    "date": image_instance.date,
                    "time": image_instance.time,
                    "text_removal_status": image_instance.text_removal_status,
                    "text_removed": image_instance.text_removed
                },
                "text_removal": text_removal_result
            })
            
        except Exception as e:
            logger.error(f"Error saving image: {e}")
            return JsonResponse({"error": str(e)}, status=500)
            
    return JsonResponse({"error": "POST request required."}, status=405)

@csrf_exempt
def remove_text(request, image_id):
    """Remove text from a specific image"""
    if request.method == "POST":
        try:
            image_instance = Image.objects.get(id=image_id)
            
            # Start text removal process
            result = text_removal_service.remove_text_from_image(image_instance)
            
            return JsonResponse({
                "success": True,
                "result": result,
                "image": {
                    "id": image_instance.id,
                    "text_removal_status": image_instance.text_removal_status,
                    "text_removed": image_instance.text_removed
                }
            })
            
        except Image.DoesNotExist:
            return JsonResponse({"error": "Image not found"}, status=404)
        except Exception as e:
            logger.error(f"Error removing text from image {image_id}: {e}")
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "POST request required"}, status=405)

@csrf_exempt
def check_text_removal_status(request, image_id):
    """Check the status of text removal for a specific image"""
    if request.method == "GET":
        try:
            image_instance = Image.objects.get(id=image_id)
            
            if image_instance.clickdrop_task_id:
                # Check status from ClickDrop API
                result = text_removal_service.check_task_status(image_instance)
                
                return JsonResponse({
                    "success": True,
                    "status": image_instance.text_removal_status,
                    "result": result,
                    "image": {
                        "id": image_instance.id,
                        "text_removal_status": image_instance.text_removal_status,
                        "text_removed": image_instance.text_removed,
                        "processed_image_url": image_instance.processed_image.url if image_instance.processed_image else None
                    }
                })
            else:
                return JsonResponse({
                    "success": True,
                    "status": image_instance.text_removal_status,
                    "message": "No text removal task found for this image"
                })
                
        except Image.DoesNotExist:
            return JsonResponse({"error": "Image not found"}, status=404)
        except Exception as e:
            logger.error(f"Error checking status for image {image_id}: {e}")
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "GET request required"}, status=405)

@csrf_exempt
def get_image_details(request, image_id):
    """Get detailed information about an image including text removal status"""
    if request.method == "GET":
        try:
            image_instance = Image.objects.get(id=image_id)
            
            return JsonResponse({
                "success": True,
                "image": {
                    "id": image_instance.id,
                    "original_url": image_instance.image.url,
                    "processed_url": image_instance.processed_image.url if image_instance.processed_image else None,
                    "created_by": image_instance.created_by,
                    "date": image_instance.date,
                    "time": image_instance.time,
                    "text_removal_status": image_instance.text_removal_status,
                    "text_removed": image_instance.text_removed,
                    "text_removal_error": image_instance.text_removal_error,
                    "clickdrop_task_id": image_instance.clickdrop_task_id
                }
            })
            
        except Image.DoesNotExist:
            return JsonResponse({"error": "Image not found"}, status=404)
        except Exception as e:
            logger.error(f"Error getting details for image {image_id}: {e}")
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "GET request required"}, status=405)


@csrf_exempt
def download_processed(request, image_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"}, status=405)

    try:
        image = Image.objects.get(id=image_id)
    except Image.DoesNotExist:
        return JsonResponse({"error": "Image not found"}, status=404)

    if not image.processed_image:
        return HttpResponseNotFound("Processed image not available")

    response = FileResponse(image.processed_image.open('rb'), as_attachment=True, filename=image.processed_image.name.split('/')[-1])
    return response


@csrf_exempt
def compress_image(request, image_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)

    try:
        image = Image.objects.get(id=image_id)
    except Image.DoesNotExist:
        return JsonResponse({"error": "Image not found"}, status=404)

    if not image.image:
        return JsonResponse({"error": "No image to compress"}, status=400)

    try:
        # Update status to processing
        image.compression_status = 'processing'
        image.save()

        # Compress the image
        result = compression_service.compress_image(image.image.path)
        
        if result['success']:
            # Save compressed image
            from django.core.files import File
            with open(result['output_path'], 'rb') as f:
                image.compressed_image.save(
                    f"compressed_{image.image.name.split('/')[-1]}",
                    File(f),
                    save=True
                )
            
            # Update model with compression results
            image.compression_processed = True
            image.compression_status = 'completed'
            image.original_size = result['original_size']
            image.compressed_size = result['compressed_size']
            image.compression_ratio = result['compression_ratio']
            image.compression_error = None
            image.save()

            # Clean up temporary file
            if os.path.exists(result['output_path']):
                os.remove(result['output_path'])

            return JsonResponse({
                'success': True,
                'message': result['message'],
                'compression': {
                    'success': True,
                    'original_size': result['original_size'],
                    'compressed_size': result['compressed_size'],
                    'compression_ratio': result['compression_ratio'],
                    'compressed_url': image.compressed_image.url if image.compressed_image else None
                }
            })
        else:
            # Update status to failed
            image.compression_status = 'failed'
            image.compression_error = result['error']
            image.save()

            return JsonResponse({
                'success': False,
                'error': result['error'],
                'compression': {
                    'success': False,
                    'error': result['error']
                }
            })

    except Exception as e:
        logger.error(f"Compression error for image {image_id}: {e}")
        image.compression_status = 'failed'
        image.compression_error = str(e)
        image.save()
        
        return JsonResponse({
            'success': False,
            'error': str(e),
            'compression': {
                'success': False,
                'error': str(e)
            }
        })


@csrf_exempt
def check_compression_status(request, image_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"}, status=405)

    try:
        image = Image.objects.get(id=image_id)
    except Image.DoesNotExist:
        return JsonResponse({"error": "Image not found"}, status=404)

    return JsonResponse({
        'success': True,
        'compression': {
            'processed': image.compression_processed,
            'status': image.compression_status,
            'error': image.compression_error,
            'original_size': image.original_size,
            'compressed_size': image.compressed_size,
            'compression_ratio': image.compression_ratio,
            'compressed_url': image.compressed_image.url if image.compressed_image else None
        }
    })


@csrf_exempt
def download_compressed(request, image_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"}, status=405)

    try:
        image = Image.objects.get(id=image_id)
    except Image.DoesNotExist:
        return JsonResponse({"error": "Image not found"}, status=404)

    if not image.compressed_image:
        return HttpResponseNotFound("Compressed image not available")

    response = FileResponse(image.compressed_image.open('rb'), as_attachment=True, filename=image.compressed_image.name.split('/')[-1])
    return response