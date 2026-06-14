from django.shortcuts import render
from rest_framework import viewsets,filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import *
from .serializers import *

# Create your views here.
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class=CategorySerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class=TransactionSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
    