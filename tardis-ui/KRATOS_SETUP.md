# Kratos Authentication Setup Guide

This application now supports **ORY Kratos** authentication with graceful fallback to JWT tokens for development.

## 🔧 **Architecture Overview**

The auth system works in this priority order:
1. **Kratos Session Authentication** (production-ready)
2. **JWT Token Fallback** (development/testing)

## 🚀 **Quick Start**

### 1. **Environment Variables**

Update your `.env` file:

```bash
# API Configuration
VITE_API_URL=http://localhost:8000

# Kratos Authentication
VITE_KRATOS_PUBLIC_URL=http://localhost:4433
VITE_KRATOS_BROWSER_URL=http://localhost:4433

# Environment
VITE_NODE_ENV=development
```

### 2. **Start Kratos (if available)**

If you have Kratos running:
```bash
cd media-uploader
docker-compose up kratos postgres
```

### 3. **Frontend Development**

The frontend will automatically:
- Try Kratos authentication first
- Fall back to JWT tokens if Kratos is unavailable
- Show appropriate error messages
- Handle session management

## 🔐 **Authentication Flow**

### **With Kratos (Production)**
1. User visits login page
2. Frontend initializes Kratos login flow
3. User submits credentials to Kratos
4. Kratos validates and creates session
5. Frontend gets user profile from backend using Kratos session
6. Session stored in secure HTTP-only cookies

### **Without Kratos (Development)**
1. User visits login page
2. Frontend sends credentials directly to backend
3. Backend returns JWT token
4. Token stored in localStorage
5. Token sent with API requests

## 🛠 **Backend Integration**

The backend `KratosAuthMiddleware` handles:
- Kratos session validation via `/sessions/whoami`
- JWT token fallback for development
- User creation from Kratos identity
- Session management

## 📱 **Frontend Features**

### **Enhanced UserContext**
```typescript
const { 
  user, 
  login, 
  register, 
  logout, 
  demoLogin,     // New: Demo login for testing
  refreshUser    // New: Refresh user session
} = useUser()
```

### **Kratos Service**
```typescript
import { kratosAuthService } from '../services/kratos-auth'

// Check authentication (Kratos + JWT fallback)
const { session, user } = await kratosAuthService.checkAuthentication()

// Login with Kratos flows
await kratosAuthService.login({ email, password })

// Demo login for development
await kratosAuthService.demoLogin('student') // or 'teacher'
```

## 🔍 **Development vs Production**

### **Development Mode**
- JWT tokens in localStorage
- Direct API auth endpoints
- Demo login available
- Less secure but easier to debug

### **Production Mode**
- Kratos session management
- HTTP-only secure cookies
- Full OAuth/SAML support possible
- Production-grade security

## 🐛 **Troubleshooting**

### **Kratos Not Available**
✅ **Expected behavior**: Frontend falls back to JWT auth automatically

### **CORS Issues**
Add your frontend URL to Kratos config:
```yaml
# media-uploader/config/kratos/kratos.yml
serve:
  public:
    cors:
      allowed_origins:
        - http://localhost:3000
        - http://localhost:5173  # Add your dev server port
```

### **Session Issues**
```bash
# Clear all auth state
localStorage.clear()
# Clear cookies in browser dev tools
```

### **Backend Connection**
Check if backend is running:
```bash
curl http://localhost:8000/health
```

## 🔧 **API Endpoints**

### **Kratos Endpoints**
- `GET /sessions/whoami` - Check current session
- `GET /self-service/login/api` - Initialize login flow
- `POST /self-service/login` - Submit login
- `GET /self-service/registration/api` - Initialize registration
- `POST /self-service/registration` - Submit registration

### **Backend Auth Endpoints**
- `POST /v2/auth/login` - JWT login
- `POST /v2/auth/register` - JWT registration
- `GET /v2/auth/profile` - Get user profile
- `POST /v2/auth/demo-login` - Demo student login
- `POST /v2/auth/demo-teacher-login` - Demo teacher login

## 📝 **Migration Notes**

### **From Old Auth System**
1. Update imports:
   ```typescript
   // Old
   import { authService } from '../services/auth'
   
   // New
   import { kratosAuthService } from '../services/kratos-auth'
   ```

2. Enhanced error handling:
   ```typescript
   try {
     await login(email, password)
   } catch (error) {
     // More specific error messages from Kratos
     setError(error.message)
   }
   ```

3. Session persistence:
   ```typescript
   // Sessions now persist across browser restarts
   // No need to manually manage tokens
   ```

## 🎯 **Next Steps**

1. **Configure Kratos for production**:
   - Set up email verification
   - Configure password policies
   - Add OAuth providers (Google, GitHub, etc.)

2. **Enhanced security**:
   - Multi-factor authentication
   - Account recovery flows
   - Device management

3. **User management**:
   - Admin dashboard for user management
   - Role-based permissions
   - Organization management

## 🔗 **Useful Links**

- [ORY Kratos Documentation](https://www.ory.sh/docs/kratos/)
- [Kratos Self-Service Flows](https://www.ory.sh/docs/kratos/self-service)
- [Kratos Configuration](https://www.ory.sh/docs/kratos/reference/configuration)

---

The authentication system is now production-ready with Kratos while maintaining development-friendly JWT fallback! 🚀