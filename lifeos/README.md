# LifeOS - Full-Stack Personal Goal & Life Management System

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express.js-4.18-green?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
</p>

LifeOS is a comprehensive personal goal and life management system designed to help you track financial goals, fitness objectives, habits, and life systems in one unified dashboard.

## ✨ Features

### 🎯 Financial Goals
- Track multiple financial objectives (savings, investments, debt reduction)
- Set target amounts and deadlines
- Monitor progress with visual indicators
- Risk preference settings

### 💪 Fitness Goals
- Track various fitness metrics (weight, strength, cardio, flexibility)
- Set numeric targets with units
- Monitor weekly adherence
- Progress visualization

### 📅 Habits
- Create daily, weekly, or custom habits
- Track completion with streaks
- Visual progress indicators
- Habit frequency customization

### 🔄 Life Systems
- Define personal systems and routines
- Track adherence over time
- Review and adjustment scheduling
- System effectiveness monitoring

### 💰 Budget Management
- Monthly budget planning
- Category-based allocation
- Spending vs. budget tracking
- Visual breakdowns

### 📊 Unified Dashboard
- Life Score calculation
- Cross-domain progress overview
- Quick actions and insights
- Performance trends

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **Validation**: Zod

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **Charts**: Recharts

## 📁 Project Structure

```
lifeos/
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   └── schema.prisma      # Database schema
│   │   └── src/
│   │       ├── controllers/        # Route handlers
│   │       ├── middleware/         # Auth, validation, error handling
│   │       ├── routes/             # API routes
│   │       ├── schemas/            # Zod validation schemas
│   │       ├── lib/                # Utilities (Prisma client)
│   │       └── index.ts            # Express app entry
│   └── frontend/
│       └── src/
│           ├── app/                # Next.js pages
│           ├── components/         # React components
│           ├── lib/                # Utilities (API client)
│           └── stores/             # Zustand stores
├── docker-compose.yml              # Docker orchestration
├── package.json                    # Root workspace config
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher
- PostgreSQL 15 or higher (or Docker)

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifeos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start PostgreSQL** (if not using Docker)
   ```bash
   # Ensure PostgreSQL is running and create database
   createdb lifeos
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API at http://localhost:5000
   - Frontend at http://localhost:3000

### Option 2: Docker Compose

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd lifeos
   cp .env.example .env
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL at localhost:5432
   - Backend API at localhost:5000
   - Frontend at localhost:3000

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

4. **Stop services**
   ```bash
   docker-compose down
   ```

## 📖 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PATCH | `/api/users/profile` | Update profile |
| POST | `/api/users/change-password` | Change password |

### Financial Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/financial-goals` | List all goals |
| POST | `/api/financial-goals` | Create goal |
| GET | `/api/financial-goals/:id` | Get goal |
| PATCH | `/api/financial-goals/:id` | Update goal |
| DELETE | `/api/financial-goals/:id` | Delete goal |
| PATCH | `/api/financial-goals/:id/progress` | Update progress |

### Fitness Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fitness-goals` | List all goals |
| POST | `/api/fitness-goals` | Create goal |
| GET | `/api/fitness-goals/:id` | Get goal |
| PATCH | `/api/fitness-goals/:id` | Update goal |
| DELETE | `/api/fitness-goals/:id` | Delete goal |
| PATCH | `/api/fitness-goals/:id/progress` | Update progress |

### Habits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | List all habits |
| POST | `/api/habits` | Create habit |
| GET | `/api/habits/:id` | Get habit |
| PATCH | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Delete habit |
| POST | `/api/habits/:id/entries` | Log entry |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Get dashboard data |
| GET | `/api/dashboard/life-score` | Calculate life score |

## 🔧 Available Scripts

### Root Level
```bash
npm run dev           # Start both backend and frontend
npm run build         # Build both packages
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run database migrations
```

### Backend
```bash
npm run dev:backend   # Start backend in dev mode
npm run build:backend # Build backend
```

### Frontend
```bash
npm run dev:frontend  # Start frontend in dev mode
npm run build:frontend # Build frontend
```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:5000` |

## 🗄 Database Schema

The application uses the following main entities:

- **User**: Authentication and profile information
- **FinancialGoal**: Financial targets and progress
- **FitnessGoal**: Fitness objectives and tracking
- **Habit**: Daily/weekly habits with entries
- **HabitEntry**: Individual habit completions
- **Budget**: Monthly budgets with categories
- **BudgetCategory**: Budget category allocations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [Prisma](https://prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Recharts](https://recharts.org/)
