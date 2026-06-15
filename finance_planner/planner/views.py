from django.shortcuts import render
from rest_framework import viewsets,filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from decimal import Decimal

from .models import *
from .serializers import *

# Create your views here.
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class=CategorySerializer
    permission_classes=[IsAuthenticated]
    filterset_fields = ["type"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "name"]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class=TransactionSerializer
    permission_classes=[IsAuthenticated]
    filterset_fields = ["category", "date"]
    search_fields = ["description", "category__name"]
    ordering_fields = ["date", "amount", "created_at"]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
    @action(detail=False,methods=['get'])
    def statistics(self,request):
        queryset = self.get_queryset()

        income = queryset.filter(
            category__type=Category.Type.INCOME
        ).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0")

        expense = queryset.filter(
            category__type=Category.Type.EXPENSE
        ).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0")

        balance = income - expense

        return Response({
            "income": income,
            "expense": expense,
            "balance": balance,
        })
    
def frontend(request):
    return render(request, "planner/index.html")