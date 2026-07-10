"""Root URL configuration.

/admin/  -> Django admin (power-editing backstop for the owner)
/api/    -> REST API, versioned implicitly by app routers
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

api_patterns = [
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.vehicles.urls")),
    path("", include("apps.logs.urls")),
    path("", include("apps.maintenance.urls")),
    path("", include("apps.documents.urls")),
    path("", include("apps.reminders.urls")),
    path("", include("apps.components.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_patterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
