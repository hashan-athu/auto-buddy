from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class AuthFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="alice", password="pw12345678", email="alice@example.com"
        )

    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)

    def test_login_me_logout_cycle(self):
        login = self.client.post(
            "/api/auth/login/",
            {"username": "alice", "password": "pw12345678"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data["username"], "alice")

        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["username"], "alice")

        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)

    def test_login_rejects_bad_password(self):
        r = self.client.post(
            "/api/auth/login/",
            {"username": "alice", "password": "wrong"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)
