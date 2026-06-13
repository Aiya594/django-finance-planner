from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

# added customuser because idk how to make email unique in ther ways
class CustomUser(AbstractUser):
    email=models.EmailField(unique=True)