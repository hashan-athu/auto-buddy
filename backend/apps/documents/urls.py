from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DocumentDownloadView, DocumentViewSet

router = DefaultRouter()
router.register("documents", DocumentViewSet, basename="document")

urlpatterns = [
    path(
        "documents/<int:pk>/download/",
        DocumentDownloadView.as_view(),
        name="document-download",
    ),
    *router.urls,
]
