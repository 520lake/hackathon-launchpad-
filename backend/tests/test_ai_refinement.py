
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.api.v1.endpoints import ai

client = TestClient(app)

# Mock user dependency
async def mock_get_current_user():
    from app.models.user import User
    return User(id=1, email="test@example.com", is_verified=True)

app.dependency_overrides[ai.deps.get_current_user] = mock_get_current_user

@patch("app.api.v1.endpoints.ai.client.chat.completions.create")
def test_ai_generate_refinement(mock_create):
    # Mock OpenAI response
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"title": "Refined Hackathon", "awards_detail": [{"name": "Grand Prize", "amount": 5000}]}'
    mock_create.return_value = mock_response

    # Test Data
    context_data = {
        "title": "Original Hackathon",
        "description": "Old description"
    }
    
    payload = {
        "prompt": "Change title to Refined Hackathon and add 5000 prize",
        "type": "hackathon",
        "context_data": context_data
    }

    response = client.post("/api/v1/ai/generate", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["content"]["title"] == "Refined Hackathon"
    
    # Verify the system prompt contained "refining" instructions
    # We can inspect the call args of mock_create
    call_args = mock_create.call_args
    messages = call_args[1]['messages']
    system_prompt = messages[0]['content']
    user_prompt = messages[1]['content']
    
    assert "refining" in system_prompt
    assert "Current Data" in user_prompt
    assert "Original Hackathon" in user_prompt

@patch("app.api.v1.endpoints.ai.client.chat.completions.create")
def test_ai_generate_creation(mock_create):
    # Mock OpenAI response
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"title": "New Hackathon"}'
    mock_create.return_value = mock_response

    payload = {
        "prompt": "Create a hackathon",
        "type": "hackathon"
    }

    response = client.post("/api/v1/ai/generate", json=payload)
    
    assert response.status_code == 200
    
    # Verify the system prompt is for creation
    call_args = mock_create.call_args
    messages = call_args[1]['messages']
    system_prompt = messages[0]['content']
    
    assert "Generate a detailed hackathon" in system_prompt
    assert "refining" not in system_prompt
