## Backend API Documentation (For Frontend)

### Base URL

- **Local development**: `http://localhost:{PORT}`  
  - `{PORT}` is taken from `process.env.PORT` in the backend.

All routes below are prefixed with this base URL.

---

## Authentication & Users

All user-related routes are mounted under the `/users` prefix (`src/index.js`).

### POST `/users/signup`

- **Description**: Create a new user account and send a confirmation OTP via email.
- **Rate limiting**: Protected by `authLimiter` (too many requests will return HTTP 429).
- **Validation**: Request body is validated by `SignUpSchema` (Joi).

#### Request

- **Method**: `POST`
- **URL**: `/users/signup`
- **Headers**:
  - `Content-Type: application/json`
- **Body (JSON)**:

```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "StrongP@ssw0rd",
  "confirmPassword": "StrongP@ssw0rd",
  "dateOfBirth": "1990-01-01",
  "gender": "MALE",
  "phoneNumber": "+201234567890"
}
```

- **Field notes**:
  - `firstname`: string, alphanumeric, 3–20 chars, required.
  - `lastname`: string, alphanumeric, 3–20 chars, required.
  - `email`: valid email, required, must be unique for provider `LOCAL`.
  - `password`: must follow `generalRules.password` (check backend rule; typically strong password).
  - `confirmPassword`: must match `password`.
  - `dateOfBirth`: ISO date string, must be before now, required.
  - `gender`: optional, one of values from `GenderEnum` (e.g. `MALE`, `FEMALE`, etc.).
  - `phoneNumber`: string, required; will be encrypted on the backend.

#### Responses

- **201 Created**

```json
{
  "message": "User created successfully",
  "user": {
    "_id": "643c1f...",
    "firstname": "john",
    "lastname": "doe",
    "email": "john.doe@example.com",
    "gender": "MALE",
    "phoneNumber": "ENCRYPTED_VALUE",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "isConfirmed": false,
    "role": "USER",
    "provider": "LOCAL",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z",
    // other Mongoose fields and virtuals
  }
}
```

- **409 Conflict**

```json
{
  "message": "User already exists"
}
```

- **400 Bad Request** (validation error from `validationMiddleware`)

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "firstname",
      "message": "First name must be at least 3 characters long"
    }
  ]
}
```
            
---

### POST `/users/signin`

- **Description**: Log in an existing user and return an access token and refresh token.
- **Rate limiting**: Protected by `authLimiter` (too many attempts will return HTTP 429).

#### Request

- **Method**: `POST`
- **URL**: `/users/signin`
- **Headers**:
  - `Content-Type: application/json`
- **Body (JSON)**:

```json
{
  "email": "john.doe@example.com",
  "password": "StrongP@ssw0rd"
}
```

#### Responses

- **200 OK**

```json
{
  "message": "User signed in successfully",
  "accesstoken": "JWT_ACCESS_TOKEN_HERE",
  "refreshtoken": "JWT_REFRESH_TOKEN_HERE"
}
```

- **404 Not Found** (invalid email or password)

```json
{
  "message": "Invalid email or password "
}
```

---

## Authentication Details (Tokens)

- **Access token**:
  - Returned as `accesstoken` from `/users/signin`.
  - Signed with `process.env.JWT_ACCESS_SECRET`.
  - Contains at least: `{ "_id": user._id, "email": user.email }`.
  - Expires according to `process.env.JWT_ACCESS_EXPIRES_IN`.
- **Refresh token**:
  - Returned as `refreshtoken` from `/users/signin`.
  - Signed with `process.env.JWT_REFRESH_SECRET`.
  - Expires according to `process.env.JWT_REFRESH_EXPIRES_IN`.

### Using tokens from the frontend

Unless specified otherwise in new routes:

- Send the access token in the `accesstoken` header for protected endpoints, e.g.:

```http
GET /some/protected/route HTTP/1.1
Host: localhost:{PORT}
accesstoken: JWT_ACCESS_TOKEN_HERE
Content-Type: application/json
```

If additional protected routes are added in the future, they should follow this convention.

---

## Rate Limiting Behavior

- **General limiter** (`generalLimiter`):
  - Applied globally to all routes.
  - If the client exceeds the allowed limit, backend will return **429 Too Many Requests** with:

```json
{
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

- **Auth limiter** (`authLimiter`):
  - Applied specifically to `/users/signup` and `/users/signin`.

---

## Error Handling

- Any unexpected server error will return a JSON response similar to:

```json
{
  "message": "something broke!",
  "error": "Error message here",
  "stack": "Stack trace (development only)"
}
```

Frontend should:

- Check the HTTP status code.
- Use the `message` field for user-friendly error toasts/messages where appropriate.

