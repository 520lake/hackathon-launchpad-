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
                "personality": c.personality,
                "bio": c.bio,
                "mbti_type": c.personality if c.personality and len(c.personality) == 4 else None
            })
            
        user_profile = {
            "name": current_user.nickname or current_user.full_name,
            "skills": current_user.skills,
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
            # Build a location string from structured geo fields
            location_parts = [p for p in [h.province, h.city, h.district] if p]
            location_str = " ".join(location_parts) if location_parts else "线上"
            hackathons_data.append({
                "id": h.id,
                "title": h.title,
                "format": h.format,
                "location": location_str,
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
            # Use current user's profile to find matches
            user_skills = current_user.skills or "General"
            
            system_prompt = get_system_prompt("matching_system")
            if req.prompt and len(req.prompt) > 10 and req.prompt != 'match':
                context_prompt = f"Project Context: {req.prompt}. "
            else:
                context_prompt = "Context: General Hackathon Team. "
                
            user_prompt = f"{context_prompt}User Skills: {user_skills}. Suggest complementary teammates."
            
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
        mbti_types = {}
        
        for p in participants:
            if p.skills:
                all_skills.extend([s.strip() for s in p.skills.split(',')])
            if p.personality and len(p.personality) == 4:
                mbti_types[p.personality] = mbti_types.get(p.personality, 0) + 1
            
            participants_data.append({
                "id": p.id,
                "skills": p.skills,
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
        
        return {
            "summary": ai_analysis.get("summary", ""),
            "skill_distribution": skill_distribution,
            "interest_clusters": ai_analysis.get("interest_clusters", []),
            "recommendations": ai_analysis.get("recommendations", []),
            "mbti_distribution": mbti_types,
            "hot_topics": []
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
