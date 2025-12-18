# Location-Restricted Attendance Link System

## Overview

The attendance link system allows managers to create location-restricted check-in links that employees can use to check in. Links are tied to specific GPS coordinates and only work when employees are within the allowed radius.

## Features

### For Managers:

1. **Create Check-In Links**
   - Set target location (GPS coordinates)
   - Configure allowed radius (default: 50 meters)
   - Set expiration date/time
   - Optional: Max uses limit
   - Optional: Auto-generate daily

2. **Link Management**
   - View all created links
   - Copy links to share with employees
   - Generate QR codes (coming soon)
   - Track usage statistics
   - Deactivate/activate links

3. **Location Options**
   - Use pre-configured office locations
   - Or set custom GPS coordinates

### For Employees:

1. **Check-In via Link**
   - Open the link provided by manager
   - System verifies location automatically
   - Must be within allowed radius
   - Photo capture required
   - One check-in per link per day

2. **Security Features**
   - Location verification (GPS)
   - Photo capture
   - Device fingerprinting
   - IP address tracking
   - Link expiration
   - Usage limits

## How It Works

### 1. Manager Creates Link

```
Manager → Attendance Links → Create New Link
- Select office location OR enter custom coordinates
- Set allowed radius (e.g., 50 meters)
- Set expiration date/time
- Optional: Max uses, auto-generate daily
- Generate unique link code
```

### 2. Manager Shares Link

```
Manager gets: https://yourdomain.com/attendance/check-in/ABC123XY
- Can copy link
- Can generate QR code (future feature)
- Share via email, SMS, or display at office
```

### 3. Employee Uses Link

```
Employee opens link → System checks:
1. Link is valid and not expired
2. Employee is authenticated
3. Employee is within allowed radius
4. Employee hasn't used this link today
5. Photo capture
6. Check-in recorded
```

## Database Schema

### `attendance_links` Table

- `link_code`: Unique 8-character code
- `target_latitude/longitude`: Required check-in location
- `allowed_radius_meters`: Maximum distance allowed
- `valid_from/valid_until`: Link validity period
- `max_uses`: Optional usage limit
- `current_uses`: Track how many times used
- `auto_generate_daily`: Auto-create new link each day

### `attendance_link_usage` Table

- Tracks which employees used which links
- Prevents duplicate check-ins per day
- Records location where link was used
- Links to attendance record

## API Endpoints

### Manager Endpoints:

- `POST /api/employer/attendance-links` - Create new link
- `GET /api/employer/attendance-links` - List all links
- `GET /api/employer/office-locations` - Get office locations

### Employee Endpoints:

- `GET /api/attendance/check-in/[code]` - Validate link and get check-in page
- `POST /api/attendance/check-in/[code]` - Process check-in

## Usage Examples

### Create Daily Office Check-In Link

```typescript
POST /api/employer/attendance-links
{
  "title": "Main Office - Daily Check-In",
  "office_location_id": "office-uuid",
  "allowed_radius_meters": 50,
  "valid_until": "2025-01-12T18:00:00Z",
  "auto_generate_daily": true
}
```

### Create Custom Location Link

```typescript
POST /api/employer/attendance-links
{
  "title": "Client Site Check-In",
  "target_latitude": 24.7136,
  "target_longitude": 46.6753,
  "allowed_radius_meters": 100,
  "valid_until": "2025-01-11T17:00:00Z",
  "max_uses": 10
}
```

## Security Features

1. **Location Verification**: Must be within radius
2. **Link Expiration**: Time-based validity
3. **Usage Limits**: Optional max uses per link
4. **One Per Day**: Employee can only use link once per day
5. **Photo Required**: Selfie verification
6. **Device Tracking**: Device fingerprinting
7. **IP Logging**: IP address recorded

## Benefits

✅ **Prevents Remote Check-Ins**: Employees must be at location
✅ **Easy to Share**: Simple link or QR code
✅ **Flexible**: Custom locations or office locations
✅ **Trackable**: See who used which link
✅ **Time-Limited**: Links expire automatically
✅ **Daily Auto-Generation**: Set once, works daily

## Setup Instructions

1. **Run Migrations**:
   ```bash
   # Apply the attendance links migration
   supabase migration up
   ```

2. **Configure Office Locations**:
   - Add office locations via SQL or Dashboard
   - Or use custom coordinates when creating links

3. **Access Manager Dashboard**:
   - Navigate to: `/en/employer/attendance-links`
   - Or: HR Management → Attendance Links

4. **Create Your First Link**:
   - Click "Create New Link"
   - Select location or enter coordinates
   - Set expiration and radius
   - Copy and share the link

## Best Practices

1. **Radius Settings**:
   - Office building: 30-50 meters
   - Large campus: 100-200 meters
   - Outdoor site: 150-300 meters

2. **Link Expiration**:
   - Daily links: Expire at end of workday
   - Event links: Expire after event ends
   - Temporary links: Short validity (few hours)

3. **Auto-Generate Daily**:
   - Use for regular office check-ins
   - System creates new link each day automatically
   - Saves manager time

4. **Sharing Methods**:
   - Email to employees
   - SMS/WhatsApp
   - Display QR code at office entrance
   - Post in company chat/portal

