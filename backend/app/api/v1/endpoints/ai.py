from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
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
import asyncio

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
                "bio": c.bio,
                "mbti_type": c.personality if c.personality and len(c.personality) == 4 else None
            })
            
        user_profile = {
            "name": current_user.nickname or current_user.full_name,
            "skills": current_user.skills,
            "interests": current_user.interests,
            "personality": current_user.personality,
            "mbti_type": current_user.personality if current_user.personality and len(current_user.personality) == 4 else None,
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
                    "interests": candidate.interests,
                    "personality": candidate.personality,
                    "mbti_type": candidate.personality if candidate.personality and len(candidate.personality) == 4 else None,
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

# --- New AI Project Assistant Endpoints ---

class ProjectIdeaRequest(BaseModel):
    keywords: str
    hackathon_context: Optional[str] = None

class ProjectIdeaResponse(BaseModel):
    title: str
    description: str
    tech_stack: List[str]
    implementation_path: List[str]

@router.post("/generate-project-idea", response_model=ProjectIdeaResponse)
async def generate_project_idea(req: ProjectIdeaRequest):
    try:
        system_prompt = """
        You are a creative Hackathon Project Mentor.
        Generate a feasible, innovative, and impressive hackathon project idea based on the keywords.
        
        Return STRICT JSON:
        {
            "title": "Project Name",
            "description": "2-3 sentences elevator pitch",
            "tech_stack": ["React", "Python", "DeepSeek", ...],
            "implementation_path": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
        }
        """
        
        user_prompt = f"Keywords: {req.keywords}\nContext: {req.hackathon_context or 'General Hackathon'}"
        
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        
        return json.loads(content)
    except Exception as e:
        print(f"Generate Idea Error: {e}")
        # Mock fallback
        return {
            "title": "AI Project Assistant (Fallback)",
            "description": "An intelligent assistant to help you build projects faster. (AI Service Unavailable)",
            "tech_stack": ["React", "FastAPI", "OpenAI"],
            "implementation_path": ["Define Idea", "Build MVP", "Demo"]
        }

# --- Community Insights Endpoint ---

class CommunityInsightsRequest(BaseModel):
    hackathon_id: int

class CommunityInsightsResponse(BaseModel):
    summary: str
    skill_distribution: dict
    interest_clusters: List[dict]
    recommendations: List[str]
    mbti_distribution: dict
    hot_topics: List[str]

@router.post("/community-insights", response_model=CommunityInsightsResponse)
async def get_community_insights(
    req: CommunityInsightsRequest,
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Analyze the participant pool of a hackathon to provide AI-driven insights.
    """
    try:
        # 1. Fetch all participants for the hackathon
        from app.models.enrollment import Enrollment
        query = select(User).join(Enrollment).where(
            Enrollment.hackathon_id == req.hackathon_id
        )
        participants = session.exec(query).all()
        
        if not participants:
            return {
                "summary": "暂无参赛者数据",
                "skill_distribution": {},
                "interest_clusters": [],
                "recommendations": ["等待更多用户报名后查看洞察"],
                "mbti_distribution": {},
                "hot_topics": []
            }
        
        # 2. Prepare participant data
        participants_data = []
        all_skills = []
        all_interests = []
        mbti_types = {}
        
        for p in participants:
            if p.skills:
                all_skills.extend([s.strip() for s in p.skills.split(',')])
            if p.interests:
                all_interests.extend([i.strip() for i in p.interests.split(',')])
            if p.personality and len(p.personality) == 4:
                mbti_types[p.personality] = mbti_types.get(p.personality, 0) + 1
            
            participants_data.append({
                "id": p.id,
                "skills": p.skills,
                "interests": p.interests,
                "personality": p.personality,
                "bio": p.bio
            })
        
        # 3. Calculate skill distribution
        from collections import Counter
        skill_counts = Counter(all_skills)
        skill_distribution = dict(skill_counts.most_common(15))
        
        # 4. Call AI for deep analysis
        system_prompt = get_system_prompt("participant_analysis_system")
        user_prompt = f"""
Analyze these hackathon participants:
Total Participants: {len(participants)}

Participants Data:
{json.dumps(participants_data[:30], ensure_ascii=False)}

Skill Distribution:
{json.dumps(skill_distribution, ensure_ascii=False)}

MBTI Distribution:
{json.dumps(mbti_types, ensure_ascii=False)}
"""
        
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        ai_analysis = json.loads(completion.choices[0].message.content)
        
        # 5. Extract hot topics from interests
        interest_counts = Counter(all_interests)
        hot_topics = [item for item, count in interest_counts.most_common(8) if count > 1]
        
        return {
            "summary": ai_analysis.get("summary", ""),
            "skill_distribution": skill_distribution,
            "interest_clusters": ai_analysis.get("interest_clusters", []),
            "recommendations": ai_analysis.get("recommendations", []),
            "mbti_distribution": mbti_types,
            "hot_topics": hot_topics
        }
        
    except Exception as e:
        print(f"Community Insights Error: {e}")
        # Fallback response
        return {
            "summary": "AI 分析服务暂时不可用",
            "skill_distribution": {},
            "interest_clusters": [],
            "recommendations": ["请稍后重试"],
            "mbti_distribution": {},
            "hot_topics": []
        }

class RecruitmentGenRequest(BaseModel):
    project_name: str
    project_description: str

class RecruitmentGenResponse(BaseModel):
    role: str
    skills: str
    count: int
    description: str

@router.post("/generate-recruitment", response_model=List[RecruitmentGenResponse])
async def generate_recruitment(req: RecruitmentGenRequest):
    try:
        system_prompt = """
        You are a Tech Recruiter for a Hackathon Team.
        Based on the project description, identify 2-3 key roles needed to build this MVP.
        
        Return STRICT JSON List:
        [
            {
                "role": "Frontend Dev",
                "skills": "React, Tailwind",
                "count": 1,
                "description": "Build the UI/UX..."
            },
            ...
        ]
        """
        
        user_prompt = f"Project: {req.project_name}\nDescription: {req.project_description}"
        
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Generate Recruitment Error: {e}")
        return []

class RefineProjectRequest(BaseModel):
    description: str

class RefineProjectResponse(BaseModel):
    refined_description: str

@router.post("/refine-project", response_model=RefineProjectResponse)
async def refine_project(req: RefineProjectRequest):
    try:
        system_prompt = """
        You are a Professional Tech Editor.
        Refine the project description to be more professional, exciting, and clear for a hackathon submission.
        Keep it concise but impactful.
        
        Return STRICT JSON:
        {
            "refined_description": "..."
        }
        """
        
        user_prompt = f"Original Description: {req.description}"
        
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Refine Project Error: {e}")
        return {"refined_description": req.description}

        content = response.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
            
        data = json.loads(content)
        # Handle if AI returns object with key "roles" or direct list
        if isinstance(data, dict) and "roles" in data:
            return data["roles"]
        if isinstance(data, list):
            return data
        return [] # Fallback
        
    except Exception as e:
        print(f"Gen Recruitment Error: {e}")
        return []

class RefineProjectRequest(BaseModel):
    description: str

class RefineProjectResponse(BaseModel):
    refined_description: str

@router.post("/refine-project", response_model=RefineProjectResponse)
async def refine_project(req: RefineProjectRequest):
    try:
        system_prompt = """
        You are a Professional Technical Writer.
        Refine the project description to make it sound professional, impactful, and clear for a Hackathon submission.
        Keep it concise but exciting.
        """

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.description}
            ]
        )

        return {"refined_description": response.choices[0].message.content.strip()}
    except Exception as e:
        return {"refined_description": req.description} # Fallback to original


# --- AI Image Generation Endpoint ---

class ImageGenerationRequest(BaseModel):
    prompt: str
    style: Optional[str] = "vivid"  # vivid, natural
    size: Optional[str] = "1024x1024"  # 1024x1024, 1024x1792, 1792x1024

class ImageGenerationResponse(BaseModel):
    url: str
    revised_prompt: Optional[str] = None

@router.post("/generate-image", response_model=ImageGenerationResponse)
async def generate_image(
    req: ImageGenerationRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Generate an image using SiliconFlow (硅基流动) free image generation API.
    Falls back to Pollinations.ai if SiliconFlow fails.
    """
    try:
        # Try SiliconFlow (硅基流动) first - using user's API key
        # SiliconFlow offers free image generation models
        print(f"Trying SiliconFlow image generation with prompt: {req.prompt[:50]}...")
        
        # Initialize SiliconFlow client
        siliconflow_client = OpenAI(
            api_key=settings.SILICONFLOW_API_KEY,
            base_url=settings.SILICONFLOW_BASE_URL,
        )
        
        # Enhance prompt for better results - 使用中文提示词优化
        enhanced_prompt = f"""{req.prompt}

高质量，专业设计，精美细节，高清渲染，最佳画质，专业摄影风格，完美的光影效果，8K超清。"""
        
        try:
            # Try to generate with SiliconFlow
            # Map size to appropriate format
            size_map = {
                "1024x1024": "1024x1024",
                "1024x1792": "1024x1792",
                "1792x1024": "1792x1024",
            }
            image_size = size_map.get(req.size, "1024x1024")
            
            response = siliconflow_client.images.generate(
                model=settings.SILICONFLOW_IMAGE_MODEL,
                prompt=enhanced_prompt,
                size=image_size,
                n=1,
            )

            if response.data and len(response.data) > 0:
                print(f"Successfully generated image with SiliconFlow")
                return {
                    "url": response.data[0].url,
                    "revised_prompt": response.data[0].revised_prompt or enhanced_prompt
                }
        except Exception as siliconflow_error:
            print(f"SiliconFlow image generation failed: {siliconflow_error}")
            # Fall through to Pollinations.ai
        
        # Fallback: Use Pollinations.ai (free image generation API)
        print("Falling back to Pollinations.ai")
        import urllib.parse
        
        encoded_prompt = urllib.parse.quote(enhanced_prompt)
        
        # Pollinations.ai supports various models via the model parameter
        pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={random.randint(1, 100000)}&model=flux&enhance=true"

        # Verify the URL is accessible
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.head(pollinations_url, timeout=30.0)
            if response.status_code == 200:
                print(f"Successfully generated image with Pollinations.ai")
                return {
                    "url": pollinations_url,
                    "revised_prompt": enhanced_prompt
                }

        # Final fallback
        return {
            "url": f"https://picsum.photos/seed/{random.randint(1, 10000)}/1024/1024",
            "revised_prompt": req.prompt
        }

    except Exception as e:
        print(f"Image Generation Error: {e}")
        # Final fallback - return a placeholder
        return {
            "url": f"https://picsum.photos/seed/{random.randint(1, 10000)}/1024/1024",
            "revised_prompt": req.prompt
        }


# --- 社区成员AI智能匹配（流式输出）---

class CommunityMatchRequest(BaseModel):
    requirements: Optional[str] = None  # 可选的用户需求描述

# 模拟匹配数据生成函数
def generate_mock_matches(candidates, user_profile):
    """当AI调用失败时，使用简单的本地算法生成匹配结果"""
    import random
    
    matches = []
    user_skills = set(user_profile.get("skills", "").lower().split(","))
    
    for candidate in candidates[:10]:  # 只处理前10个
        candidate_skills = set((candidate.skills or "").lower().split(","))
        
        # 计算技能匹配度
        common_skills = user_skills & candidate_skills
        if common_skills:
            score = min(60 + len(common_skills) * 10, 95)
            reason = f"技能互补：你们都擅长{', '.join(list(common_skills)[:2])}"
        else:
            score = random.randint(40, 70)
            reason = "潜在合作机会：不同技能背景可能带来新视角"
        
        # 根据bio调整分数
        if user_profile.get("bio") and candidate.bio:
            if any(word in candidate.bio.lower() for word in user_profile["bio"].lower().split()[:3]):
                score = min(score + 10, 98)
        
        matches.append({
            "user_id": candidate.id,
            "name": candidate.nickname or candidate.full_name,
            "match_score": score,
            "match_reason": reason,
            "key_skill": (candidate.skills or "").split(",")[0] if candidate.skills else "未知",
            "why_match": f"{candidate.nickname or candidate.full_name}的技能和兴趣与你的需求较为匹配",
            "avatar_url": candidate.avatar_url,
            "skills": candidate.skills,
            "interests": candidate.interests
        })
    
    # 按分数排序
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "matches": matches[:6],
        "summary": f"基于你的资料（{user_profile.get('skills', '暂无技能')}），为你找到了{len(matches)}位潜在队友。系统分析了技能互补性和兴趣契合度，推荐以上匹配结果。"
    }

@router.post("/community-match")
async def community_match_stream(
    req: CommunityMatchRequest,
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_user)
):
    """
    社区成员AI智能匹配 - 流式输出
    根据当前用户的资料（技能、兴趣、个性等）自动匹配队友
    """
    async def generate_matches():
        try:
            print(f"[AI Match] Starting match for user: {current_user.id} - {current_user.nickname}")
            yield f"data: {json.dumps({'type': 'content', 'content': '正在获取社区成员数据...'})}\n\n"
            
            # 获取社区中其他活跃用户（排除自己）
            query = select(User).where(
                User.id != current_user.id,
                User.show_in_community == True,
                User.is_active == True
            )
            candidates = session.exec(query).all()
            
            if not candidates:
                # 如果没有显示在社区的用户，查找所有用户
                candidates = session.exec(select(User).where(User.id != current_user.id)).all()
            
            # 限制候选人数量
            candidates = candidates[:20]  # 减少候选人数量以加快速度
            print(f"[AI Match] Found {len(candidates)} candidates")
            yield f"data: {json.dumps({'type': 'content', 'content': f'找到 {len(candidates)} 位社区成员，正在分析匹配度...'})}\n\n"
            
            candidates_data = []
            for c in candidates:
                candidates_data.append({
                    "id": c.id,
                    "name": c.nickname or c.full_name,
                    "skills": c.skills or "",
                    "interests": c.interests or "",
                    "personality": c.personality or "",
                    "bio": c.bio or "",
                    "community_title": c.community_title or "",
                    "community_skills": c.community_skills or "",
                    "mbti_type": c.personality if c.personality and len(c.personality) == 4 else None
                })
            
            user_profile = {
                "name": current_user.nickname or current_user.full_name,
                "skills": current_user.skills or "",
                "interests": current_user.interests or "",
                "personality": current_user.personality or "",
                "bio": current_user.bio or "",
                "community_title": current_user.community_title or "",
                "community_skills": current_user.community_skills or "",
                "looking_for": req.requirements or "寻找志同道合的队友"
            }
            
            # 构建系统提示词
            system_prompt = """你是一个专业的团队匹配顾问。你的任务是根据用户的资料和需求，从候选人列表中找到最匹配的队友。

请从以下角度分析匹配度：
1. 技能互补性 - 对方的技能是否与你互补
2. 兴趣契合度 - 对方是否对你的领域感兴趣
3. 个性兼容性 - 对方的性格是否容易合作
4. 经验匹配 - 对方的经验背景是否适合

请以JSON格式返回匹配结果，格式如下：
{
  "matches": [
    {
      "user_id": 对方ID,
      "name": "对方名字",
      "match_score": 匹配分数(0-100),
      "match_reason": "匹配原因",
      "key_skill": "对方的关键技能",
      "why_match": "为什么你们合拍"
    }
  ],
  "summary": "总体分析"
}

请返回排名最靠前的5-8个匹配结果。"""

            user_prompt = f"""
当前用户资料：
{json.dumps(user_profile, ensure_ascii=False)}

社区候选人列表：
{json.dumps(candidates_data, ensure_ascii=False)}

请根据当前用户的资料，找出最合适的队友。"""

            # 流式调用AI
            print(f"[AI Match] Calling AI model: {MODEL_NAME}")
            yield f"data: {json.dumps({'type': 'content', 'content': '正在调用AI进行分析...'})}\n\n"
            
            try:
                start_time = asyncio.get_event_loop().time()
                stream = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_prompt}
                    ],
                    stream=True,
                    temperature=0.7,
                    max_tokens=2000,  # 限制输出长度
                    timeout=30  # 30秒超时
                )
                
                # 收集完整响应用于解析JSON
                full_content = ""
                chunk_count = 0
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_content += content
                        chunk_count += 1
                        # 流式输出 - 每10个chunk输出一次，减少网络开销
                        if chunk_count % 10 == 0:
                            yield f"data: {json.dumps({'type': 'content', 'content': '.'})}\n\n"
                
                elapsed = asyncio.get_event_loop().time() - start_time
                print(f"[AI Match] AI response received in {elapsed:.2f}s, {len(full_content)} chars")
                yield f"data: {json.dumps({'type': 'content', 'content': f'\n分析完成，正在整理结果...'})}\n\n"
                
                # 解析JSON并返回结构化结果
                try:
                    # 提取JSON部分
                    import re
                    json_match = re.search(r'\{[\s\S]*\}', full_content)
                    if json_match:
                        result = json.loads(json_match.group())
                        # 补充用户详细信息
                        for m in result.get("matches", []):
                            candidate = next((c for c in candidates if c.id == m["user_id"]), None)
                            if candidate:
                                m["avatar_url"] = candidate.avatar_url
                                m["skills"] = candidate.skills
                                m["interests"] = candidate.interests
                        
                        result["source"] = "ai"  # 标记为AI生成
                        yield f"data: {json.dumps({'type': 'result', 'data': result})}\n\n"
                        print(f"[AI Match] Successfully returned {len(result.get('matches', []))} matches from AI")
                except Exception as e:
                    print(f"[AI Match] Parse error: {e}")
                    # 如果解析失败，使用模拟数据
                    yield f"data: {json.dumps({'type': 'content', 'content': '\nAI解析结果格式异常，使用本地算法匹配...'})}\n\n"
                    mock_result = generate_mock_matches(candidates, user_profile)
                    mock_result["source"] = "local"
                    yield f"data: {json.dumps({'type': 'result', 'data': mock_result})}\n\n"
                    
            except Exception as e:
                print(f"[AI Match] AI call failed: {e}")
                yield f"data: {json.dumps({'type': 'content', 'content': f'\nAI服务暂时不可用，使用本地算法匹配...'})}\n\n"
                # AI调用失败时使用模拟数据
                mock_result = generate_mock_matches(candidates, user_profile)
                mock_result["source"] = "local"
                yield f"data: {json.dumps({'type': 'result', 'data': mock_result})}\n\n"
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            print(f"Community Match Error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_matches(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# --- 讨论帖子AI分析 ---

class DiscussionAnalyzeRequest(BaseModel):
    discussion_id: int
    replies_content: List[str] = []  # 评论内容列表

@router.post("/analyze-discussion")
async def analyze_discussion_stream(
    req: DiscussionAnalyzeRequest,
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_user)
):
    """
    分析讨论帖子和评论，获取AI洞察 - 流式输出
    """
    async def generate_analysis():
        try:
            from app.models.discussion import Discussion, DiscussionReply
            
            # 获取帖子详情
            discussion = session.get(Discussion, req.discussion_id)
            if not discussion:
                yield f"data: {json.dumps({'type': 'error', 'error': '帖子不存在'})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return
            
            # 获取帖子作者
            author = session.get(User, discussion.author_id)
            author_name = author.nickname or author.full_name if author else "未知"
            
            # 获取所有评论
            replies = session.exec(
                select(DiscussionReply).where(DiscussionReply.discussion_id == req.discussion_id)
            ).all()
            
            # 获取评论作者
            replies_with_authors = []
            for reply in replies:
                reply_author = session.get(User, reply.author_id)
                replies_with_authors.append({
                    "content": reply.content,
                    "author": reply_author.nickname or reply_author.full_name if reply_author else "未知",
                    "created_at": reply.created_at.isoformat() if reply.created_at else ""
                })
            
            # 构建分析请求
            system_prompt = """你是一个社区洞察专家。你的任务是分析一个讨论帖子的内容和评论，总结出大家正在关心什么、讨论的焦点是什么。

请从以下几个方面进行分析：
1. 主题焦点 - 大家主要在讨论什么话题
2. 情感倾向 - 大多数人的态度是积极还是消极
3. 关键观点 - 有哪些值得注意的观点
4. 趋势洞察 - 是否有新兴的观点或趋势
5. 建议总结 - 可以给发帖者什么建议

请用JSON格式返回分析结果：
{
  "topic_focus": "主要讨论话题",
  "sentiment": "积极/中性/消极",
  "sentiment_reason": "情感分析原因",
  "key_points": ["关键观点1", "关键观点2"],
  "trends": ["趋势1", "趋势2"],
  "suggestions": ["建议1", "建议2"],
  "summary": "总体分析摘要"
}

请用中文回复。"""

            user_prompt = f"""
帖子标题：{discussion.title}
帖子内容：{discussion.content}
帖子作者：{author_name}

评论列表（共{len(replies_with_authors)}条）：
{json.dumps(replies_with_authors, ensure_ascii=False)}

请分析这个讨论帖子中大家在关心什么。"""

            # 流式调用AI
            stream = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                stream=True,
                temperature=0.7
            )
            
            full_content = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_content += content
                    yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                    await asyncio.sleep(0.02)
            
            # 解析JSON
            try:
                import re
                json_match = re.search(r'\{[\s\S]*\}', full_content)
                if json_match:
                    result = json.loads(json_match.group())
                    yield f"data: {json.dumps({'type': 'result', 'data': result})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': '解析结果失败'})}\n\n"
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            print(f"Discussion Analyze Error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_analysis(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

