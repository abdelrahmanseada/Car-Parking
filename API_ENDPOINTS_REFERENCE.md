# API Endpoints Reference

This document lists all API endpoints used by the frontend application.

## Base URL
```
Default: http://localhost:3000/api
Configure via: VITE_API_BASE_URL in .env.local
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string?",
    "role": "user|admin"
  },
  "token": "string"
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "user": { /* User object */ },
  "token": "string"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {token}

Response: 200 OK
```

### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer {token}

Response:
{
  "token": "string"
}
```

---

## 👤 User/Profile Endpoints

### Get User Profile
```http
GET /users/{userId}
Authorization: Bearer {token}

Response:
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string?",
  "role": "user|admin"
}
```

### Update User Profile
```http
PUT /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "string?",
  "email": "string?",
  "phone": "string?"
}

Response: User object
```

### Get User Bookings
```http
GET /users/{userId}/bookings
Authorization: Bearer {token}

Response: Booking[]
```

---

## 🚗 Garage Endpoints

### Get All Garages
```http
GET /garages
Authorization: Bearer {token}

Query Parameters:
- lat: number (optional)
- lng: number (optional)
- q: string (search query, optional)
- name: string (search by name, optional)
- filters: string (optional)

Response:
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "image": "string?",
    "rating": number,
    "pricePerHour": number,
    "amenities": ["string"],
    "totalSlots": number,
    "availableSlots": number,
    "location": {
      "lat": number,
      "lng": number,
      "address": "string",
      "city": "string?"
    },
    "floors": Floor[]
  }
]
```

### Get Single Garage
```http
GET /garages/{garageId}
Authorization: Bearer {token}

Response: Garage object (same as above)
```

### Get Garage Floors
```http
GET /garages/{garageId}/floors
Authorization: Bearer {token}

Response:
[
  {
    "id": "string",
    "name": "string",
    "level": number,
    "totalSlots": number,
    "availableSlots": number,
    "layout": Slot[]
  }
]
```

### Get Garage Slots
```http
GET /garages/{garageId}/slots
Authorization: Bearer {token}

Response: Slot[]
```

---

## 🅿️ Parking Slot Endpoints

### Get Slots for Floor
```http
GET /floors/{floorId}/slots
Authorization: Bearer {token}

Response:
[
  {
    "id": "string",
    "number": "string",
    "status": "available|occupied|reserved",
    "level": number,
    "vehicleSize": "compact|standard|large",
    "pricePerHour": number
  }
]
```

### Get Single Slot
```http
GET /garages/{garageId}/slots/{slotId}
Authorization: Bearer {token}

Response: Slot object
```

### Reserve Slot
```http
POST /garages/{garageId}/slots/{slotId}/reserve
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "vehiclePlate": "string?",
  "durationHours": number
}

Response: Booking object
```

### Release Slot
```http
POST /garages/{garageId}/slots/{slotId}/release
Authorization: Bearer {token}

Response: 200 OK
```

---

## 📅 Booking Endpoints

### Create Booking
```http
POST /bookings
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "garageId": "string",
  "slotId": "string",
  "userId": "string",
  "vehiclePlate": "string",
  "totalPrice": number,
  "time": {
    "start": "ISO8601 string",
    "end": "ISO8601 string",
    "durationHours": number
  }
}

Response:
{
  "id": "string",
  "garageId": "string",
  "userId": "string",
  "slotId": "string",
  "status": "pending|confirmed|active|completed|cancelled",
  "totalPrice": number,
  "vehiclePlate": "string",
  "time": {
    "start": "string",
    "end": "string",
    "durationHours": number
  }
}
```

### Get Booking
```http
GET /bookings/{bookingId}
Authorization: Bearer {token}

Response: Booking object
```

### Cancel Booking
```http
PUT /bookings/{bookingId}/cancel
Authorization: Bearer {token}

Response: Booking object (with status: "cancelled")
```

---

## 💳 Payment Endpoints

### Process Payment
```http
POST /payments
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "bookingId": "string",
  "amount": number,
  "method": "card|wallet|cash",
  "status": "pending|paid|failed"
}

Response: PaymentIntent object
```

---

## 📝 Response Formats

The API supports two response formats (both are handled automatically):

### Format 1: Direct Data
```json
{
  "user": {...},
  "token": "..."
}
```

### Format 2: Wrapped Data
```json
{
  "data": {
    "user": {...},
    "token": "..."
  },
  "message": "Success"
}
```

---

## ⚠️ Error Responses

All error responses should follow this format:

```json
{
  "message": "Error description",
  "error": "Error details",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔒 Authentication

All endpoints (except login/register) require authentication via JWT token:

```http
Authorization: Bearer {token}
```

The token is automatically added by the request interceptor from `localStorage`.

---

## ⏱️ Timeouts

Default request timeout: **15 seconds**

To modify, update the axios instance in `src/services/api.ts`:
```typescript
const api = axios.create({
  timeout: 15000, // milliseconds
  // ...
});
```

---

## 🧪 Testing Tips

1. Test authentication flow first (login → token → profile)
2. Verify token is included in subsequent requests
3. Test error scenarios (invalid credentials, missing data)
4. Check CORS headers are properly configured on backend
5. Monitor network requests in browser DevTools
6. Verify response format matches expected structure

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify backend server is running
3. Check CORS configuration
4. Verify request/response formats match
5. Ensure camelCase naming convention is used

