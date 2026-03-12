
import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, StaticPool
from app.main import app
from app.api import deps
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.enrollment import Enrollment, EnrollmentStatus

# Setup in-memory DB with StaticPool to share connection across threads/sessions
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)

def get_session_override():
    with Session(engine) as session:
        yield session

app.dependency_overrides[deps.get_session] = get_session_override

client = TestClient(app)

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@patch("app.api.v1.endpoints.ai.client.chat.completions.create")
def test_team_match_includes_pending_users(mock_create, session):
    # 1. Setup Data
    # Current User (User A)
    user_a = User(id=1, email="a@test.com", full_name="User A", is_verified=True, skills="Python")
    session.add(user_a)
    
    # Candidate User (User B) - PENDING Enrollment
    user_b = User(id=2, email="b@test.com", full_name="User B", is_verified=True, skills="React")
    session.add(user_b)
    
    hackathon = Hackathon(
        id=1, 
        title="Test Hackathon", 
        organizer_id=1, 
        description="desc", 
        start_date=datetime(2023, 1, 1), 
        end_date=datetime(2023, 1, 2)
    )
    session.add(hackathon)
    
    # Enroll User B (Pending)
    enrollment_b = Enrollment(user_id=2, hackathon_id=1, status=EnrollmentStatus.PENDING)
    session.add(enrollment_b)
    
    session.commit()
    
    # 2. Mock Auth
    app.dependency_overrides[deps.get_current_user] = lambda: user_a
    
    # 3. Mock AI Response
    mock_response = MagicMock()
    # The endpoint expects the AI to return matches with user_id
    mock_response.choices[0].message.content = '{"matches": [{"user_id": 2, "match_score": 90, "match_reason": "Good fit"}]}'
    mock_create.return_value = mock_response
    
    # 4. Call Endpoint
    payload = {
        "hackathon_id": 1,
        "requirements": "Looking for React dev"
    }
    
    response = client.post("/api/v1/ai/team-match", json=payload)
    
    # 5. Assertions
    if response.status_code != 200:
        print(response.json())
        
    assert response.status_code == 200
    data = response.json()
    assert len(data["matches"]) == 1
    assert data["matches"][0]["user_id"] == 2
    assert data["matches"][0]["name"] == "User B"
