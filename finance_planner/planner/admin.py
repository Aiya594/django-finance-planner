from django.contrib import admin
from .models import *
# Register your models here.
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    pass


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    pass 

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    pass