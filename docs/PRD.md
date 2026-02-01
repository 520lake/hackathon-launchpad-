# 📄 Product Requirement Document // 产品蓝图

> **Status**: Living Document
> **Vision**: AI-Driven Innovation Matrix
> **Target**: Empower Creators

---

## 1. Overview // 核心概述

### 1.1 Vision // 愿景
> **Target**: 成为中国领先的、由 AI 驱动的创新协作与黑客松生态平台。
> **Impact**: 推动黑客松文化走向大众，赋能每一个创造者，将伟大的想法变为现实。

### 1.2 Mission // 使命
*   **Platform**: 一站式、智能化、社区化的黑客松解决方案。
*   **Method**: 通过 AI 技术极大降低创新门槛。
*   **Focus**: AI知识普及、社会问题解决，连接创意、人才与机会。

### 1.3 Goals // 战略目标
| Timeline | Goal | Key Metrics |
| :--- | :--- | :--- |
| **Short-term** (6-12m) | **MVP Validation** | 1,000 Users, 2-3 AI Partners, 1st Campus Hackathon |
| **Mid-term** (1-2y) | **SaaS Scale-up** | 10-15 Enterprise Clients, 50k Users, Expansion to Beijing/Shenzhen |
| **Long-term** (2-3y) | **Ecosystem** | Full Ecosystem (Event/Community/Edu/Jobs), Internationalization |

### 1.4 Value Proposition // 核心价值主张
| User Group | Pain Point | Solution Matrix |
| :--- | :--- | :--- |
| **Organizer** | Complex logistics, low ROI | **AI Automation**: Auto-gen content/rules.<br>**SaaS Dashboard**: Full lifecycle management.<br>**Data Insight**: Quantifiable ROI. |
| **Participant** | Teaming, idea block | **AI Matching**: Skill/Personality-based teaming.<br>**AI Innovation Kit**: Idea generation to pitch deck.<br>**Growth**: Incubation & feedback. |
| **Enterprise** | Innovation stagnation | **Internal Hackathons**: Secure, compliant platform.<br>**Talent Scouting**: Skill-based assessment.<br>**Tech Trial**: Testbed for new tech. |
| **Social Innovator** | Tech barrier | **No-Code/Low-Code**: AI-assisted prototyping.<br>**Amplification**: Social impact reach. |

---

## 2. User Matrix // 用户画像与场景

### 2.1 Organizers // 主办方
| Persona | Role | Goal | Context |
| :--- | :--- | :--- | :--- |
| **Xiao Zhang** | Student Leader (21) | High-impact campus event | Limited budget/staff, needs free & easy tools. |
| **Manager Li** | Innovation Mgr (35) | Internal GenAI Hackathon | Needs security, compliance, internal integration (Feishu/DingTalk). |
| **Alex** | Community Lead (28) | Expand influence | Needs partner for joint online hackathons. |

### 2.2 Participants // 参赛者
| Persona | Role | Goal | Context |
| :--- | :--- | :--- | :--- |
| **Xiao Wang** | Student (20) | Learn AI, network | First-timer, needs teammates & guidance. |
| **Engineer Chen** | Senior Dev (30) | Explore AI, prize money | Wants professional judging & deep tech challenge. |
| **Sarah** | Designer (25) | Realize design ideas | Non-coder, needs tech partners. |

---

## 3. Functionality Core // 产品功能

`Reference: Notion Link (Archived)`

### 3.1 MVP Features // 最小可行产品
#### 3.1.1 Organizer Copilot
*   **Event Management**: Create/Manage (Online/Offline/Hybrid).
*   **Page Builder**: Customizable modules (Intro/Schedule/Judges).
*   **Ticketing**: Registration forms (Free support).
*   **Teaming**: Free or Assigned.
*   **Submission**: Code repo, video, description.
*   **Judging**: Scoring & Comments.
*   **AI Agent**:
    *   `Auto-Gen`: Marketing copy, social media posts.
    *   `Templates`: Standard rule sets.

#### 3.1.2 Participant Kit
*   **Discovery**: Browse & Search events.
*   **Profile**: Skills, Projects, Socials.
*   **Teaming**: Find teams / Post requests.
*   **Submission**: Simple project entry.
*   **AI Agent**:
    *   `Brainstorm`: Keyword-based idea generation.

#### 3.1.3 Platform Base
*   **Identity**: Unified Auth (Register/Login).
*   **Notification**: Key event alerts.

### 3.2 Community & Culture // 社区建设
*   **SDG Challenges**: Social impact tracks.
*   **AI For Everyone**: Tutorials & Workshops for non-techies.
*   **Impact Showcase**: Public voting & impact assessment.
*   **Cross-Pollination**: NGO/Edu partnerships.

### 3.3 Roadmap // 长期规划
| Feature | V1.1 | V1.2 | V2.0 (Long-term) |
| :--- | :--- | :--- | :--- |
| **Organizer** | Email/SMS, Custom Forms | AI Support, Multi-round Judging | Enterprise SaaS, SSO, Full Managed Service |
| **Participant** | Portfolio | Mentor Match, Online Workspace | AI Coding Assistant, Career Path, Resume Gen |
| **Community** | Project Wall | Forums, Resource Center | Social Network, Incubation, Paid Courses |
| **Commercial** | Sponsorships | Enterprise Subscription | Recruitment, Ad System |

---

## 4. AI Integration Strategy // AI 整合策略

### 4.1 Organizer AI Copilot
> **Goal**: Liberate organizers from logistics.
1.  **Auto-Plan**: Generate schedule, budget, promo plan from theme.
2.  **Auto-Market**: Generate multi-channel assets (WeChat/RedNote).
3.  **Smart CS**: 24/7 Q&A bot.
4.  **Sentiment**: Social monitoring.

### 4.2 Participant Innovation Kit
> **Goal**: Lower barrier to entry.
1.  **Ideator**: Trend-based creative direction.
2.  **Smart Match**: Vector-based matching (Skills + MBTI).
3.  **Feasibility**: Tech stack risk analysis.
4.  **Doc Assist**: Business plan & Deck generation.
5.  **Code Assist**: API examples & debugging.

### 4.3 Platform AI Agent
> **Goal**: Operational efficiency.
1.  **Pre-Screen**: Auto-assess completeness & quality.
2.  **Anti-Cheat**: Code plagiarism detection.
3.  **Moderation**: Community health monitoring.

---

## 5. Tech Stack & Architecture // 技术栈与架构

*   **Frontend**: React / Vue.js + TypeScript + Tailwind CSS (Vite).
*   **Backend**: Python (FastAPI) or Go.
*   **Database**: PostgreSQL + VectorDB (Milvus/Qdrant).
*   **AI Models**:
    *   `Primary`: Local Leaders (Baidu/Ali/Zhipu).
    *   `Benchmark`: OpenAI/Anthropic.
*   **Integrations**: Webhook (Discord/Slack), Feishu/DingTalk.
*   **Infra**: Docker + K8s (Aliyun/Tencent Cloud).

---

## 6. Business Model // 商业模式

> **Model**: Freemium + SaaS + Agency

| Tier | Target | Price | Features |
| :--- | :--- | :--- | :--- |
| **Community** | Students/NGOs | **Free** | Basic management, limited AI. |
| **Pro (SaaS)** | SMBs/Startups | **¥2k-6k/event** | High capacity, Advanced AI, Data export. |
| **Enterprise** | Large Corps | **¥50k-200k/yr** | Private deploy, SSO, Dedicated CSM, Analytics. |
| **Agency** | Full Service | **Project-based** | End-to-end execution & incubation. |

---

## 7. KPIs // 成功指标

### 7.1 Growth
*   MAU / DAU
*   Organizer Count (Enterprise)
*   Event Volume

### 7.2 Event Success
*   Registration & Activation Rate
*   Submission Quality
*   NPS (Net Promoter Score)

### 7.3 Commercial
*   Conversion Rate (Free -> Paid)
*   LTV (Life Time Value)
*   ARR (Annual Recurring Revenue)

---

## 8. Market Analysis // 市场与竞争分析

*   **Competitors**: General contest platforms (Tianchi), Dev Communities (CSDN), Collab Tools.
*   **VibeBuild Edge**:
    1.  **AI Native**: Deep integration, not an add-on.
    2.  **Vertical Focus**: Specialized for hackathons.
    3.  **Community First**: Network effects.
