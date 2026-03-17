"""Integration tests for hackathon CRUD, soft-delete, and permissions."""

import json
from datetime import datetime, timedelta

from tests.conftest import auth_headers


def _hackathon_payload(**overrides):
    """Default valid hackathon creation payload."""
    now = datetime.utcnow()
    base = {
        "title": "New Hackathon",
        "description": "desc",
        "start_date": (now + timedelta(days=1)).isoformat(),
        "end_date": (now + timedelta(days=10)).isoformat(),
        "registration_type": "team",
        "format": "online",
        "status": "draft",
    }
    base.update(overrides)
    return base


def test_create_hackathon_as_organizer(client, organizer_user):
    resp = client.post(
        "/api/v1/hackathons",
        json=_hackathon_payload(),
        headers=auth_headers(organizer_user),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "New Hackathon"
    assert body["created_by"] == organizer_user.id


def test_create_hackathon_as_normal_user_forbidden(client, normal_user):
    resp = client.post(
        "/api/v1/hackathons",
        json=_hackathon_payload(),
        headers=auth_headers(normal_user),
    )
    assert resp.status_code == 403


def test_list_hackathons_excludes_deleted(client, session, organizer_user):
    """Soft-deleted hackathons should NOT appear in the list."""
    from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType

    now = datetime.utcnow()
    visible = Hackathon(
        title="Visible",
        start_date=now,
        end_date=now + timedelta(days=5),
        status=HackathonStatus.PUBLISHED,
        created_by=organizer_user.id,
        created_at=now,
        updated_at=now,
    )
    deleted = Hackathon(
        title="Deleted",
        start_date=now,
        end_date=now + timedelta(days=5),
        status=HackathonStatus.DELETED,
        created_by=organizer_user.id,
        created_at=now,
        updated_at=now,
    )
    session.add_all([visible, deleted])
    session.commit()

    resp = client.get("/api/v1/hackathons")
    assert resp.status_code == 200
    titles = [h["title"] for h in resp.json()]
    assert "Visible" in titles
    assert "Deleted" not in titles


def test_get_hackathon_by_id(client, hackathon):
    resp = client.get(f"/api/v1/hackathons/{hackathon.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == hackathon.id
    assert body["title"] == hackathon.title
    # Detail response should have sections, hosts, partners keys
    assert "sections" in body
    assert "hosts" in body
    assert "partners" in body


def test_update_hackathon_by_owner(client, hackathon, organizer_user):
    resp = client.patch(
        f"/api/v1/hackathons/{hackathon.id}",
        json={"title": "Updated Title"},
        headers=auth_headers(organizer_user),
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Title"


def test_update_hackathon_by_non_owner_forbidden(client, hackathon, session):
    """Another organizer (not owner of this hackathon) should get 403."""
    from app.models.user import User
    from app.core.security import get_password_hash

    other = User(
        email="other_org@test.com",
        full_name="Other Org",
        hashed_password=get_password_hash("testpass123"),
        is_active=True,
        can_create_hackathon=True,
    )
    session.add(other)
    session.commit()
    session.refresh(other)

    resp = client.patch(
        f"/api/v1/hackathons/{hackathon.id}",
        json={"title": "Hacked"},
        headers=auth_headers(other),
    )
    assert resp.status_code == 403


def test_delete_hackathon_soft_deletes(client, hackathon, organizer_user, session):
    resp = client.delete(
        f"/api/v1/hackathons/{hackathon.id}",
        headers=auth_headers(organizer_user),
    )
    assert resp.status_code == 204

    # Verify status changed in DB
    from app.models.hackathon import Hackathon
    session.expire_all()
    h = session.get(Hackathon, hackathon.id)
    assert h.status == "deleted"


def test_filter_hackathons_by_status(client, session, organizer_user):
    from app.models.hackathon import Hackathon, HackathonStatus

    now = datetime.utcnow()
    for s in [HackathonStatus.ONGOING, HackathonStatus.ENDED]:
        h = Hackathon(
            title=f"Hack-{s.value}",
            start_date=now,
            end_date=now + timedelta(days=5),
            status=s,
            created_by=organizer_user.id,
            created_at=now,
            updated_at=now,
        )
        session.add(h)
    session.commit()

    resp = client.get("/api/v1/hackathons", params={"status": "ongoing"})
    assert resp.status_code == 200
    titles = [h["title"] for h in resp.json()]
    assert "Hack-ongoing" in titles
    assert "Hack-ended" not in titles
