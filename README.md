<div align="center">

# 🛍️ LuxeCart

### Premium Shopping, Reimagined.

A production-grade, full-stack e-commerce platform with real Stripe payment processing.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-success?style=for-the-badge)](https://luxecart-web.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Source_Code-181717?style=for-the-badge&logo=github)](https://github.com/oladapo-elegbede/Luxecart)

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 🌐 Live Demo

### 👉 [**https://luxecart-web.vercel.app**](https://luxecart-web.vercel.app) 👈

**Try the complete checkout flow with Stripe test card:**

| Field | Value |
|-------|-------|
| 💳 Card Number | `4242 4242 4242 4242` |
| 📅 Expiry | Any future date (e.g., `12/30`) |
| 🔐 CVC | Any 3 digits (e.g., `123`) |
| 📮 ZIP | Any 5 digits (e.g., `12345`) |

> 💡 **No real money is charged** — uses Stripe test mode

---

## 📋 Overview

LuxeCart is a comprehensive, production-deployed e-commerce platform demonstrating modern full-stack engineering. Built end-to-end with real payment processing, it features a complete customer journey from product browsing to order fulfillment.

**Key Highlights:**

- ✅ **Real Stripe Payments** — Full checkout with webhook verification
- ✅ **Production Deployed** — Live on Vercel + Render + Supabase
- ✅ **JWT Authentication** — Access + refresh token rotation
- ✅ **Clean Architecture** — Modular monorepo with strict TypeScript
- ✅ **100/100 Lighthouse** — Accessibility, Best Practices & SEO
- ✅ **Dark Mode** — Beautiful responsive design

---

## ✨ Features

### 🛒 Shopping Experience

- Browse 11+ products across 6 categories
- Advanced filtering and sorting
- Beautiful product detail pages
- Real-time stock validation
- Shopping cart with quantity controls
- Wishlist management

### 👤 User Accounts

- Email-based registration with verification
- JWT authentication (access + refresh tokens)
- Forgot password / reset flow
- Profile management
- Address book (multiple shipping addresses)
- Order history with status tracking

### 💳 Payments (Stripe)

- Secure card collection with Stripe Elements
- 3D Secure support
- Payment Intent + webhook architecture
- Idempotent payment processing
- Order confirmation page

### 🎨 UX / UI

- Mobile-first responsive design
- Dark mode with system preference detection
- Toast notifications
- Loading skeletons
- Empty states with CTAs
- Smooth page transitions

### 🛡️ Security

- Helmet.js security headers
- CORS configuration
- Rate limiting (per IP)
- bcrypt password hashing
- Webhook signature verification
- Input validation with Zod

---

## 🛠️ Technology Stack

### Frontend

- **Next.js 16** — React framework with App Router
- **TypeScript 5** — Type-safe development
- **Tailwind CSS 4** — Utility-first styling
- **shadcn/ui** — Accessible component library
- **TanStack Query** — Server state management
- **Zustand** — Client state management
- **React Hook Form + Zod** — Form validation
- **Stripe Elements** — Secure payment UI

### Backend

- **Node.js + Express.js** — REST API server
- **TypeScript 5** — Type-safe development
- **Prisma ORM** — Type-safe database client
- **Zod** — Runtime schema validation
- **JWT** — Authentication tokens
- **bcrypt** — Password hashing
- **Stripe Node SDK** — Payment processing
- **Helmet** — Security headers

### Database & Infrastructure

- **PostgreSQL 16** — Primary database
- **Supabase** — Managed database hosting
- **Render** — Backend hosting
- **Vercel** — Frontend hosting + CDN
- **UptimeRobot** — Uptime monitoring

### DevOps & Tooling

- **Turborepo** — Monorepo orchestration
- **npm Workspaces** — Package management
- **ESLint + Prettier** — Code quality
- **Git + GitHub** — Version control

---

## 📊 Performance

Production Lighthouse scores:

| Metric | Score |
|--------|-------|
| ⚡ Performance | 72 |
| ♿ Accessibility | **100** |
| 🛡️ Best Practices | **100** |
| 🔍 SEO | **100** |

---

## 📁 Project Structure

```text
luxecart/
├── apps/
│   ├── api/                          # Express.js REST API
│   │   ├── src/
│   │   │   ├── config/               # Env & DB configuration
│   │   │   ├── middleware/           # Auth, rate limiter, error handler
│   │   │   ├── modules/              # Feature modules
│   │   │   │   ├── auth/             # Login, register, JWT
│   │   │   │   ├── users/            # User management
│   │   │   │   ├── addresses/        # Shipping addresses
│   │   │   │   ├── categories/       # Product categories
│   │   │   │   ├── products/         # Product catalog
│   │   │   │   ├── cart/             # Shopping cart
│   │   │   │   ├── wishlist/         # User wishlists
│   │   │   │   ├── orders/           # Order management
│   │   │   │   ├── reviews/          # Product reviews
│   │   │   │   ├── notifications/    # User notifications
│   │   │   │   ├── payments/         # Stripe integration
│   │   │   │   └── admin/            # Admin operations
│   │   │   ├── shared/
│   │   │   │   ├── errors/           # HTTP error classes
│   │   │   │   └── helpers/          # Reusable utilities
│   │   │   ├── app.ts                # Express app setup
│   │   │   └── server.ts             # Server entry point
│   │   └── prisma/
│   │       ├── schema.prisma         # Database schema
│   │       └── migrations/           # Schema migrations
│   │
│   └── web/                          # Next.js frontend
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── (auth)/           # Auth pages group
│       │   │   ├── products/         # Product catalog
│       │   │   ├── categories/       # Category pages
│       │   │   ├── cart/             # Cart page
│       │   │   ├── checkout/         # Checkout flow
│       │   │   ├── orders/           # Order history
│       │   │   ├── dashboard/        # User dashboard
│       │   │   └── profile/          # Profile management
│       │   ├── components/           # React components
│       │   │   ├── ui/               # shadcn/ui primitives
│       │   │   ├── cart/             # Cart-specific
│       │   │   ├── checkout/         # Checkout flow
│       │   │   ├── products/         # Product components
│       │   │   └── common/           # Shared (navbar, footer)
│       │   ├── lib/
│       │   │   ├── api/              # API client functions
│       │   │   ├── api-client.ts     # Axios instance
│       │   │   └── stripe.ts         # Stripe.js client
│       │   ├── providers/            # React providers
│       │   ├── stores/               # Zustand stores
│       │   └── types/                # TypeScript types
│       └── public/                   # Static assets
│
├── .github/workflows/                # CI/CD pipelines
├── turbo.json                        # Turborepo config
├── vercel.json                       # Vercel deployment config
└── package.json                      # Workspace root
```

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **PostgreSQL** database (Supabase free tier works great)
- **Stripe Account** (free, test mode only)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/oladapo-elegbede/Luxecart.git
cd Luxecart
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DIRECT_URL=postgresql://user:pass@host:5432/dbname
JWT_ACCESS_SECRET=your-min-32-char-secret
JWT_REFRESH_SECRET=your-min-32-char-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**4. Run database migrations**

```bash
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

**5. Start development servers**

In separate terminals:

```bash
# Terminal 1 - Backend
cd apps/api && npm run dev

# Terminal 2 - Frontend
cd apps/web && npm run dev

# Terminal 3 - Stripe webhook listener
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
```

**6. Visit the app**

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend Health: [http://localhost:5000/health](http://localhost:5000/health)
- API Root: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## 🎯 Development Roadmap

### ✅ Completed (Phases 1-13)

- ✅ Product planning & system architecture
- ✅ UI/UX design system
- ✅ Monorepo setup with Turborepo
- ✅ Database design (Prisma + PostgreSQL)
- ✅ Backend API (10 modules, 40+ endpoints)
- ✅ Frontend pages (14+ routes)
- ✅ Authentication & security
- ✅ Stripe payment integration
- ✅ Testing & polish
- ✅ Production deployment
- ✅ Performance optimization
- ✅ Portfolio preparation

### 🔮 Future Enhancements

- [ ] Admin dashboard UI
- [ ] Real email sending (Resend / SendGrid)
- [ ] Product reviews UI
- [ ] Wishlist sharing
- [ ] Multi-currency support
- [ ] Internationalization (i18n)
- [ ] Automated tests (Jest + Playwright)
- [ ] Real-time order tracking
- [ ] Push notifications

---

## 🏗️ Architecture Highlights

### Request Flow

```text
HTTP Request
     │
     ▼
[ Routes ]              URL → handler mapping
     │
     ▼
[ Middleware ]          Auth, validation, rate limiting
     │
     ▼
[ Controllers ]         HTTP request/response handling
     │
     ▼
[ Validators (Zod) ]    Runtime input validation
     │
     ▼
[ Services ]            Business logic (pure functions)
     │
     ▼
[ Database (Prisma) ]   Type-safe ORM
     │
     ▼
   PostgreSQL
```

### Key Patterns

- **Separation of concerns** — Each layer has a single responsibility
- **Type safety** — TypeScript everywhere, runtime validation with Zod
- **Idempotency** — Critical operations (payments) are safe to retry
- **Transaction safety** — Order creation uses database transactions
- **Error handling** — Custom error hierarchy with proper HTTP codes
- **Stateless services** — Easy to test and scale

---

## 💡 What I Learned Building This

This project taught me production patterns I now use daily:

- 🏗️ **Monorepo management** with Turborepo and npm workspaces
- 🔐 **JWT authentication** with refresh token rotation
- 💳 **Stripe integration** including webhook signature verification
- 🗄️ **Database design** with proper relations and indexes
- 🚀 **Production deployment** across multiple services
- 🐛 **Real debugging** — CORS, environment variables, build issues
- 📊 **Performance optimization** — caching strategies, lazy loading
- ♿ **Accessibility** — ARIA, semantic HTML, keyboard navigation

---

## 📸 Screenshots

> Screenshots coming soon! For now, [visit the live demo](https://luxecart-web.vercel.app) to see it in action.

---

## 🤝 Contributing

This is a portfolio project, but feedback is welcome! Feel free to:

- ⭐ Star this repo if you find it useful
- 🐛 [Report bugs](https://github.com/oladapo-elegbede/Luxecart/issues)
- 💡 [Suggest features](https://github.com/oladapo-elegbede/Luxecart/issues)

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details

---

## 👨‍💻 Author

**Oladapo Elegbede**

- 🌐 GitHub: [@oladapo-elegbede](https://github.com/oladapo-elegbede)
- 💼 Live Project: [luxecart-web.vercel.app](https://luxecart-web.vercel.app)

---

<div align="center">

### Built with ❤️ following senior engineering practices

⭐ **If this project helped you learn something, please star the repo!**

</div>