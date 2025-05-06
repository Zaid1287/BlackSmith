# Architecture Overview

## 1. Overview

BlackSmith Traders is a logistics management application designed to track vehicle journeys, manage expenses, and handle financial data for a logistics/transportation business. The system allows administrators to oversee operations while drivers can manage their assigned journeys and track expenses.

The application follows a modern full-stack architecture with a clear separation between client and server components. It uses React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence.

## 2. System Architecture

The system follows a client-server architecture with the following high-level components:

### Frontend Architecture
- React-based SPA (Single Page Application)
- TypeScript for type safety
- React Query for server state management
- React Hook Form for form handling
- Shadcn UI component library with Tailwind CSS for styling
- Recharts for data visualization

### Backend Architecture
- Express.js server written in TypeScript
- RESTful API endpoints
- Session-based authentication
- PostgreSQL database with Drizzle ORM
- Serverless database access via Neon Database

### Data Flow
1. Client applications interact with the server via RESTful API endpoints
2. Authentication is managed via sessions stored in PostgreSQL
3. Server processes requests, performs business logic, and interacts with the database
4. Data is returned to the client as JSON
5. Client updates UI based on the returned data

## 3. Key Components

### Client Components

#### User Interface
- Shadcn UI components with Tailwind CSS
- Responsive design for both admin and driver interfaces
- Light/dark theme support

#### State Management
- React Query for server state (data fetching, caching, synchronization)
- React Context for global UI state (auth, locale)
- Local component state for UI-specific state

#### Routing
- Wouter for lightweight client-side routing
- Protected routes based on user authentication and role

#### Forms
- React Hook Form for form state management
- Zod for schema validation
- Custom form components for consistent UX

### Server Components

#### API Layer
- Express.js routes organized by domain
- REST API endpoints
- JSON request/response format
- Error handling middleware

#### Authentication
- Passport.js for authentication strategy
- Session-based authentication stored in PostgreSQL
- Password hashing with scrypt for security
- Role-based access control (admin vs. driver)

#### Database Access
- Drizzle ORM for typesafe database access
- Transaction support
- PostgreSQL-specific features (connection pooling)

#### Business Logic
- Journey management
- Expense tracking
- Milestone generation
- Financial calculations

### Database Schema

The database schema follows a relational design with these key entities:

1. **Users** - System users (drivers and admins)
2. **Vehicles** - Vehicles managed by the company
3. **Journeys** - Transportation journeys from origin to destination
4. **Expenses** - Expenses associated with journeys
5. **Milestones** - Key events in a journey's lifecycle
6. **LocationHistory** - Track vehicle location over time
7. **JourneyPhotos** - Photos associated with journeys
8. **Salaries** - Driver salary information
9. **SalaryHistory** - Record of salary adjustments

## 4. Data Flow

### Authentication Flow
1. User submits credentials
2. Server validates credentials against stored password hash
3. On success, a session is created and stored in the session database
4. Session ID is sent to client via cookie
5. Subsequent requests include the session cookie for authentication

### Journey Management Flow
1. Admin creates a journey with an assigned driver and vehicle
2. Driver receives journey notification
3. Driver starts journey and logs expenses throughout
4. Admin monitors journey progress in real-time
5. Driver completes journey
6. Admin reviews financial data and journey details

### Expense Tracking Flow
1. Driver logs expenses during journey
2. Expenses are categorized by type (fuel, toll, food, etc.)
3. Financial calculations are performed in real-time
4. Admin can review expenses and working balance
5. Reports can be exported for accounting purposes

### Real-time Updates
1. Client periodically polls the server for updated data
2. React Query manages refetching and caching strategy
3. UI updates to reflect the latest data

## 5. External Dependencies

### Frontend Dependencies
- React - UI library
- Tailwind CSS - Utility-first CSS framework
- React Query - Data fetching and caching
- React Hook Form - Form state management
- Zod - Schema validation
- Shadcn UI - Component library
- Lucide React - Icon library
- Recharts - Charting library
- Date-fns - Date manipulation
- XLSX - Excel export

### Backend Dependencies
- Express - Web server framework
- Passport - Authentication middleware
- Drizzle ORM - Database ORM
- PostgreSQL - Database
- Neon Database - Serverless PostgreSQL provider
- Crypto - Cryptographic functions for password hashing
- SendGrid - Email service (integration present but not fully implemented)

### External Services
- Google Maps API - For location services and mapping
- PostgreSQL (likely hosted on Neon Database)

## 6. Deployment Strategy

The application is configured for deployment on Replit, with the following considerations:

### Build Process
1. Frontend is built using Vite
2. Backend is bundled using esbuild
3. Static assets are served by the Express server

### Environment Configuration
- Environment variables for database connection, API keys, etc.
- Production vs. development mode configuration

### Database
- PostgreSQL database (likely hosted on Neon Database)
- Connection pooling for efficient database access

### Performance Optimization
- Client-side caching with React Query
- Server optimization with proper middleware ordering
- Production builds with minification and tree-shaking

### Security Considerations
- Session-based authentication
- HTTPS (in production)
- Password hashing with cryptographically secure algorithms
- Proper error handling to prevent information leakage

## 7. Development Architecture

### Local Development
- Vite dev server for fast refresh
- TypeScript for type checking
- ESLint for code quality
- Shared types between frontend and backend

### Project Structure
- `/client` - Frontend React application
- `/server` - Backend Express application
- `/shared` - Shared code (schema, types)
- `/scripts` - Utility scripts
- `/migrations` - Database migrations

## 8. Future Considerations

### Scalability
- The current architecture can be extended to support more users and journeys
- Database indexing strategies may need refinement for larger datasets
- Consider moving to a more robust state management solution for complex UI states

### Features
- Real-time updates could be improved with WebSockets instead of polling
- Mobile app integration for better driver experience
- Advanced analytics for business intelligence

### Maintenance
- Comprehensive test coverage would improve reliability
- API documentation would facilitate integration
- Monitoring and logging infrastructure would enhance operations