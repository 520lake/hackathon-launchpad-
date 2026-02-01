---
title: VibeBuild AI Hackathon Platform
emoji: 🚀
colorFrom: gray
colorTo: black
sdk: docker
app_port: 7860
---

# VibeBuild - AI-Empowered Hackathon Platform

VibeBuild is a "China's Devpost" - a brutalist-styled, AI-empowered platform for hackathon organizers, participants, and judges.

## Features

*   **AI-Powered Creation**: Auto-generate hackathon themes, schedules, and details using ModelScope AI models.
*   **Brutalist Design**: Distinctive "No AI Flavor" UI with high contrast and bold typography.
*   **Full Lifecycle Management**: From team formation to project submission and judging.
*   **Dual Auth**: Support for WeChat (Test) and Email login.

## Deployment

This space is deployed using Docker. It serves both the React Frontend and FastAPI Backend.

*   Frontend: React + Tailwind CSS (v4)
*   Backend: FastAPI + SQLModel + SQLite (Persistent on ModelScope)

## Persistent Storage

Data is stored in `/mnt/workspace/vibebuild.db` to ensure persistence across restarts.
