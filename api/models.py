from django.db import models

class Dataset(models.Model):
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    filename = models.CharField(max_length=255, blank=True)
    
    # We store the calculated stats as JSON so we can load them instantly later
    stats = models.JSONField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.file:
            self.filename = self.file.name
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-uploaded_at']  # Newest first