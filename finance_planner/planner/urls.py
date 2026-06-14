from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import * 

router=DefaultRouter()

router.register('category',CategoryViewSet,basename='category')
router.register('transaction',TransactionViewSet,basename='transaction')


urlpatterns=[
    path('',include(router.urls)),
]