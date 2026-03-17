"""Integration tests for team CRUD, join/leave, and auto-enrollment."""

from tests.conftest import auth_headers
from app.models.enrollment import Enrollment


def test_create_team(client, hackathon, organizer_user):
    resp = client.post(
        "/api/v1/teams",
        json={"name": "Dream Team", "description": "We build things"},
        params={"hackathon_id": hackathon.id},
        headers=auth_headers(organizer_user),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Dream Team"
    assert body["hackathon_id"] == hackathon.id
    assert body["leader_id"] == organizer_user.id


def test_create_team_auto_enrolls_leader(client, session, hackathon, organizer_user):
    """Creating a team should auto-enroll the leader in the hackathon."""
    client.post(
        "/api/v1/teams",
        json={"name": "Enroll Team"},
        params={"hackathon_id": hackathon.id},
        headers=auth_headers(organizer_user),
    )

    from sqlmodel import select
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.user_id == organizer_user.id,
            Enrollment.hackathon_id == hackathon.id,
        )
    ).first()
    assert enrollment is not None
    assert enrollment.status == "approved"


def test_list_teams_by_hackathon(client, hackathon, organizer_user):
    # Create two teams
    for name in ["Alpha", "Beta"]:
        client.post(
            "/api/v1/teams",
            json={"name": name},
            params={"hackathon_id": hackathon.id},
            headers=auth_headers(organizer_user),
        )

    resp = client.get("/api/v1/teams", params={"hackathon_id": hackathon.id})
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_get_team_by_id(client, hackathon, organizer_user):
    create_resp = client.post(
        "/api/v1/teams",
        json={"name": "Lookup Team"},
        params={"hackathon_id": hackathon.id},
        headers=auth_headers(organizer_user),
    )
    team_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/teams/{team_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Lookup Team"
    # Should include members list
    assert "members" in body


def test_join_team(client, session, hackathon, organizer_user, normal_user):
    create_resp = client.post(
        "/api/v1/teams",
        json={"name": "Join Team"},
        params={"hackathon_id": hackathon.id},
        headers=auth_headers(organizer_user),
    )
    team_id = create_resp.json()["id"]

    join_resp = client.post(
        f"/api/v1/teams/{team_id}/join",
        headers=auth_headers(normal_user),
    )
    assert join_resp.status_code == 200
    assert join_resp.json()["user_id"] == normal_user.id

    # Verify auto-enrollment
    from sqlmodel import select
    enrollment = session.exec(
        select(Enrollment).where(
            Enrollment.user_id == normal_user.id,
            Enrollment.hackathon_id == hackathon.id,
        )
    ).first()
    assert enrollment is not None


def test_join_team_twice_returns_400(client, hackathon, organizer_user, normal_user):
    create_resp = client.post(
        "/api/v1/teams",
        json={"name": "Dup Team"},
        params={"hackathon_id": hackathon.id},
        headers=auth_headers(organizer_user),
    )
    team_id = create_resp.json()["id"]

    client.post(f"/api/v1/teams/{team_id}/join", headers=auth_headers(normal_user))
    # Second join → 400
    resp = client.post(f"/api/v1/teams/{team_id}/join", headers=auth_headers(normal_user))
    assert resp.status_code == 400


def test_leave_team(client, hackathon, organizer_user, normal_user):
    create_resp = client.post(
        "/api/v1/teams",
        json={"name": "Leave Team"},
        params={"hackathon_id": hackathon.id},
        headers=auth_headers(organizer_user),
    )
    team_id = create_resp.json()["id"]

    # Join then leave
    client.post(f"/api/v1/teams/{team_id}/join", headers=auth_headers(normal_user))
    leave_resp = client.delete(
        f"/api/v1/teams/{team_id}/leave",
        headers=auth_headers(normal_user),
    )
    assert leave_resp.status_code == 200


def test_get_my_teams(client, hackathon, organizer_user):
    client.post(
        "/api/v1/teams",
        json={"name": "My Team"},
        params={"hackathon_id": hackathon.id},
        headers=auth_headers(organizer_user),
    )

    resp = client.get("/api/v1/teams/me", headers=auth_headers(organizer_user))
    assert resp.status_code == 200
    names = [t["name"] for t in resp.json()]
    assert "My Team" in names
