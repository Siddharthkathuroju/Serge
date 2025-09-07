from django.db import models

class Image(models.Model):
    # Basic image fields
    image = models.ImageField(upload_to='uploads/')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=255)
    date = models.CharField(max_length=20)
    time = models.CharField(max_length=20)
    
    # Text removal fields
    text_removed = models.BooleanField(default=False)
    text_removal_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    text_removal_error = models.TextField(blank=True, null=True)
    processed_image = models.ImageField(upload_to='processed/', blank=True, null=True)
    clickdrop_task_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Image compression fields
    compression_processed = models.BooleanField(default=False)
    compression_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    compression_error = models.TextField(blank=True, null=True)
    compressed_image = models.ImageField(upload_to='compressed/', blank=True, null=True)
    original_size = models.IntegerField(blank=True, null=True, help_text='Original file size in bytes')
    compressed_size = models.IntegerField(blank=True, null=True, help_text='Compressed file size in bytes')
    compression_ratio = models.FloatField(blank=True, null=True, help_text='Compression ratio (0-1)')

    def __str__(self):
        status = f" - Text removal: {self.text_removal_status}"
        if self.compression_processed:
            status += f" - Compression: {self.compression_status}"
        return f"Image uploaded by {self.created_by} on {self.date} at {self.time}{status}"
