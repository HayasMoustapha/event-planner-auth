# Event Planner Auth Service API Routes Documentation

## Overview

This document provides a comprehensive overview of all available API routes in the Event Planner Auth Service. The service runs on port **3000** and provides complete authentication, authorization, user management, role-based access control (RBAC), and OAuth integration functionality.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most routes require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Public routes (no authentication required):
- Health checks
- Registration endpoints
- Login endpoints
- Password reset endpoints

## Modules

### 1. Health & Status Module

#### Health Operations
- `GET /api/health` - Basic health check (public)
- `GET /api/health/detailed` - Detailed health check (public)
- `GET /api/health/ready` - Readiness probe for Kubernetes
- `GET /api/health/live` - Liveness probe for Kubernetes
- `GET /api/health/authenticated` - Health check with authentication
- `GET /api/health/admin` - Admin health check (requires admin.health.read permission)
- `GET /` - Root endpoint with service info

---

### 2. Registration Module

#### Registration Operations
- `GET /api/auth/check-email/:email` - Check email availability
- `GET /api/auth/check-username/:username` - Check username availability
- `POST /api/auth/register` - Register a new user account
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP code
- `POST /api/auth/login-after-verification` - Login after email verification

#### Request Body (Register)
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33612345678"
}
```

#### Request Body (Verify Email)
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

---

### 3. Authentication Module

#### Authentication Operations
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/login-remember` - Login with remember token
- `POST /api/auth/login-otp` - Login with OTP code
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/validate-token` - Validate JWT token
- `POST /api/auth/logout` - Logout and invalidate tokens
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/me` - Get current user info (alias for profile)
- `POST /api/auth/change-password` - Change user password
- `PUT /api/auth/change-password` - Change user password (PUT version)

#### Request Body (Login)
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

#### Request Body (Refresh Token)
```json
{
  "refreshToken": "refresh_token_here"
}
```

---

### 4. OTP Management Module

#### OTP Operations
- `POST /api/auth/otp/email/generate` - Generate OTP for email
- `POST /api/auth/otp/phone/generate` - Generate OTP for phone
- `POST /api/auth/otp/email/verify` - Verify email OTP
- `POST /api/auth/otp/phone/verify` - Verify phone OTP
- `POST /api/auth/otp/password-reset/generate` - Generate password reset OTP
- `POST /api/auth/forgot-password` - Forgot password (alias)
- `POST /api/auth/otp/password-reset/verify` - Reset password with OTP
- `POST /api/auth/reset-password` - Reset password (alias)
- `GET /api/auth/otp/person/:personId` - Get user OTPs (requires otp.read)
- `POST /api/auth/otp/person/:personId/invalidate` - Invalidate user OTPs (requires otp.manage)
- `GET /api/auth/otp/person/:personId/active` - Check active OTPs (requires otp.read)
- `POST /api/auth/otp/cleanup` - Cleanup expired OTPs (requires otp.manage)
- `GET /api/auth/otp/stats` - Get OTP statistics (requires otp.stats)

#### Request Body (Generate Email OTP)
```json
{
  "email": "user@example.com",
  "purpose": "login"
}
```

#### Request Body (Reset Password)
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePass456!"
}
```

---

### 5. OAuth Integration Module

#### OAuth Operations
- `POST /api/oauth/google` - Google Sign-In authentication
- `POST /api/oauth/apple` - Apple Sign-In authentication
- `POST /api/oauth/google/link` - Link Google account
- `DELETE /api/oauth/google/unlink` - Unlink Google account
- `POST /api/oauth/apple/link` - Link Apple account
- `DELETE /api/oauth/apple/unlink` - Unlink Apple account

#### Request Body (Google Sign-In)
```json
{
  "idToken": "google_id_token_here"
}
```

#### Request Body (Apple Sign-In)
```json
{
  "identityToken": "apple_identity_token_here"
}
```

---

### 6. User Management Module

#### User Operations
- `GET /api/users` - Get users list with pagination
- `GET /api/users/:personId` - Get user details by ID
- `PUT /api/users/:personId` - Update user details
- `DELETE /api/users/:personId` - Delete user account
- `GET /api/users/search` - Search users by name, email, or username

#### Query Parameters (Get Users)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search term (for search endpoint)
- `role` - Filter by role
- `status` - Filter by status

#### Request Body (Update User)
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "+33698765432",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

### 7. Role Management Module

#### Role Operations
- `GET /api/roles` - Get roles list with pagination
- `GET /api/roles/:roleId` - Get role details by ID
- `POST /api/roles` - Create a new role
- `PUT /api/roles/:roleId` - Update role details
- `DELETE /api/roles/:roleId` - Delete a role

#### Request Body (Create Role)
```json
{
  "name": "Event Manager",
  "description": "Can manage events and tickets",
  "permissions": [
    "events.create",
    "events.update",
    "tickets.read",
    "tickets.create"
  ]
}
```

---

### 8. Permission Management Module

#### Permission Operations
- `GET /api/permissions` - Get permissions list with pagination
- `GET /api/permissions/:permissionId` - Get permission details by ID
- `GET /api/permissions/stats` - Get permission statistics
- `GET /api/permissions/group/:groupName` - Get permissions by resource group
- `GET /api/permissions/resources` - Get available resources
- `GET /api/permissions/resources/:resource/actions` - Get actions for a resource
- `GET /api/permissions/role/:roleId` - Get role permissions
- `GET /api/permissions/user/:userId` - Get user permissions
- `GET /api/permissions/user/:userId/check/:permission` - Check user permission
- `POST /api/permissions` - Create a new permission
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission
- `POST /api/permissions/check/any` - Check if user has any of the permissions
- `POST /api/permissions/check/all` - Check if user has all the permissions

#### Query Parameters (Get Permissions)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `resource` - Filter by resource
- `action` - Filter by action

#### Request Body (Create Permission)
```json
{
  "name": "events.manage",
  "resource": "events",
  "action": "manage",
  "description": "Can manage events"
}
```

---

### 9. Dashboard & Metrics Module

#### Dashboard Operations
- `GET /api/dashboard` - Get dashboard data (requires admin.dashboard.read)
- `GET /api/dashboard/api/data` - Get dashboard API data (requires admin.dashboard.read)
- `GET /api/dashboard/api/security-alerts` - Get security alerts (requires admin.security.read)
- `GET /api/dashboard/api/realtime` - Get real-time metrics (requires admin.dashboard.read)

#### Metrics Operations
- `GET /api/metrics` - Get service metrics (public for monitoring)
- `GET /api/metrics/info` - Get metrics info (requires admin.metrics.read)
- `POST /api/metrics/reset` - Reset metrics (requires admin.metrics.reset)

---

### 10. Session Management Module

#### Session Operations
- `GET /api/sessions` - Get active sessions
- `GET /api/sessions/:sessionId` - Get session details
- `DELETE /api/sessions/:sessionId` - Revoke session
- `POST /api/sessions/cleanup` - Cleanup expired sessions
- `GET /api/sessions/stats` - Get session statistics

---

### 11. Access Control Module

#### Access Operations
- `GET /api/accesses` - Get access logs
- `GET /api/accesses/:accessId` - Get access log details
- `POST /api/accesses` - Log access attempt
- `GET /api/accesses/stats` - Get access statistics

---

### 12. Menu Management Module

#### Menu Operations
- `GET /api/menus` - Get menu structure
- `GET /api/menus/:menuId` - Get menu details
- `POST /api/menus` - Create menu
- `PUT /api/menus/:menuId` - Update menu
- `DELETE /api/menus/:menuId` - Delete menu

---

### 13. System Module

#### System Operations
- `GET /api/system/info` - Get system information
- `GET /api/system/config` - Get system configuration
- `POST /api/system/maintenance` - Toggle maintenance mode
- `GET /api/system/logs` - Get system logs

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

## Success Responses

Most endpoints return consistent success responses:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

## JWT Token Structure

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "testuser",
  "roles": ["user"],
  "permissions": ["events.read"],
  "iat": 1640995200,
  "exp": 1641005200
}
```

## OTP Flow

1. **Generate OTP**: `POST /api/auth/otp/email/generate`
2. **Send OTP**: OTP is sent via email/SMS
3. **Verify OTP**: `POST /api/auth/otp/email/verify`
4. **Complete Action**: Login, registration, or password reset

## OAuth Integration Flow

### Google Sign-In
1. Client gets Google ID token from Google Sign-In
2. Send token to `POST /api/oauth/google`
3. Server validates token and creates/updates user account
4. Return JWT token for authenticated session

### Apple Sign-In
1. Client gets identity token from Apple Sign-In
2. Send token to `POST /api/oauth/apple`
3. Server validates token and creates/updates user account
4. Return JWT token for authenticated session

## Rate Limiting

API endpoints may be rate limited. Check response headers for rate limit information.

## Permissions

All protected endpoints require specific permissions. Permission format: `resource.action` (e.g., `users.read`, `roles.create`, `admin.dashboard.read`).

## RBAC System

The service implements a complete Role-Based Access Control (RBAC) system:
- **Users**: Can be assigned multiple roles
- **Roles**: Contain sets of permissions
- **Permissions**: Define access to specific resources and actions
- **Resources**: System entities (users, roles, events, etc.)
- **Actions**: CRUD operations (create, read, update, delete, manage)

## Security Features

- JWT-based authentication
- OTP-based verification
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Account lockout after failed attempts
- Session management
- Access logging and monitoring
- Input validation and sanitization
- CORS configuration
- Security headers

## Postman Collection

A complete Postman collection with all essential routes is available in:
- `postman/collections/Event-Planner-Auth-API.postman_collection.json`

## Environment Variables

Required environment variables are defined in:
- `postman/environments/Event-Planner-Auth-Environment.postman_environment.json`

---

**Last Updated:** January 27, 2026  
**Version:** 3.0.0  
**Total Routes:** 273+ (Collection covers essential routes)
