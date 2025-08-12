# Excel Import Feature Documentation

## Overview

The Excel Import feature allows users to bulk import promoter data from Excel files (.xlsx, .xls) or CSV files into the Contract Management System. This feature provides a user-friendly interface with data validation, preview capabilities, and detailed import results.

## Features

### ✅ **Core Functionality**

- **File Upload**: Support for Excel (.xlsx, .xls) and CSV files
- **Template Download**: Pre-formatted Excel template with sample data
- **Data Preview**: Review imported data before final import
- **Progress Tracking**: Real-time progress indicator during import
- **Duplicate Detection**: Automatic detection and skipping of duplicate records
- **Error Handling**: Comprehensive error reporting with row-specific details
- **Validation**: Data validation for required fields

### ✅ **User Experience**

- **Step-by-Step Process**: Clear workflow with multiple steps
- **Visual Feedback**: Progress bars, loading states, and status indicators
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Keyboard navigation and screen reader support

## File Format Requirements

### **Required Columns**

- **Name (English)**: Promoter's name in English
- **Name (Arabic)**: Promoter's name in Arabic
- **ID Card Number**: National ID or passport number

### **Optional Columns**

- **Email**: Contact email address
- **Phone**: Contact phone number
- **Address**: Physical address
- **ID Expiry Date**: ID card expiry date (YYYY-MM-DD format)
- **Passport Expiry Date**: Passport expiry date (YYYY-MM-DD format)
- **Notes**: Additional notes or comments
- **Status**: Promoter status (active/inactive)

### **Supported Column Headers**

The system recognizes multiple variations of column headers:

| Field                | Supported Headers                            |
| -------------------- | -------------------------------------------- |
| Name (English)       | `Name (English)`, `Name_EN`, `Name`          |
| Name (Arabic)        | `Name (Arabic)`, `Name_AR`, `Arabic Name`    |
| ID Card Number       | `ID Card Number`, `ID_Number`, `National ID` |
| Email                | `Email`, `Email Address`                     |
| Phone                | `Phone`, `Phone Number`, `Mobile`            |
| Address              | `Address`, `Location`                        |
| ID Expiry Date       | `ID Expiry Date`, `ID_Expiry`                |
| Passport Expiry Date | `Passport Expiry Date`, `Passport_Expiry`    |
| Notes                | `Notes`, `Comments`                          |
| Status               | `Status`                                     |

## Import Process

### **Step 1: Upload**

1. Click "Import Excel" button in the promoter management page
2. Download the template (optional but recommended)
3. Select an Excel or CSV file
4. System validates file format and processes data

### **Step 2: Preview**

1. Review the first 10 rows of processed data
2. Verify data mapping is correct
3. Check for any obvious issues
4. Proceed to import or go back to upload

### **Step 3: Import**

1. System processes all rows in the file
2. Validates required fields (Name, ID Number)
3. Checks for duplicate ID card numbers
4. Inserts valid records into database
5. Tracks progress with real-time updates

### **Step 4: Results**

1. Displays import summary with statistics
2. Shows detailed error messages for failed rows
3. Provides option to import another file or close

## Error Handling

### **Validation Errors**

- **Missing Required Fields**: Rows without Name or ID Number are skipped
- **Invalid Date Format**: Date fields must be in YYYY-MM-DD format
- **File Format Issues**: Only Excel and CSV files are accepted

### **Database Errors**

- **Duplicate Records**: Existing ID card numbers are skipped
- **Constraint Violations**: Database constraint errors are reported
- **Connection Issues**: Network or database connection problems

### **Error Reporting**

- **Row-Specific Errors**: Each error includes the row number
- **Detailed Messages**: Clear descriptions of what went wrong
- **Error Categories**: Grouped by type for easier resolution

## Technical Implementation

### **Components**

- `ExcelImportModal`: Main modal component
- `Progress`: Progress indicator component
- File processing using XLSX library
- Supabase integration for database operations

### **Data Flow**

1. **File Upload** → File validation and processing
2. **Data Extraction** → Parse Excel/CSV data
3. **Data Mapping** → Map columns to database fields
4. **Validation** → Check required fields and data integrity
5. **Database Operations** → Insert records with duplicate checking
6. **Results** → Generate import summary and error report

### **Security Features**

- **File Type Validation**: Only accepts specific file types
- **Data Sanitization**: Cleans and validates input data
- **Duplicate Prevention**: Prevents duplicate record creation
- **Error Isolation**: Individual row failures don't affect others

## Usage Examples

### **Basic Import**

1. Prepare Excel file with required columns
2. Click "Import Excel" button
3. Upload file and review preview
4. Confirm import and view results

### **Template Usage**

1. Download the provided template
2. Fill in your data following the format
3. Save and upload the completed file
4. Import with confidence in the format

### **Error Resolution**

1. Review error messages in the results
2. Fix issues in the original file
3. Re-upload the corrected file
4. Repeat import process

## Best Practices

### **Data Preparation**

- Use the provided template for consistent formatting
- Ensure all required fields are filled
- Use consistent date formats (YYYY-MM-DD)
- Avoid special characters in ID numbers

### **File Management**

- Keep file sizes reasonable (under 10MB)
- Use clear, descriptive column headers
- Test with small files before large imports
- Backup original data before importing

### **Quality Assurance**

- Review preview data carefully
- Check for duplicate ID numbers
- Verify date formats are correct
- Test import with sample data first

## Troubleshooting

### **Common Issues**

**File Not Uploading**

- Check file format (.xlsx, .xls, .csv)
- Ensure file size is reasonable
- Verify browser supports file upload

**Data Not Importing**

- Check required fields are present
- Verify ID card numbers are unique
- Review error messages for specific issues

**Import Errors**

- Check database connection
- Verify user permissions
- Review server logs for details

### **Performance Tips**

- Import files during off-peak hours
- Break large imports into smaller files
- Use consistent data formats
- Clean data before importing

## Future Enhancements

### **Planned Features**

- **Batch Processing**: Handle larger files more efficiently
- **Data Transformation**: Advanced data cleaning and formatting
- **Scheduled Imports**: Automated import scheduling
- **Import History**: Track and review past imports
- **Advanced Validation**: More sophisticated data validation rules

### **Integration Opportunities**

- **API Endpoints**: REST API for programmatic imports
- **Webhook Support**: Notifications for import completion
- **Third-party Integration**: Connect with external data sources
- **Reporting**: Detailed import analytics and reporting

## Support

For technical support or questions about the Excel import feature:

- Check the error messages for specific guidance
- Review the template format for data requirements
- Contact system administrator for database issues
- Refer to this documentation for detailed instructions
