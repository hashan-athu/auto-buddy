from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Project user.

    Currently a straight extension of Django's user, but declared up front so
    AUTH_USER_MODEL is already custom — swapping it in later is a painful
    migration. Future profile fields (units preference, currency, avatar) live here.
    """

    def __str__(self):
        return self.get_username()
