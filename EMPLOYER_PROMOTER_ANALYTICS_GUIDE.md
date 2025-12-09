# Employer-Promoter Analytics Feature

## Overview

The Employer-Promoter Analytics feature provides comprehensive insights into promoter assignments across all employers in the system. This powerful analytics dashboard helps you:

- View all employers and their assigned promoters
- See detailed promoter information including contact details
- View ID card and passport images for each promoter
- Track document expiry dates
- Monitor promoter distribution across employers

## Features

### 📊 Summary Statistics

The dashboard displays key metrics at a glance:

- **Total Employers**: Count of all employer organizations
- **Total Promoters**: Total number of promoters in the system
- **Average Promoters/Employer**: Average distribution ratio

### 🏢 Employer Details

For each employer, you can view:

- Company name (English and Arabic)
- Commercial Registration Number (CRN)
- Contact information (email, phone)
- Status and verification details
- Number of assigned promoters

### 👥 Promoter Information

Each promoter card displays:

#### Personal Details

- Full name (English and Arabic)
- Email address
- Phone/mobile number
- Nationality
- Current status

#### Document Information

- ID card number and expiry date
- Passport number and expiry date
- **ID Card Image** (clickable to view full size)
- **Passport Image** (clickable to view full size)

#### Professional Details

- Job title
- Work location (if applicable)
- Assigned employer

## How to Access

1. Navigate to `/analytics/employer-promoters` in your browser
2. Or click on "Employer Analytics" from the main analytics menu

## How Promoters Are Linked to Employers

The system determines employer-promoter relationships through:

1. **Direct Assignment**: Promoters with `employer_id` field set
2. **Contract Association**: Promoters linked through contracts where the employer is either:
   - The `employer_id` in the contract
   - The `first_party_id` in the contract

## Document Images

### Viewing Documents

- Click on any ID card or passport image to view it in full size in a new tab
- Images are hosted on Supabase Storage for secure, fast access
- Missing documents are clearly indicated with placeholder graphics

### Document Security

- All document images are served through secure URLs
- Access is controlled through Row Level Security (RLS) policies
- Images can only be accessed by authorized users

## API Endpoint

The feature uses an optimized API endpoint for better performance:

```
GET /api/analytics/employer-promoters
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "employers": [
      {
        "id": "...",
        "name_en": "...",
        "name_ar": "...",
        "promoters": [...],
        "promoterCount": 5
      }
    ],
    "summary": {
      "totalEmployers": 18,
      "totalPromoters": 85,
      "avgPromotersPerEmployer": 4.7
    }
  }
}
```

## Technical Details

### File Structure

```
app/
├── [locale]/
│   └── analytics/
│       └── employer-promoters/
│           ├── page.tsx         # Main analytics page
│           ├── loading.tsx      # Loading state
│           └── error.tsx        # Error handling
└── api/
    └── analytics/
        └── employer-promoters/
            └── route.ts         # API endpoint
```

### Components Used

- **Accordion**: Collapsible employer sections
- **Card**: Content containers
- **Badge**: Status indicators
- **Avatar**: Profile pictures/initials
- **Image (Next.js)**: Optimized document images

### Icons

- 🏢 Building2 - Employer information
- 👥 Users - Promoter counts
- 📧 Mail - Email addresses
- 📞 Phone - Contact numbers
- 💳 CreditCard - ID cards
- 📖 BookOpen - Passports
- 📅 Calendar - Expiry dates
- 📄 FileText - Job titles

## Performance Optimizations

1. **API-First Approach**: Data is fetched through a dedicated API endpoint
2. **Efficient Queries**: Single batch fetch of all data, processed server-side
3. **Client Fallback**: Direct Supabase queries if API is unavailable
4. **Image Optimization**: Next.js Image component for optimized loading
5. **Lazy Loading**: Accordion only renders expanded sections

## Error Handling

The feature includes comprehensive error handling:

- **Loading States**: Spinner with informative message
- **Error Boundaries**: Graceful error display with retry option
- **Fallback Queries**: Automatic fallback to direct database queries
- **Missing Data**: Clear indicators for missing information

## Future Enhancements

Potential improvements for future versions:

- [ ] Export employer-promoter data to Excel/PDF
- [ ] Filter by employer status or location
- [ ] Search functionality for specific promoters
- [ ] Document expiry alerts and notifications
- [ ] Bulk document upload interface
- [ ] Historical tracking of promoter assignments
- [ ] Performance metrics per employer
- [ ] Contract value summaries

## Troubleshooting

### No Data Showing

**Solution**: Check that:

1. Employers exist in the parties table with `type='Employer'`
2. Promoters have valid `employer_id` references or contract associations
3. Database RLS policies allow reading promoters and parties

### Images Not Loading

**Solution**: Verify that:

1. Image URLs are valid and accessible
2. Supabase Storage bucket has correct permissions
3. Images were uploaded to the correct storage path
4. Network connectivity to Supabase is working

### Slow Loading

**Solution**:

1. Check database indexes on `promoters.employer_id` and `contracts` foreign keys
2. Verify API endpoint is responding quickly
3. Consider implementing pagination for large datasets
4. Check network latency to database

## Related Documentation

- [Promoter Management Guide](./COMPLETE_PROMOTER_IMPLEMENTATION_GUIDE.md)
- [Contract System Documentation](./GENERAL_CONTRACT_SYSTEM.md)
- [Analytics Dashboard](./ANALYTICS_DASHBOARD_COMPLETE.md)

## Support

For issues or questions, please:

1. Check the console for error messages
2. Verify database connectivity
3. Review RLS policies for promoters and parties tables
4. Contact your system administrator

---

**Version**: 1.0.0  
**Last Updated**: October 26, 2025  
**Author**: Contract Management System Team
