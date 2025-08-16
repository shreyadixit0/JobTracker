# Job Tracker Backend API

Production-ready Node.js + Express backend that integrates with Gmail and Outlook to automatically scan job-related emails, extract application status, and update records in the database.

## Features

- 🔐 JWT-based authentication with Supabase
- 📧 Gmail & Outlook integration via OAuth2
- 🤖 Automatic email parsing and application tracking
- 📊 Background job processing with BullMQ + Redis
- ⏰ Scheduled email synchronization
- 🔒 Security hardened with rate limiting, CORS, helmet
- 📚 Complete API documentation with Swagger
- 🧪 Input validation with Zod
- 📝 Comprehensive logging with request IDs

## Tech Stack

- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Queue**: BullMQ with Redis
- **Auth**: JWT + OAuth2 (Google & Microsoft)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Redis** (required for background jobs):
```bash
redis-server
```

4. **Run development server**:
```bash
npm run dev
```

5. **Access API Documentation**:
```
http://localhost:8080/docs
```

## API Endpoints

### Authentication
```bash
# Register new user
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Logout
curl -X POST http://localhost:8080/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Applications
```bash
# Get applications with filters
curl -X GET "http://localhost:8080/applications?status=INTERVIEW&search=engineer&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create application
curl -X POST http://localhost:8080/applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "TechCorp",
    "position": "Software Engineer",
    "status": "APPLIED",
    "dateApplied": "2024-01-15",
    "portal": "LINKEDIN"
  }'

# Update application
curl -X PUT http://localhost:8080/applications/APPLICATION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"INTERVIEW","notes":"Phone screen scheduled"}'

# Delete application
curl -X DELETE http://localhost:8080/applications/APPLICATION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get statistics
curl -X GET http://localhost:8080/applications/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Email Integrations
```bash
# Connect Gmail (redirects to OAuth)
curl -X GET http://localhost:8080/integrations/google/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Trigger manual Gmail sync
curl -X POST http://localhost:8080/integrations/google/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Disconnect Gmail
curl -X DELETE http://localhost:8080/integrations/google \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Connect Outlook (redirects to OAuth)
curl -X GET http://localhost:8080/integrations/microsoft/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Trigger manual Outlook sync
curl -X POST http://localhost:8080/integrations/microsoft/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Disconnect Outlook
curl -X DELETE http://localhost:8080/integrations/microsoft \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Health Check
```bash
curl -X GET http://localhost:8080/health
```

## Configuration

Set up OAuth credentials:

1. **Google OAuth** (Gmail):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth2 credentials
   - Set redirect URI: `http://localhost:8080/integrations/google/callback`
   - Required scopes: `gmail.readonly`, `userinfo.email`, `offline_access`

2. **Microsoft OAuth** (Outlook):
   - Go to [Azure App Registration](https://portal.azure.com)
   - Register new application
   - Set redirect URI: `http://localhost:8080/integrations/microsoft/callback`
   - Required scopes: `Mail.Read`, `offline_access`, `openid`, `email`

## Email Processing

The system automatically:
1. Fetches emails from connected accounts every 6 hours
2. Filters job-related emails using intelligent patterns
3. Extracts company, position, status, and application IDs
4. Matches emails to existing applications or creates new ones
5. Updates application status based on email content

### Supported Email Patterns

- **Job Portals**: LinkedIn, Indeed, Naukri, Glassdoor, Greenhouse, Lever, Workday
- **Status Detection**: Application received, Interview scheduled, Offer extended, Rejection
- **Company Extraction**: From email domains, structured content, and subject lines
- **Position Matching**: Common job titles and structured position fields

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Express    │───▶│   Supabase      │
│   (React)       │    │   Server     │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │   BullMQ     │───▶│     Redis       │
                       │   Workers    │    │     Queue       │
                       └──────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │   Gmail/     │───▶│   Email         │
                       │   Outlook    │    │   Processing    │
                       │   APIs       │    │   & Parsing     │
                       └──────────────┘    └─────────────────┘
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database and Redis URLs
3. Set up proper OAuth redirect URIs for your domain
4. Use environment variables for all secrets
5. Set up monitoring and logging
6. Configure reverse proxy (nginx) for SSL termination

## Security Features

- JWT token authentication
- Rate limiting on sensitive endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod
- Encrypted token storage
- Request ID tracking for debugging

## License

MIT License - see LICENSE file for details