# Kanban System

## Overview

This is a comprehensive Kanban task management system built with React, TypeScript, and Node.js. The application provides a complete project management solution with board organization, task tracking, collaboration features, and detailed analytics. It implements a modern full-stack architecture with real-time collaboration capabilities, user authentication, and role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript**: Modern React application with strict type safety
- **Component-based UI**: Modular design using Radix UI primitives for accessibility
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Drag & Drop**: React Beautiful DnD for intuitive task and list reordering

### Backend Architecture
- **Node.js with Express**: RESTful API server with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Passport.js with local strategy and session-based auth
- **File Handling**: Multer for profile picture uploads
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Database Design
- **PostgreSQL**: Primary database with 11 core tables
- **Relational Structure**: Normalized schema supporting users, boards, lists, cards, labels, comments, checklists, and membership relationships
- **Data Integrity**: Foreign key constraints and proper indexing for performance
- **Role-based Access**: User roles (admin/user) with granular board-level permissions

### Core Features Architecture
- **Kanban Boards**: Hierarchical structure (Boards → Lists → Cards)
- **Collaboration System**: Multi-user board access with role-based permissions
- **Task Management**: Cards with descriptions, due dates, checklists, and labels
- **Real-time Updates**: Context-based state management for live collaboration
- **Dashboard Analytics**: User and admin dashboards with progress tracking
- **File Management**: Secure profile picture uploads with proper validation

### Security & Authentication
- **Session-based Authentication**: Secure login with bcrypt password hashing
- **Authorization Middleware**: Route protection based on user roles and permissions
- **Input Validation**: Zod schemas for runtime type checking and data validation
- **CSRF Protection**: Express session configuration with secure cookies

### Performance Optimizations
- **Query Optimization**: Efficient database queries with proper indexing
- **Client-side Caching**: TanStack Query for intelligent data caching and synchronization
- **Code Splitting**: Modern bundling with Vite for optimal loading performance
- **Image Optimization**: Controlled file uploads with size and type restrictions

## External Dependencies

### Database & ORM
- **Neon PostgreSQL**: Cloud PostgreSQL database service
- **Drizzle ORM**: Type-safe SQL database toolkit
- **connect-pg-simple**: PostgreSQL session store for Express

### Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **bcrypt**: Password hashing (via crypto module)
- **express-session**: Session management middleware

### UI & Styling
- **Radix UI**: Accessible component primitives library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Framer Motion**: Animation library for smooth interactions

### Development & Build Tools
- **Vite**: Modern build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds

### Form & Validation
- **React Hook Form**: Performant form library
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries

### Data Visualization
- **Recharts**: Chart library for dashboard analytics and progress visualization