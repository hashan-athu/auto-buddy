from django.http import FileResponse, Http404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.vehicles.scoping import VehicleScopedViewSet

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(VehicleScopedViewSet):
    serializer_class = DocumentSerializer


class DocumentDownloadView(APIView):
    """Stream a document's file only to its owner.

    This is the private-storage guarantee: files are never exposed via the
    public MEDIA_URL. On S3 this view would hand back a short-lived signed URL
    instead of streaming; the ownership check stays the same.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            document = Document.objects.get(pk=pk, vehicle__owner=request.user)
        except Document.DoesNotExist:
            raise Http404
        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=document.filename,
        )
