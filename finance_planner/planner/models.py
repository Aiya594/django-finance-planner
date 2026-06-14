from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# Create your models here.

# added customuser because idk how to make email unique in ther ways
class CustomUser(AbstractUser):
    email=models.EmailField(unique=True)


class Category(models.Model):
    class Type(models.TextChoices):
        INCOME='income',"Income"
        EXPENSE='expense','Expense'

    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='categories')
    name=models.CharField(max_length=255)
    type=models.CharField(max_length=20, choices=Type.choices)
    created_at=models.DateTimeField(auto_now_add=True)
    

class Transaction(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='transactions')
    category=models.ForeignKey(Category,on_delete=models.PROTECT,related_name='transactions')
    amount=models.DecimalField(max_digits=12,decimal_places=2)
    description=models.TextField(blank=True)
    date=models.DateField(null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

