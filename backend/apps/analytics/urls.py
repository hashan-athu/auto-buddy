from django.urls import path

from .views import VehicleAnalyticsView

urlpatterns = [
    path(
        "vehicles/<int:pk>/analytics/",
        VehicleAnalyticsView.as_view(),
        name="vehicle-analytics",
    ),
]
