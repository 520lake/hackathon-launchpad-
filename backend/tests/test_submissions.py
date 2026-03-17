"""Integration tests for submissions and scoring math."""

from datetime import datetime, timedelta

from tests.conftest import auth_headers
from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType
from app.models.hackathon_organizer import HackathonOrganizer, OrganizerRole, OrganizerStatus
from app.models.team_project import Team, TeamMember
from app.models.judge import Judge


def _submission_payload(**overrides):
    base = {
        "title": "My Submission",
        "description": "A cool project",
        "tech_stack": "Python, FastAPI",
    }
    base.update(overrides)
    return base


def test_create_individual_submission(client, session, normal_user):
    """Individual hackathon → user_id is set, team_id is null."""
    now = datetime.utcnow()
    h = Hackathon(
        title="Individual Hack",
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        status=HackathonStatus.ONGOING,
        registration_type=RegistrationType.INDIVIDUAL,
        format=HackathonFormat.ONLINE,
        created_by=normal_user.id,
        created_at=now,
        updated_at=now,
    )
    session.add(h)
    session.commit()
    session.refresh(h)

    resp = client.post(
        "/api/v1/submissions",
        json=_submission_payload(),
        params={"hackathon_id": h.id},
        headers=auth_headers(normal_user),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["hackathon_id"] == h.id
    assert body["user_id"] == normal_user.id
    assert body["team_id"] is None


def test_create_team_submission(client, session, organizer_user, hackathon):
    """Team hackathon → team leader can submit; team_id is set."""
    team = Team(
        name="Alpha Team",
        hackathon_id=hackathon.id,
        leader_id=organizer_user.id,
    )
    session.add(team)
    session.commit()
    session.refresh(team)

    member = TeamMember(team_id=team.id, user_id=organizer_user.id)
    session.add(member)
    session.commit()

    resp = client.post(
        "/api/v1/submissions",
        json=_submission_payload(),
        params={"hackathon_id": hackathon.id, "team_id": team.id},
        headers=auth_headers(organizer_user),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["team_id"] == team.id
    assert body["user_id"] is None


def test_score_submission_weighted_total(
    client, session, organizer_user, hackathon_with_criteria, normal_user
):
    """
    Score a submission on two criteria (60%/40%) and verify weighted total_score.
    Innovation=80 (weight 60), Execution=90 (weight 40)
    Expected: (80*60 + 90*40) / (60+40) = (4800+3600)/100 = 84.0
    """
    hackathon, criteria = hackathon_with_criteria

    # Create a team + submission
    team = Team(name="Score Team", hackathon_id=hackathon.id, leader_id=organizer_user.id)
    session.add(team)
    session.commit()
    session.refresh(team)

    member = TeamMember(team_id=team.id, user_id=organizer_user.id)
    session.add(member)
    session.commit()

    sub_resp = client.post(
        "/api/v1/submissions",
        json=_submission_payload(),
        params={"hackathon_id": hackathon.id, "team_id": team.id},
        headers=auth_headers(organizer_user),
    )
    submission_id = sub_resp.json()["id"]

    # Appoint normal_user as judge
    judge = Judge(user_id=normal_user.id, hackathon_id=hackathon.id)
    session.add(judge)
    session.commit()

    # Score
    score_resp = client.post(
        f"/api/v1/submissions/{submission_id}/score",
        json={
            "scores": [
                {"criteria_id": criteria[0].id, "score_value": 80},
                {"criteria_id": criteria[1].id, "score_value": 90},
            ]
        },
        headers=auth_headers(normal_user),
    )
    assert score_resp.status_code == 200

    # Verify total_score on the submission
    get_resp = client.get(f"/api/v1/submissions/{submission_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["total_score"] == pytest.approx(84.0, abs=0.1)


def test_score_upsert_behavior(
    client, session, organizer_user, hackathon_with_criteria, normal_user
):
    """Scoring the same criteria again should update (upsert), not error."""
    hackathon, criteria = hackathon_with_criteria

    team = Team(name="Upsert Team", hackathon_id=hackathon.id, leader_id=organizer_user.id)
    session.add(team)
    session.commit()
    session.refresh(team)
    member = TeamMember(team_id=team.id, user_id=organizer_user.id)
    session.add(member)
    session.commit()

    sub_resp = client.post(
        "/api/v1/submissions",
        json=_submission_payload(),
        params={"hackathon_id": hackathon.id, "team_id": team.id},
        headers=auth_headers(organizer_user),
    )
    submission_id = sub_resp.json()["id"]

    judge = Judge(user_id=normal_user.id, hackathon_id=hackathon.id)
    session.add(judge)
    session.commit()

    payload = {"scores": [{"criteria_id": criteria[0].id, "score_value": 50}]}

    # First score
    resp1 = client.post(
        f"/api/v1/submissions/{submission_id}/score",
        json=payload,
        headers=auth_headers(normal_user),
    )
    assert resp1.status_code == 200

    # Second score (upsert — should succeed, not duplicate)
    payload["scores"][0]["score_value"] = 95
    resp2 = client.post(
        f"/api/v1/submissions/{submission_id}/score",
        json=payload,
        headers=auth_headers(normal_user),
    )
    assert resp2.status_code == 200


def test_score_from_non_judge_forbidden(
    client, session, organizer_user, hackathon_with_criteria, normal_user
):
    """A user who is NOT a judge should get 403."""
    hackathon, criteria = hackathon_with_criteria

    team = Team(name="Forbidden Team", hackathon_id=hackathon.id, leader_id=organizer_user.id)
    session.add(team)
    session.commit()
    session.refresh(team)
    member = TeamMember(team_id=team.id, user_id=organizer_user.id)
    session.add(member)
    session.commit()

    sub_resp = client.post(
        "/api/v1/submissions",
        json=_submission_payload(),
        params={"hackathon_id": hackathon.id, "team_id": team.id},
        headers=auth_headers(organizer_user),
    )
    submission_id = sub_resp.json()["id"]

    # organizer_user is NOT a judge — should be rejected
    resp = client.post(
        f"/api/v1/submissions/{submission_id}/score",
        json={"scores": [{"criteria_id": criteria[0].id, "score_value": 80}]},
        headers=auth_headers(organizer_user),
    )
    assert resp.status_code == 403


def test_list_submissions_by_hackathon(client, session, normal_user):
    now = datetime.utcnow()
    h = Hackathon(
        title="List Hack",
        start_date=now,
        end_date=now + timedelta(days=5),
        status=HackathonStatus.ONGOING,
        registration_type=RegistrationType.INDIVIDUAL,
        format=HackathonFormat.ONLINE,
        created_by=normal_user.id,
        created_at=now,
        updated_at=now,
    )
    session.add(h)
    session.commit()
    session.refresh(h)

    # Create two submissions
    for i in range(2):
        client.post(
            "/api/v1/submissions",
            json=_submission_payload(title=f"Sub {i}"),
            params={"hackathon_id": h.id},
            headers=auth_headers(normal_user),
        )

    resp = client.get("/api/v1/submissions", params={"hackathon_id": h.id})
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# Need pytest for approx
import pytest
