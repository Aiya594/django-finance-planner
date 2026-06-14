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
        constraints = [models.UniqueConstraint(
            fields=["user", "name", "type"],
            name="unique_category_per_user_type")]
    
    def validate_name(self,value):
        value=value.strip()
        if len(value)<3:
            raise serializers.ValidationError('Category name must have at least 3 charachters')
        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return attrs

        name = attrs.get("name")
        category_type = attrs.get("type")

        queryset = Category.objects.filter(
            user=request.user,
            name__iexact=name,
            type=category_type,
        )

        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError({
                "name": "You already have this category with this type."
            })

        return attrs

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
