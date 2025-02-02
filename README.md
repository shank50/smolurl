# SmolURL - URL Shortener

A modern, full-stack URL shortener application built with React, TypeScript, Express.js, and PostgreSQL. SmolURL allows users to create shortened URLs, track analytics, and manage their links through a clean, responsive dashboard interface.

## Features

### Core Functionality
- **URL Shortening**: Convert long URLs into short, shareable links
- **Custom Slugs**: Create personalized short codes for your URLs
- **Analytics Dashboard**: Track clicks, geographic data, and referrer statistics
- **Link Management**: View, edit, and manage all your shortened URLs
- **Anonymous Usage**: Limited functionality for unauthenticated users (10 URLs per day)
- **User Authentication**: Unlimited URL creation for registered users

### Technical Features
- **Real-time Analytics**: Live click tracking and geographic visualization
- **Responsive Design**: Mobile-first UI that works on all devices
- **Dark/Light Theme**: Toggle between light and dark modes
- **Rate Limiting**: API protection against abuse
- **Session Management**: Secure user authentication and session handling
- **Database Migrations**: Type-safe database schema with Drizzle ORM

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for server state management
- **Wouter** for client-side routing
- **Recharts** for analytics visualization

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **Express Session** for authentication
- **Rate limiting** with express-rate-limit

### Infrastructure
- **Neon Database** - Serverless PostgreSQL
- **Session-based Authentication**
- **IP Geolocation APIs** for analytics

## Setup Instructions


### 1. Clone the Repository
```bash
git clone <https://github.com/shank50/smolurl>
cd SmolURL
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Server Configuration  
PORT=5000
NODE_ENV=development

# Security
SESSION_SECRET="your-secure-random-string"

# Domain Configuration
SHORT_DOMAIN="domain-where-your-app-is-live.com"
Example: url-shortener.render.com
You can keep ignore it for local development.

```

#### Environment Variables Explained:
- **DATABASE_URL**: PostgreSQL connection string from your database provider
- **PORT**: Port number for the Express server
- **NODE_ENV**: Environment mode (development/production)
- **SESSION_SECRET**: Random string for securing user sessions
- **SHORT_DOMAIN**: Your domain for generating short URLs (server-side)
- **VITE_SHORT_DOMAIN**: Your domain for the frontend (client-side)

### 4. Database Setup
Push the database schema to your PostgreSQL database:

```bash
npm run db:push
```

This command uses Drizzle Kit to create all necessary tables in your database.

### 5. Development
Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`


## Database Schema

The application uses the following main tables:
- **users**: Store user account information
- **urls**: Store original and shortened URL mappings
- **url_clicks**: Track individual click events for analytics
- **sessions**: Manage user authentication sessions
- **anonymous_sessions**: Track usage limits for unauthenticated users

## API Endpoints

### URL Management
- `POST /api/urls` - Create a new shortened URL
- `GET /api/urls` - Get user's URLs (authenticated users only)
- `DELETE /api/urls/:id` - Delete a URL
- `GET /:shortCode` - Redirect to original URL

### Analytics
- `GET /api/urls/:id/analytics` - Get detailed analytics for a URL
- `GET /api/dashboard/stats` - Get dashboard statistics

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

## Project Structure

```
SmolURL/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Route components
├── server/                 # Express.js backend
│   ├── services/           # Business logic services
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Database operations
├── shared/                 # Shared TypeScript schemas
└── package.json           # Dependencies and scripts
```
