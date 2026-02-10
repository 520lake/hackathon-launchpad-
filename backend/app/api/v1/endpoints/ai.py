from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time
import random
import json
import os
from openai import OpenAI
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User
from app.core.config import settings

router = APIRouter()

class AIRequest(BaseModel):
    prompt: str
    type: str # 'hackathon', 'project', 'matching'
    context_data: Optional[dict] = None # For refinement

class AIResponse(BaseModel):
    content: dict

# Load prompts from JSON
PROMPTS = {}
try:
    with open("prompt.json", "r", encoding="utf-8") as f:
        PROMPTS = json.load(f)
except Exception as e:
    print(f"Warning: Could not load prompt.json: {e}")

def get_system_prompt(key: str, default: str = "") -> str:
    # 1. Env Var
    env_val = os.getenv(f"SYSTEM_PROMPT_{key.upper()}")
    if env_val: return env_val
    # 2. prompt.json
    if key in PROMPTS: return PROMPTS[key]
    # 3. Fallback (should be provided in the call if not using hardcoded strings)
    return default

# Initialize AI client (DeepSeek or ModelScope)
if settings.USE_DEEPSEEK:
    print(f"Using DeepSeek AI: {settings.DEEPSEEK_MODEL_NAME}")
    client = OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )
    MODEL_NAME = settings.DEEPSEEK_MODEL_NAME
else:
    print(f"Using ModelScope AI: {settings.MODELSCOPE_MODEL_NAME}")
    client = OpenAI(
        api_key=settings.MODELSCOPE_API_KEY,
        base_url=settings.MODELSCOPE_BASE_URL,
    )
    MODEL_NAME = settings.MODELSCOPE_MODEL_NAME

class TeamMatchRequest(BaseModel):
    hackathon_id: int
    requirements: str # User's input about what they are looking for

class TeamMatchResponse(BaseModel):
    matches: List[dict] # [{user_id, name, skills, personality, bio, match_reason, match_score}]

from app.models.enrollment import Enrollment

@router.post("/team-match", response_model=TeamMatchResponse)
async def team_match(
    req: TeamMatchRequest,
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_user)
):
    try:
        # 1. Fetch potential candidates (enrolled in the same hackathon, excluding self)
        query = select(User).join(Enrollment).where(
            Enrollment.hackathon_id == req.hackathon_id,
            User.id != current_user.id,
            # Allow both approved and pending users to be matched
            # Enrollment.status.in_(["approved", "pending"]) 
            # For now, let's just allow anyone enrolled to maximize matches for demo
        )
        candidates = session.exec(query).all()
        
        # If no candidates found in the hackathon, fallback to global search (optional, but good for demo if empty)
        if not candidates:
             candidates = session.exec(select(User).where(User.id != current_user.id)).all()

        # Limit to 20 candidates for prompt size limits
        candidates_data = []
        for c in candidates[:20]:
            candidates_data.append({
                "id": c.id,
                "name": c.nickname or c.full_name,
                "skills": c.skills,
                "interests": c.interests,
                "personality": c.personality,
                "bio": c.bio
            })
            
        user_profile = {
            "name": current_user.nickname or current_user.full_name,
            "skills": current_user.skills,
            "interests": current_user.interests,
            "personality": current_user.personality,
            "bio": current_user.bio,
            "looking_for": req.requirements
        }

        # 2. Construct Prompt
        system_prompt = get_system_prompt("team_match_system")
        user_prompt = f"""
Current User Profile:
{json.dumps(user_profile, ensure_ascii=False)}

Candidate Users:
{json.dumps(candidates_data, ensure_ascii=False)}
"""

        # 3. Call AI Model
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content_str = completion.choices[0].message.content
        content = json.loads(content_str)
        
        # 4. Enrich response with full user details
        final_matches = []
        for m in content.get("matches", []):
            candidate = next((c for c in candidates if c.id == m["user_id"]), None)
            if candidate:
                final_matches.append({
                    "user_id": candidate.id,
                    "name": candidate.nickname or candidate.full_name,
                    "avatar_url": candidate.avatar_url,
                    "skills": candidate.skills,
                    "personality": candidate.personality,
                    "bio": candidate.bio,
                    "match_score": m["match_score"],
                    "match_reason": m["match_reason"]
                })
        
        # Sort by score
        final_matches.sort(key=lambda x: x["match_score"], reverse=True)
        
        return {"matches": final_matches}

    except Exception as e:
        print(f"AI Team Match Error: {e}")
        # Fallback mock response if AI fails
        return {"matches": []}

class AIReviewRequest(BaseModel):
    project_name: str
    project_description: str
    scoring_dimensions: List[dict]

class AIReviewResponse(BaseModel):
    scores: dict[str, int]
    comment: str

class SearchHackathonRequest(BaseModel):
    query: str

class SearchHackathonResponse(BaseModel):
    matches: List[dict] # {id, reason}
    summary: str

class GeneratePitchDeckRequest(BaseModel):
    project_name: str
    project_description: str

class GeneratePitchDeckResponse(BaseModel):
    slides: List[dict] # {title, content, speaker_notes}

class BrainstormRequest(BaseModel):
    theme: str
    skills: str
    interests: str

class BrainstormResponse(BaseModel):
    ideas: List[dict] # {title, description, tech_stack, complexity}

@router.post("/brainstorm-ideas", response_model=BrainstormResponse)
async def brainstorm_ideas(
    req: BrainstormRequest,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        system_prompt = get_system_prompt("brainstorm_system")
        user_prompt = f"""
Theme: {req.theme}
User Skills: {req.skills}
User Interests: {req.interests}
"""

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = json.loads(completion.choices[0].message.content)
        return content

    except Exception as e:
        print(f"AI Brainstorm Error: {e}")
        return {"ideas": []}

@router.post("/generate-pitch-deck", response_model=GeneratePitchDeckResponse)
async def generate_pitch_deck(
    req: GeneratePitchDeckRequest,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        system_prompt = get_system_prompt("pitch_deck_system")
        user_prompt = f"""
Project Name: {req.project_name}
Description: {req.project_description}
"""

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = json.loads(completion.choices[0].message.content)
        return content

    except Exception as e:
        print(f"AI Pitch Deck Error: {e}")
        return {"slides": []}

class GenerateResumeRequest(BaseModel):
    keywords: str
    role: str
    lang: str

class GenerateResumeResponse(BaseModel):
    bio: str
    skills: List[str]

@router.post("/generate-resume", response_model=GenerateResumeResponse)
async def generate_resume(
    req: GenerateResumeRequest,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        system_prompt = get_system_prompt("resume_system")
        user_prompt = f"""
Target Role: {req.role}
Keywords: {req.keywords}
Language: {req.lang}
"""

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = json.loads(completion.choices[0].message.content)
        return content

    except Exception as e:
        print(f"AI Resume Error: {e}")
        return {"bio": "Failed to generate bio.", "skills": []}

from app.models.hackathon import Hackathon

@router.post("/search-hackathons", response_model=SearchHackathonResponse)
async def search_hackathons(
    req: SearchHackathonRequest,
    session: Session = Depends(deps.get_session)
):
    try:
        # 1. Fetch active hackathons
        hackathons = session.exec(select(Hackathon).where(Hackathon.status.in_(['published', 'ongoing']))).all()
        
        hackathons_data = []
        for h in hackathons:
            hackathons_data.append({
                "id": h.id,
                "title": h.title,
                "description": h.description[:300] if h.description else "", # Truncate for token limit
                "tags": h.theme_tags,
                "format": h.format,
                "location": h.location,
                "start_date": h.start_date.isoformat() if h.start_date else ""
            })

        # 2. Construct Prompt
        system_prompt = get_system_prompt("search_hackathon_system")
        user_prompt = f"""
User Query: {req.query}

Active Hackathons:
{json.dumps(hackathons_data, ensure_ascii=False)}
"""

        # 3. Call AI
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = json.loads(completion.choices[0].message.content)
        return content

    except Exception as e:
        print(f"AI Search Error: {e}")
        return {"matches": [], "summary": "Sorry, I encountered an error while searching. Please try again."}

@router.post("/review", response_model=AIReviewResponse)
async def review_project(
    req: AIReviewRequest,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        system_prompt = get_system_prompt("review_system")
        user_prompt = f"""
Project Name: {req.project_name}
Project Description: {req.project_description}

Scoring Dimensions:
{json.dumps(req.scoring_dimensions, ensure_ascii=False)}
"""

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
             response_format={"type": "json_object"}
        )
        
        content_str = completion.choices[0].message.content
        content = json.loads(content_str)
        return content
        
    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=AIResponse)
async def generate_content(
    req: AIRequest,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        if req.type == 'hackathon':
            if req.context_data:
                # Refinement Mode
                system_prompt = get_system_prompt("hackathon_refinement_system")
                user_prompt = f"Current Data: {json.dumps(req.context_data, ensure_ascii=False)}\nUser Instruction: {req.prompt}"
            else:
                # Creation Mode
                system_prompt = get_system_prompt("hackathon_creation_system")
                user_prompt = f"Topic: {req.prompt}"
            
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content_str = completion.choices[0].message.content
            content = json.loads(content_str)
            return {"content": content}

        elif req.type == 'project':
            system_prompt = get_system_prompt("project_refinement_system")
            user_prompt = f"Project Idea: {req.prompt}"
            
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content_str = completion.choices[0].message.content
            content = json.loads(content_str)
            return {"content": content}

        elif req.type == 'participant_analysis':
            system_prompt = get_system_prompt("participant_analysis_system")
            
            participants_data = req.context_data.get('participants', []) if req.context_data else []
            # Limit to top 50 to avoid token limits if too many
            participants_summary = json.dumps(participants_data[:50], ensure_ascii=False)
            
            user_prompt = f"Analyze these participants: {participants_summary}"
            
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content_str = completion.choices[0].message.content
            content = json.loads(content_str)
            return {"content": content}
            
        elif req.type == 'matching':
            # Use current user's skills and interests to find matches
            user_skills = current_user.skills or "General"
            user_interests = current_user.interests or "General"
            
            system_prompt = get_system_prompt("matching_system")
            if req.prompt and len(req.prompt) > 10 and req.prompt != 'match':
                context_prompt = f"Project Context: {req.prompt}. "
            else:
                context_prompt = "Context: General Hackathon Team. "
                
            user_prompt = f"{context_prompt}User Skills: {user_skills}. User Interests: {user_interests}. Suggest complementary teammates."
            
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content_str = completion.choices[0].message.content
            content = json.loads(content_str)
            return {"content": content}

    except Exception as e:
        print(f"AI Generation Error: {e}")
        # Fallback to mock if AI fails
        if req.type == 'hackathon':
            return {
                "content": {
                    "title": f"Aura {req.prompt} Hackathon (Offline Mode)",
                    "description": f"AI Service unavailable. Generating offline template for {req.prompt}.",
                    "theme_tags": f"{req.prompt}, Fallback",
                    "professionalism_tags": "General",
                    "rules_detail": "Standard rules apply.",
                    "resource_detail": "Standard resources provided.",
                    "awards_detail": "Standard awards.",
                    "scoring_dimensions": [{"name": "General", "description": "Overall score", "weight": 100}]
                }
            }
        elif req.type == 'project':
             return {
                "content": {
                    "description": f"AI Service unavailable. Please refine '{req.prompt}' manually.",
                    "business_plan": "N/A"
                }
            }
        elif req.type == 'matching':
             return {
                "content": {
                    "matches": [
                        {"user_id": 1, "name": "Offline Match 1", "skills": "Java", "match_score": 80},
                        {"user_id": 2, "name": "Offline Match 2", "skills": "Python", "match_score": 75}
                    ]
                }
            }
            
    return {"content": {}}
