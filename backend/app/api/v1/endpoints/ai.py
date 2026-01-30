from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time
import random
import json
import os
from openai import OpenAI
from app.api import deps
from app.models.user import User
from app.core.config import settings

router = APIRouter()

class AIRequest(BaseModel):
    prompt: str
    type: str # 'hackathon', 'project', 'matching'

class AIResponse(BaseModel):
    content: dict

# Initialize OpenAI client for ModelScope
client = OpenAI(
    api_key=settings.MODELSCOPE_API_KEY,
    base_url=settings.MODELSCOPE_BASE_URL,
)

@router.post("/generate", response_model=AIResponse)
async def generate_content(
    req: AIRequest,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        if req.type == 'hackathon':
            system_prompt = """You are an expert hackathon organizer. 
Generate a detailed hackathon event plan based on the user's topic.
Return ONLY a valid JSON object with the following fields:
- title: A creative title for the hackathon
- description: A compelling description (markdown supported)
- theme_tags: A string of comma-separated tags
- professionalism_tags: A string of comma-separated tags (e.g., Beginner, Advanced)
- rules_detail: Detailed rules
- awards_detail: Awards and prizes
- scoring_dimensions: A list of objects, each with 'name', 'description', and 'weight' (integer) fields.

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
                    "title": f"VibeBuild {req.prompt} Hackathon (Offline Mode)",
                    "description": f"AI Service unavailable. Generating offline template for {req.prompt}.",
                    "theme_tags": f"{req.prompt}, Fallback",
                    "professionalism_tags": "General",
                    "rules_detail": "Standard rules apply.",
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
