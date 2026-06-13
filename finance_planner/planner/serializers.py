from django.contrib.auth import get_user_model
from django.utils import timezone
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from .models import *

class CustomRegisterSerializer(RegisterSerializer):
    def validate_email(self, email):
        email=email.strip().lower()

        User=get_user_model()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "User with this email already exists."
            )

        return email
    

class CategorySerializer(serializers.ModelSerializer):
    user_name=serializers.ReadOnlyField(source='user.username')

    class Meta:
        model=Category
        fields=['id',
            'name',
            'user_name',
            'type',
            'created_at']
        read_only_fields=['id','created_at','user_name']
    
    def validate_name(self,value):
        value=value.strip()
        if len(value)<3:
            raise serializers.ValidationError('Category name must have at least 3 charachters')
        return value


class TransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source="user.username")
    category_name = serializers.ReadOnlyField(source="category.name")
    category_type = serializers.ReadOnlyField(source="category.type")

    class Meta:
        model = Transaction
        fields = [
            "id",
            "category",
            "category_name",
            "category_type",
            "user_name",
            "amount",
            "description",
            "date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "user_name",
            "category_name",
            "category_type",
        ]

    def validate_amount(self,value):
        if value<0:
            raise serializers.ValidationError("Amount cannot be negative")
        return value

    def validate_category(self, category):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return category

        if category.user != request.user:
            raise serializers.ValidationError(
                "You can use only your own categories."
            )

        return category

    def validate_date(self, value):
        today = timezone.now().date()

        if value > today:
            raise serializers.ValidationError(
                "Date cannot be in the future."
            )

        return value