from django.db import models

class ReviewItem(models.Model):
    content = models.CharField(max_length=500)
    risk_score = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default="pending")  # pending | approved | removed | escalated
