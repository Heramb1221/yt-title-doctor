# YT Title Doctor

> An asynchronous event-driven pipeline that analyzes YouTube channels and delivers AI-optimized video title suggestions directly to your inbox.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Motia](https://img.shields.io/badge/Motia-Event%20Pipeline-purple?style=for-the-badge)
![Gemini AI](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-orange?style=for-the-badge&logo=google)
![Resend](https://img.shields.io/badge/Resend-Email-black?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Experimental%20Prototype-yellow?style=for-the-badge)

---

# About The Project

YT Title Doctor is a backend-only AI pipeline that analyzes a YouTube channel's recent uploads and generates improved, AI-optimized video title suggestions.

The system follows a five-stage asynchronous workflow:

1. Accept channel submission
2. Resolve channel identity
3. Fetch recent videos
4. Generate optimized titles using Gemini
5. Deliver results via email

The focus of the project is not the feature itself, but the architecture powering it.

The project explores:

- Event-driven workflow design
- Pub/sub communication patterns
- Multi-API orchestration
- LLM integration
- Failure propagation
- Asynchronous processing pipelines

The architecture is implemented using Motia, a workflow orchestration framework for Node.js.

---

# Project Type

Backend Service / AI Pipeline / Event-Driven Architecture

The project combines:

- Backend API design
- AI/LLM integration
- Pub/sub architecture
- Workflow orchestration
- Multi-API coordination

---

# Project Status

**Experimental Prototype / Learning Project**

The core pipeline is functional end-to-end. The project was built primarily to explore:

- Event-driven architectures
- Asynchronous workflow orchestration
- Multi-step AI pipelines
- Failure handling strategies
- Multi-API integration patterns

Several production-hardening concerns such as authentication, persistence, retries, and rate limiting are intentionally documented as future improvements.

---

# Why I Built This

I built this project to gain practical experience designing asynchronous event-driven systems rather than traditional monolithic request handlers.

The project helped me explore:

- Pub/sub architecture
- Step isolation
- Async API design using the `202 Accepted` pattern
- LLM prompt engineering with structured output
- Workflow orchestration frameworks
- Failure propagation across distributed-style pipelines

The most important learning was understanding that the hardest part of pipeline architecture is not the happy path — it is designing reliable failure handling and recovery strategies.

---

# Features

## Core Pipeline Features

- Submit YouTube channel handles or names
- Asynchronous background processing
- Channel handle → channel ID resolution
- Recent video retrieval
- Gemini AI title optimization
- Email delivery via Resend

---

## Engineering Features

- Five-stage event-driven workflow
- Strict step isolation
- Independent error handling
- Per-job state tracking
- Visual DAG flow in Motia Workbench
- Structured logging

---

## AI Features

- Structured JSON output
- Improvement rationale per title
- SEO-focused prompt engineering
- Tuned Gemini generation settings

---

## Developer Experience

- TypeScript throughout
- Auto-generated handler types
- Step-based architecture
- Hot reload support

---

# Tech Stack

## Backend

| Technology | Purpose |
|---|---|
| Node.js 18+ | Runtime |
| TypeScript 5.7 | Type safety |
| Motia | Workflow orchestration |

---

## External APIs

| API | Purpose |
|---|---|
| YouTube Data API v3 | Channel/video retrieval |
| Gemini 2.5 Flash | AI title generation |
| Resend | Transactional email delivery |

---

# Architecture

## Pipeline Overview

```text
Client
   │
POST /submit
   │
   ▼
Step 01: SubmitChannel
   │
   ▼
Step 02: ResolveChannel
   │
   ▼
Step 03: FetchVideos
   │
   ▼
Step 04: GenerateTitles
   │
   ▼
Step 05: SendSuccessEmail
```

---

## Error Handling Flow

```text
Any Step Failure
      │
      ▼
Emit *.error topic
      │
      ▼
Step 06: Error Handler
      │
      ▼
Failure Email Sent
```

---

## Request Lifecycle

```text
t=0ms     Request received
t=5ms     202 Accepted returned
t=200ms   Channel resolved
t=500ms   Videos fetched
t=1500ms  Gemini titles generated
t=1700ms  Email dispatched
```

---

# Folder Structure

```text
yt-title-doctor/
│
├── steps/
│   ├── 01-submit.step.ts
│   ├── 02-resolve-channel.step.ts
│   ├── 03-fetch-videos.step.ts
│   ├── 04-ai-title.step.ts
│   ├── 05-send-email.step.ts
│   └── 06-error.handler.step.ts
│
├── .cursor/
│   ├── architecture/
│   └── rules/motia/
│
├── types.d.ts
├── motia.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

---

# Installation

## Prerequisites

- Node.js 18+
- npm 8+
- YouTube API key
- Gemini API key
- Resend API key

---

## Setup

```bash
# Clone repository
git clone https://github.com/yourusername/yt-title-doctor.git

cd yt-title-doctor

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Motia Workbench:

```text
http://localhost:3000
```

---

# Environment Variables

Create a `.env` file:

```env
# YouTube API
YOUTUBE_API_KEY=

# Gemini API
GEMINI_API_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

---

## YouTube API Quota

The YouTube Data API free tier provides approximately:

```text
10,000 quota units/day
```

Current pipeline usage:

```text
~200 units per request
```

Approximate free-tier limit:

```text
~50 executions/day
```

---

# Usage

## Submit a Channel

```bash
curl -X POST http://localhost:9999/submit \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "@mkbhd",
    "email": "your@email.com"
  }'
```

---

## Accepted Formats

- `@channelhandle`
- `MrBeast`
- `Linus Tech Tips`

---

## Example Response

```json
{
  "success": true,
  "jobId": "job_1718123456789_abc123def",
  "message": "Your request has been queued."
}
```

---

# API Documentation

## `POST /submit`

Starts an asynchronous title optimization job.

---

## Request Body

```json
{
  "channel": "@channelhandle",
  "email": "recipient@example.com"
}
```

---

## Responses

| Status | Meaning |
|---|---|
| `202` | Job accepted |
| `400` | Invalid request |
| `500` | Internal error |

---

## Example Success Response

```json
{
  "success": true,
  "jobId": "job_1718123456789_abc123def",
  "message": "Your request has been queued."
}
```

---

# Performance Considerations

## Current Latency Profile

| Stage | Typical Latency |
|---|---|
| Channel Resolution | 200–500ms |
| Video Retrieval | 200–500ms |
| Gemini Generation | 1000–3000ms |
| Email Delivery | 200–500ms |

---

## Optimizations Implemented

- Immediate `202 Accepted` response
- Async processing
- Batch Gemini requests
- Event-driven execution

---

## Known Bottlenecks

- No request timeouts
- Sequential dependency chain
- No caching layer
- Gemini inference latency

---

# Security Considerations

## Implemented

| Concern | Implementation |
|---|---|
| Secret management | Environment variables |
| Input validation | Basic request validation |
| HTTPS APIs | All external requests use HTTPS |

---

## Known Gaps

| Gap | Risk |
|---|---|
| No authentication | Critical |
| No rate limiting | High |
| No email verification | Medium |
| No request timeout | Medium |

---

# Tradeoffs & Limitations

## In-Memory State

The pipeline currently uses ephemeral in-memory state.

Tradeoff:

- Simpler setup
- No persistence durability

---

## No Retry Logic

Transient failures permanently fail jobs.

Tradeoff:

- Simpler implementation
- Reduced reliability

---

## Single-Process Architecture

All steps execute within one Node.js process.

Tradeoff:

- Easier orchestration
- No horizontal scalability

---

## YouTube API Quota

Free-tier quotas limit throughput to approximately:

```text
~50 jobs/day
```

---

# Known Issues

| Issue | Status |
|---|---|
| Step name conflict | Open |
| Broken YouTube URLs | Open |
| Email subject typo | Open |
| No job status endpoint | Open |

---

# Technical Debt

| Area | Debt |
|---|---|
| State persistence | In-memory only |
| Authentication | Missing |
| Retry logic | Missing |
| Request timeouts | Missing |
| Shared constants | Duplicated |
| Validation schemas | Missing |

---

# Scalability Discussion

## Current Capacity

| Scale | Assessment |
|---|---|
| ~10 concurrent jobs | Stable |
| ~50 concurrent jobs | Gemini bottlenecks appear |

---

# Challenges Faced

- Structured JSON generation from LLMs
- Pipeline-wide error propagation
- State coordination across async stages
- Channel resolution edge cases

---

# What I Learned

- Event-driven system design
- The `202 Accepted` API pattern
- Structured AI output handling
- Failure-mode-oriented architecture
- Pub/sub workflow thinking
- Prototype vs production engineering gaps

---

# Future Scope

## Reliability Improvements

- Request timeouts
- Retry logic
- Persistent state
- Status endpoint

---

## Long-Term Features

- HTML email templates
- Web dashboard
- OpenTelemetry tracing
- Webhook callback support
- Multi-key quota balancing

---

# Repository Philosophy

This repository is intentionally prototype-first and learning-oriented.

The goal was not just to build a working feature, but to explore:

- workflow orchestration
- pub/sub communication
- AI pipelines
- async architecture
- distributed-system-inspired design patterns

The repository intentionally documents:

- architectural tradeoffs
- known limitations
- technical debt
- scaling concerns

as part of the learning process.

---

# Contributing

This is primarily a personal learning project, but issues and architectural discussions are welcome.

```bash
# Fork repository
git checkout -b feature/your-feature-name

# Commit changes
git commit -m "feat: your feature"

# Push changes
git push origin feature/your-feature-name
```

Open a Pull Request with a clear explanation of the change.

---

# License

MIT License

See `LICENSE` for details.

---

# Contact

**Heramb Chaudhari**

[![GitHub](https://img.shields.io/badge/GitHub-Heramb1221-black?style=for-the-badge&logo=github)](https://github.com/Heramb1221)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Heramb%20Chaudhari-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/heramb-chaudhari)

[![Email](https://img.shields.io/badge/Email-hchaudhari1221%40gmail.com-red?style=for-the-badge&logo=gmail)](mailto:hchaudhari1221@gmail.com)

---

Built to explore event-driven pipeline architecture, async workflows, and multi-API orchestration using Motia, TypeScript, Gemini AI, and Resend.
