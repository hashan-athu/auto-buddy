import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.documents.models import Document
from apps.vehicles.models import Vehicle

User = get_user_model()
_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=_MEDIA)
class DocumentPrivacyTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(_MEDIA, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678")
        self.bob = User.objects.create_user("bob", password="pw12345678")
        self.av = Vehicle.objects.create(owner=self.alice, make="Nissan", model="GT-R")

    def _upload(self):
        f = SimpleUploadedFile("policy.txt", b"secret contents", content_type="text/plain")
        r = self.client.post(
            "/api/documents/",
            {"vehicle": self.av.id, "type": "insurance", "title": "Policy", "file": f},
            format="multipart",
        )
        return r

    def test_upload_returns_relative_download_url(self):
        self.client.force_authenticate(self.alice)
        r = self._upload()
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["file_url"], f"/api/documents/{r.data['id']}/download/")

    def test_owner_can_download_others_cannot(self):
        self.client.force_authenticate(self.alice)
        doc_id = self._upload().data["id"]

        # Owner: 200 with the bytes
        owner_dl = self.client.get(f"/api/documents/{doc_id}/download/")
        self.assertEqual(owner_dl.status_code, 200)
        self.assertEqual(b"".join(owner_dl.streaming_content), b"secret contents")

        # Another user: 404 (not even acknowledged)
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get(f"/api/documents/{doc_id}/download/").status_code, 404)

        # Anonymous: 403
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(f"/api/documents/{doc_id}/download/").status_code, 403)

    def test_metadata_edit_and_delete(self):
        self.client.force_authenticate(self.alice)
        doc_id = self._upload().data["id"]
        self.assertEqual(
            self.client.patch(f"/api/documents/{doc_id}/", {"title": "Renamed"}, format="json").status_code, 200
        )
        self.assertEqual(Document.objects.get(id=doc_id).title, "Renamed")
        self.assertEqual(self.client.delete(f"/api/documents/{doc_id}/").status_code, 204)
        self.assertFalse(Document.objects.filter(id=doc_id).exists())
