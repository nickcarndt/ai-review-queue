from django.db import models


class ReviewItem(models.Model):
    class Category(models.TextChoices):
        GENERAL = "general", "General"
        SPAM = "spam", "Spam"
        HARASSMENT = "harassment", "Harassment"
        MISINFORMATION = "misinformation", "Misinformation"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REMOVED = "removed", "Removed"
        ESCALATED = "escalated", "Escalated"

    content = models.CharField(max_length=500)
    risk_score = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    category = models.CharField(
        max_length=32,
        choices=Category.choices,
        default=Category.GENERAL,
    )
