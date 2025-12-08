# Required API Endpoints for Enhanced Promoters View

This document outlines the API endpoints that need to be implemented for the Enhanced Promoters View component to function fully.

## Overview

The component requires three main API endpoints:

1. **GET /api/promoters** - Fetch list of promoters with pagination
2. **PUT /api/promoters/:id/archive** - Archive a promoter record
3. **POST /api/promoters/:id/notify** - Send notification to a promoter

---

## 1. GET /api/promoters

### Purpose

Fetch paginated list of promoters with all necessary details for display.

### Query Parameters

- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 50) - Records per page
- `_t` (timestamp, optional) - Cache-busting parameter

### Request Example

```bash
GET /api/promoters?page=1&limit=50&_t=1705334400000
Content-Type: application/json
Authorization: Bearer {token}
```

### Response Format

```json
{
  "success": true,
  "promoters": [
    {
      "id": "uuid-123",
      "name_en": "John Doe",
      "name_ar": "جون دو",
      "email": "john@example.com",
      "mobile_number": "+1234567890",
      "phone": "+0987654321",
      "status": "active",
      "employer_id": "employer-123",
      "job_title": "Sales Manager",
      "work_location": "New York",
      "profile_picture_url": "https://...",
      "id_card_expiry_date": "2025-12-31",
      "passport_expiry_date": "2026-06-30",
      "created_at": "2024-01-15T10:30:00Z",
      "parties": {
        "name_en": "Company Name",
        "name_ar": "اسم الشركة"
      }
    }
    // ... more promoters
  ],
  "count": 50,
  "total": 250,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Response Codes

- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No permission
- `500 Internal Server Error` - Server error

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

---

## 2. PUT /api/promoters/:id/archive

### Purpose

Archive a promoter record (soft delete). The record should be hidden from active lists but not permanently deleted.

### URL Parameters

- `id` (string, required) - Promoter UUID

### Request Example

```bash
PUT /api/promoters/uuid-123/archive
Content-Type: application/json
Authorization: Bearer {token}

{
  "archived": true
}
```

### Response Format - Success

```json
{
  "success": true,
  "message": "Promoter archived successfully",
  "promoter": {
    "id": "uuid-123",
    "name_en": "John Doe",
    "archived": true,
    "archived_at": "2024-01-15T10:30:00Z"
  }
}
```

### Response Codes

- `200 OK` - Successfully archived
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No permission
- `404 Not Found` - Promoter not found
- `500 Internal Server Error` - Server error

### Error Response

```json
{
  "success": false,
  "error": "Could not archive record",
  "details": "Record is already archived or in use"
}
```

---

## 3. POST /api/promoters/:id/notify

### Purpose

Send a notification to a promoter via email, SMS, or both. Different notification types can be sent based on the context.

### URL Parameters

- `id` (string, required) - Promoter UUID

### Request Body

```json
{
  "type": "standard|urgent|reminder",
  "promoterName": "John Doe",
  "email": "john@example.com",
  "channel": "email|sms|both",
  "subject": "Document Renewal Reminder",
  "message": "Custom message (optional)"
}
```

### Notification Types

- **standard** - Regular notification
- **urgent** - High priority notification (for critical issues)
- **reminder** - Reminder for document renewal

### Request Example

```bash
POST /api/promoters/uuid-123/notify
Content-Type: application/json
Authorization: Bearer {token}

{
  "type": "reminder",
  "promoterName": "John Doe",
  "email": "john@example.com",
  "channel": "email"
}
```

### Response Format - Success

```json
{
  "success": true,
  "message": "Notification sent successfully",
  "notification": {
    "id": "notify-123",
    "type": "reminder",
    "channel": "email",
    "status": "sent",
    "sent_at": "2024-01-15T10:30:00Z",
    "promoter_id": "uuid-123",
    "recipient": "john@example.com"
  }
}
```

### Response Codes

- `200 OK` - Notification sent successfully
- `202 Accepted` - Notification queued for sending
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No permission
- `404 Not Found` - Promoter not found
- `500 Internal Server Error` - Server error

### Error Response

```json
{
  "success": false,
  "error": "Failed to send notification",
  "details": "Email service unavailable",
  "retry": true
}
```

---

## Implementation Checklist

- [ ] GET /api/promoters endpoint implemented
- [ ] PUT /api/promoters/:id/archive endpoint implemented
- [ ] POST /api/promoters/:id/notify endpoint implemented
- [ ] All endpoints return correct response format
- [ ] All endpoints handle errors properly
- [ ] Authentication/Authorization checks in place
- [ ] Rate limiting implemented (optional but recommended)
- [ ] Logging implemented for audit trail
- [ ] Validation of input data
- [ ] Database queries optimized
- [ ] API documentation complete

---

## Example Implementation (Node.js/Express)

### GET /api/promoters

```typescript
router.get('/api/promoters', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  try {
    const offset = (page - 1) * limit;
    const [promoters, total] = await Promise.all([
      db.promoters.findMany({
        skip: offset,
        take: limit,
        include: { parties: true },
      }),
      db.promoters.count(),
    ]);

    res.json({
      success: true,
      promoters,
      count: promoters.length,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### PUT /api/promoters/:id/archive

```typescript
router.put('/api/promoters/:id/archive', async (req, res) => {
  const { id } = req.params;

  try {
    const promoter = await db.promoters.update({
      where: { id },
      data: {
        archived: true,
        archived_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Promoter archived successfully',
      promoter,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### POST /api/promoters/:id/notify

```typescript
router.post('/api/promoters/:id/notify', async (req, res) => {
  const { id } = req.params;
  const { type, promoterName, email, channel = 'email' } = req.body;

  try {
    // Send notification based on channel
    if (channel === 'email' || channel === 'both') {
      await sendEmail({
        to: email,
        subject: `Promoter Notification - ${type}`,
        template: `notification-${type}`,
      });
    }

    // Log notification
    const notification = await db.notifications.create({
      data: {
        promoter_id: id,
        type,
        channel,
        status: 'sent',
        recipient: email,
      },
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Testing

### cURL Examples

**Fetch Promoters:**

```bash
curl -X GET "http://localhost:3000/api/promoters?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Archive Promoter:**

```bash
curl -X PUT "http://localhost:3000/api/promoters/uuid-123/archive" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"archived": true}'
```

**Send Notification:**

```bash
curl -X POST "http://localhost:3000/api/promoters/uuid-123/notify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reminder",
    "promoterName": "John Doe",
    "email": "john@example.com",
    "channel": "email"
  }'
```

---

## Notes

- All endpoints require authentication
- Use UUIDs for promoter IDs (not incremental integers)
- Timestamps should be in ISO 8601 format
- Include proper error handling and validation
- Log all operations for audit trail
- Consider rate limiting for production
- Implement caching for GET endpoints
- Use database transactions for critical operations

---

## Troubleshooting

### 404 Not Found

- Check promoter ID exists
- Verify ID format (should be UUID)

### 401/403 Unauthorized

- Check authentication token
- Verify user permissions
- Check API key in headers

### 500 Internal Server Error

- Check server logs
- Verify database connectivity
- Check service dependencies (email, SMS services)

---

## Version

Last Updated: January 2024
API Version: v1.0
