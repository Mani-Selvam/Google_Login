# Overview

This is a full-stack todo application built with a React frontend and Express backend. The application allows users to register, login, and manage their personal todo lists with scheduling capabilities. It features a modern UI built with shadcn/ui components and uses PostgreSQL for data persistence with Drizzle ORM for database management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Context-based auth provider with protected routes

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Management**: Express sessions with PostgreSQL session store
- **Password Security**: Node.js crypto module with scrypt for password hashing
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot reload with tsx, custom logging middleware

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Two main entities - users and todos with foreign key relationships
- **Migrations**: Drizzle Kit for schema migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed session store for authentication

## Key Design Decisions

### Authentication Strategy
- **Session-based authentication** over JWT for simplicity and automatic CSRF protection
- **Local strategy** with username/email and password rather than OAuth for MVP simplicity
- **Scrypt hashing** for password security with salting

### Database Architecture
- **Relational approach** with proper foreign key constraints for data integrity
- **UUID primary keys** for better security and distributed system compatibility
- **Timestamp tracking** for audit trails on user and todo creation

### Frontend State Management
- **TanStack Query** for server state to provide caching, background updates, and optimistic updates
- **React Context** for authentication state to avoid prop drilling
- **Form state isolation** using React Hook Form for better performance

### UI/UX Architecture
- **Component-driven design** with shadcn/ui for consistency and accessibility
- **Mobile-responsive** layout using Tailwind CSS breakpoints
- **Dark/light theme support** through CSS variables
- **Toast notifications** for user feedback on actions

### Development Experience
- **Monorepo structure** with shared schema types between frontend and backend
- **Path aliases** for clean imports across the application
- **TypeScript throughout** for type safety and better developer experience
- **Hot reload** in development with proper error boundaries

# External Dependencies

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL database for production
- **Connection pooling**: Built-in connection management for serverless environments

## Authentication
- **Passport.js**: Authentication middleware with local strategy
- **Express sessions**: Session management with PostgreSQL backing store

## UI Framework
- **Radix UI**: Headless UI primitives for accessibility
- **shadcn/ui**: Pre-built component library built on Radix
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool and development server
- **Drizzle Kit**: Database migration and introspection tools
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds

## Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation
- **Hookform resolvers**: Integration between React Hook Form and Zod

## State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Router (Wouter)**: Lightweight client-side routing solution