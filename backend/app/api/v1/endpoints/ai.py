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

# Initialize OpenAI client for ModelScope
client = OpenAI(
    api_key=settings.MODELSCOPE_API_KEY,
    base_url=settings.MODELSCOPE_BASE_URL,
)

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
        system_prompt = """You are an expert AI Team Builder and Psychologist.
Your goal is to find the best teammates for the current user based on complementary skills, personality compatibility, and shared interests.

You will receive:
1. The Current User's Profile and what they are looking for.
2. A list of Candidate Users.

Task:
Select top 3-5 best matches from the Candidate Users.
For each match, provide a detailed "match_reason" explaining WHY they are a good fit (e.g., "Their backend skills complement your frontend focus", "Both are INTJ personalities").

Return ONLY a valid JSON object with the following structure:
{
  "matches": [
    {
      "user_id": 123, // Must match the candidate's actual ID
      "match_score": 95, // 0-100
      "match_reason": "Explanation..."
    }
  ]
}
Do not include any markdown formatting.
"""
        user_prompt = f"""
Current User Profile:
{json.dumps(user_profile, ensure_ascii=False)}

Candidate Users:
{json.dumps(candidates_data, ensure_ascii=False)}
"""

        # 3. Call AI Model
        # TODO: Integrate DeepSeek model here when API key is available
        # if settings.USE_DEEPSEEK:
        #     completion = deepseek_client.chat.completions.create(...)
        # else:
        
        # Fallback to ModelScope (Qwen)
        completion = client.chat.completions.create(
            model=settings.MODELSCOPE_MODEL_NAME,
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
        system_prompt = """You are a creative Hackathon Idea Generator.
Your goal is to suggest 3-5 unique, feasible, and impressive hackathon project ideas based on the user's skills and the event theme.

Input:
1. Hackathon Theme
2. User Skills
3. User Interests

Task:
Generate a list of project ideas. For each idea provide:
- Title: Catchy name
- Description: 2-3 sentences explaining the problem and solution
- Tech Stack: Recommended technologies based on user skills
- Complexity: Easy/Medium/Hard

Return ONLY a valid JSON object:
{
  "ideas": [
    {
      "title": "EcoTrack AI",
      "description": "An AI-powered app that scans trash to tell you how to recycle it...",
      "tech_stack": "Flutter, TensorFlow Lite, Firebase",
      "complexity": "Medium"
    }
  ]
}
"""
        user_prompt = f"""
Theme: {req.theme}
User Skills: {req.skills}
User Interests: {req.interests}
"""

        completion = client.chat.completions.create(
            model=settings.MODELSCOPE_MODEL_NAME,
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
        system_prompt = """You are a Startup Pitch Coach.
Your goal is to generate a structured 5-7 slide pitch deck outline for a hackathon project.

Input:
1. Project Name
2. Project Description

Task:
Generate slides including: Problem, Solution, Demo/Features, Tech Stack, and Future Value.
For each slide provide:
- Title
- Content (Bullet points)
- Speaker Notes (What to say)

Return ONLY a valid JSON object:
{
  "slides": [
    {
      "title": "The Problem",
      "content": "- Recycling is confusing\n- 90% of plastic isn't recycled",
      "speaker_notes": "Start with a personal story about..."
    }
  ]
}
"""
        user_prompt = f"""
Project Name: {req.project_name}
Description: {req.project_description}
"""

        completion = client.chat.completions.create(
            model=settings.MODELSCOPE_MODEL_NAME,
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
        system_prompt = """You are an expert Career Coach and AI Resume Writer.
Your goal is to generate a professional, engaging bio and a list of technical skills based on the user's raw input.

Input:
1. Target Role (e.g., Frontend Developer)
2. Keywords/Experience (unstructured text)
3. Language (zh/en)

Task:
1. Write a professional "Bio" (max 150 words) that highlights their strengths and fits the target role. Use the specified language.
2. Extract or infer 5-10 relevant "Skills" (technical or soft skills) from the keywords.

Return ONLY a valid JSON object:
{
  "bio": "Passionate Frontend Developer with 5 years of experience...",
  "skills": ["React", "TypeScript", "Node.js"]
}
"""
        user_prompt = f"""
Target Role: {req.role}
Keywords: {req.keywords}
Language: {req.lang}
"""

        completion = client.chat.completions.create(
            model=settings.MODELSCOPE_MODEL_NAME,
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
        system_prompt = """You are an intelligent Hackathon Guide named 'Aura'.
Your goal is to help users find the most relevant hackathons from the provided list based on their natural language query.

Input:
1. User Query
2. List of Active Hackathons

Task:
1. Analyze the user's intent (e.g., looking for AI events, online only, specific location, beginners).
2. Select the top 1-3 hackathons that best match the criteria.
3. Generate a friendly, conversational summary explaining why these events are good matches.
4. If no good matches are found, suggest the most popular or upcoming one.

Return ONLY a valid JSON object:
{
  "matches": [
    {
      "id": 123,
      "reason": "Focuses on Generative AI which matches your interest..."
    }
  ],
  "summary": "I found 2 hackathons that match your interest in AI. The 'Shanghai AI Challenge' is particularly relevant..."
}
Do not include any markdown formatting.
"""
        user_prompt = f"""
User Query: {req.query}

Active Hackathons:
{json.dumps(hackathons_data, ensure_ascii=False)}
"""

        # 3. Call AI
        completion = client.chat.completions.create(
            model=settings.MODELSCOPE_MODEL_NAME,
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
        system_prompt = """You are an expert hackathon judge.
Evaluate the project based on the provided scoring dimensions.
For each dimension, provide a score (0-100) based on the project description.
Also provide a constructive comment summarizing the evaluation.

Return ONLY a valid JSON object with the following structure:
{
  "scores": {
    "Dimension Name 1": 85,
    "Dimension Name 2": 70
  },
  "comment": "Your overall assessment..."
}
Do not include any markdown formatting.
"""
        user_prompt = f"""
Project Name: {req.project_name}
Project Description: {req.project_description}

Scoring Dimensions:
{json.dumps(req.scoring_dimensions, ensure_ascii=False)}
"""

        completion = client.chat.completions.create(
            model=settings.MODELSCOPE_MODEL_NAME,
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
                system_prompt = """You are an expert hackathon organizer assisting a user in refining their event plan.
You will receive the CURRENT event data and a user instruction.
Update the event data based on the user's instruction.
Return ONLY a valid JSON object with the updated fields (keep existing fields if not changed).
Ensure the JSON structure matches the original format:
- title, subtitle, description, requirements, theme_tags, professionalism_tags, rules_detail
- resource_detail (resources, APIs, mentors, support)
- organizer_name, location, registration_type ("individual" or "team"), format ("online" or "offline"), contact_info_text
- awards_detail (list of objects)
- scoring_dimensions (list of objects)

Do not include any markdown formatting (like ```json).
"""
                user_prompt = f"Current Data: {json.dumps(req.context_data, ensure_ascii=False)}\nUser Instruction: {req.prompt}"
            else:
                # Creation Mode
                system_prompt = """You are an expert hackathon organizer. 
Generate a detailed hackathon event plan based on the user's topic.
Return ONLY a valid JSON object with the following fields:
- title: A creative title for the hackathon
- subtitle: A catchy short subtitle (max 50 chars)
- description: A compelling description including an agenda/schedule overview (markdown supported)
- requirements: Specific submission requirements for participants (markdown supported)
- theme_tags: A string of comma-separated tags (e.g. "Web3, DeFi")
- professionalism_tags: A string of comma-separated tags (e.g. "Beginner Friendly, Hardcore")
- rules_detail: Detailed rules and code of conduct
- resource_detail: Resources provided, API access, mentor support, etc. (markdown supported)
- organizer_name: Suggested organizer name
- location: Suggested location (if offline) or "Online"
- registration_type: "individual" or "team"
- format: "online" or "offline"
- contact_info_text: Suggested contact email or info
- awards_detail: A list of objects, each with:
  - 'type': 'cash' | 'other' | 'mixed'
  - 'name': Award name (e.g. "First Prize")
  - 'count': Number of winners (integer)
  - 'amount': Cash amount (integer, 0 if none)
  - 'prize': Prize description (string, empty if none)
- scoring_dimensions: A list of objects, each with:
  - 'name': Dimension name (e.g. "Innovation")
  - 'description': Brief explanation
  - 'weight': Integer percentage (must sum to 100 across all items)

Do not include any markdown formatting (like ```json) in the response, just the raw JSON string.
"""
                user_prompt = f"Topic: {req.prompt}"
            
            completion = client.chat.completions.create(
                model=settings.MODELSCOPE_MODEL_NAME,
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
            system_prompt = """You are a startup mentor and technical consultant.
Refine the user's project idea into a professional project proposal.
Return ONLY a valid JSON object with the following fields:
- description: A detailed, polished project description including key features and tech stack recommendations.
- business_plan: A structured business plan including Executive Summary, Market Analysis, and Revenue Model.

Do not include any markdown formatting (like ```json) in the response, just the raw JSON string.
"""
            user_prompt = f"Project Idea: {req.prompt}"
            
            completion = client.chat.completions.create(
                model=settings.MODELSCOPE_MODEL_NAME,
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
            
            system_prompt = """You are a team building expert.
Based on the user's profile (skills and interests) and the project context, suggest 3 ideal teammate personas that would complement them.
Return ONLY a valid JSON object with a 'matches' field, which is a list of objects.
Each object should have:
- user_id: Use random integers 1-100
- name: A creative persona name (e.g. "Frontend Wizard")
- skills: Required skills for this role that complement the user
- match_score: A number between 80-99
"""
            if req.prompt and len(req.prompt) > 10 and req.prompt != 'match':
                context_prompt = f"Project Context: {req.prompt}. "
            else:
                context_prompt = "Context: General Hackathon Team. "
                
            user_prompt = f"{context_prompt}User Skills: {user_skills}. User Interests: {user_interests}. Suggest complementary teammates."
            
            completion = client.chat.completions.create(
                model=settings.MODELSCOPE_MODEL_NAME,
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
