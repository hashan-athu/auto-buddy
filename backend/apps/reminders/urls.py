from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ReminderViewSet, RunRemindersView

router = DefaultRouter()
router.register("reminders", ReminderViewSet, basename="reminder")

urlpatterns = [
    path("reminders/run/", RunRemindersView.as_view(), name="reminders-run"),
    *router.urls,
]
