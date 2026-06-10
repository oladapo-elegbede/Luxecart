<div align="center">

# 🛍️ LuxeCart

### Premium Shopping, Reimagined.

A production-grade, full-stack e-commerce platform built with modern technologies and enterprise architecture patterns.

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📋 Overview

LuxeCart is a comprehensive e-commerce platform demonstrating modern full-stack engineering practices. Built as a monorepo with a clear separation of concerns, it showcases:

- **Clean Architecture** — Modular backend with service-repository-controller pattern
- **Type Safety** — Strict TypeScript across the entire stack
- **Production-Ready** — Security middleware, error handling, graceful shutdown
- **Scalable Foundation** — Monorepo with shared types and reusable patterns

This project is built incrementally to demonstrate real engineering progression, with every architectural decision documented and justified.

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** — React framework with App Router
- **TypeScript 5** — Type-safe development
- **Tailwind CSS 4** — Utility-first styling
- **Turbopack** — Next-generation bundler

### Backend
- **Node.js + Express.js** — REST API server
- **TypeScript 5** — Type-safe development
- **Zod** — Runtime schema validation
- **Helmet** — Security headers
- **CORS** — Cross-origin resource sharing
- **Morgan** — HTTP request logging
- **dotenv** — Environment configuration

### Database & Infrastructure
- **PostgreSQL 16** — Primary database (hosted on Supabase)
- **Prisma ORM** — Type-safe database client (coming soon)
- **Redis** — Caching and session storage (coming soon)

### DevOps & Tooling
- **Turborepo** — Monorepo orchestration
- **npm Workspaces** — Package management
- **ESLint + Prettier** — Code quality
- **Git + GitHub** — Version control

---

## 📁 Project Structure

```
luxecart/
├── apps/
│   ├── api/                    # Express.js REST API
│   │   ├── src/
│   │   │   ├── config/         # Environment & configurations
│   │   │   ├── shared/
│   │   │   │   ├── errors/     # Error class hierarchy
│   │   │   │   └── helpers/    # Reusable utilities
│   │   │   ├── app.ts          # Express app configuration
│   │   │   └── server.ts       # Server entry point
│   │   └── package.json
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   └── app/            # App Router pages
│       └── package.json
├── packages/                   # Shared packages (coming soon)
│   └── types/                  # Shared TypeScript types
├── .github/
│   └── workflows/              # CI/CD pipelines
├── turbo.json                  # Turborepo configuration
└── package.json                # Workspace root
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git**
- **PostgreSQL** database (Supabase free tier recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/oladapo-elegbede/Luxecart.git
   cd Luxecart
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   For the API:
   ```bash
   cd apps/api
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   ```

   For the Web app:
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

4. **Run the development servers**

   In separate terminals:
   ```bash
   # Backend (port 5000)
   cd apps/api && npm run dev

   # Frontend (port 3000)
   cd apps/web && npm run dev
   ```

5. **Verify the setup**

   - Frontend: http://localhost:3000
   - Backend Health Check: http://localhost:5000/health
   - Backend API v1: http://localhost:5000/api/v1

---

## 🎯 Features Roadmap

### ✅ Phase 1-4: Foundation (Complete)
- [x] Product planning and requirements specification
- [x] System architecture design
- [x] UI/UX design system
- [x] Monorepo setup with Turborepo
- [x] Express.js API with security middleware
- [x] Next.js 16 frontend with TypeScript
- [x] Environment variable validation with Zod
- [x] Centralized error handling system
- [x] Graceful shutdown handling
- [x] Cloud PostgreSQL setup (Supabase)

### 🔄 Phase 5: Database Design (Next)
- [ ] Prisma ORM integration
- [ ] Complete database schema (Users, Products, Orders, etc.)
- [ ] Database migrations
- [ ] Seed data for development

### 📅 Phase 6+: Core Features (Upcoming)
- [ ] JWT authentication with refresh tokens
- [ ] Product catalog APIs
- [ ] Shopping cart functionality
- [ ] Stripe payment integration
- [ ] Order management system
- [ ] Reviews and ratings
- [ ] Admin dashboard
- [ ] Comprehensive testing
- [ ] CI/CD deployment

---

## 🏗️ Architecture Principles

This project follows **Clean Architecture** with strict separation of concerns:

```
HTTP Request
     │
     ▼
[ Routes ]              ← URL routing
     │
     ▼
[ Controllers ]         ← Request/response handling
     │
     ▼
[ Services ]            ← Business logic (pure, testable)
     │
     ▼
[ Repositories ]        ← Database access
     │
     ▼
[ Database ]
```

**Key principles:**
- Dependencies only point inward
- Business logic has zero knowledge of HTTP
- Every layer is independently testable
- All errors flow through a centralized handler

---

## 🔒 Security Practices

- ✅ Helmet.js for security headers (15+ headers configured)
- ✅ CORS with explicit origin whitelisting
- ✅ Request body size limits (DoS prevention)
- ✅ Environment variable validation on startup
- ✅ Compressed responses (gzip)
- ✅ HTTP request logging
- 🔄 JWT with refresh tokens (Phase 6)
- 🔄 Rate limiting with Redis (Phase 6)
- 🔄 Input validation on all endpoints (Phase 6)

---

## 📝 Available Scripts

From the root of the monorepo:

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all apps for production
npm run lint         # Lint all packages
npm run type-check   # Run TypeScript type checking
npm run format       # Format all code with Prettier
```

---

## 🤝 Contributing

This is a personal portfolio project, but contributions, suggestions, and feedback are welcome. Please feel free to open an issue or pull request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Oladapo Elegbede**

- GitHub: [@oladapo-elegbede](https://github.com/oladapo-elegbede)

---

<div align="center">

### Built with ❤️ following senior engineering practices

⭐ Star this repo if you find it helpful!

</div>