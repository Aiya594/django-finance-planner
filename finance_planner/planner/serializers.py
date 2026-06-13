from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

class CustomRegisterSerializer(RegisterSerializer):
    def validate_email(self, email):
        email=email.strip().lower()

        User=get_user_model()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "User with this email already exists."
            )

        return email