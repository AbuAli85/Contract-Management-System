# Falcon Eye Group Structure Documentation

## Understanding the Structure

### Falcon Eye Group (Holding Group)
- **Type**: Holding Group (NOT a company/party in the system)
- **Role**: Owns and manages 16+ Falcon Eye companies
- **Status**: Should NOT exist as a separate `party` record
- **Companies**: All Falcon Eye companies are subsidiaries under this holding group

### Digital Morph (Trademark/Brand)
- **Type**: Trademark/Brand (NOT a separate company/party)
- **Parent Company**: Falcon Eye Modern Investments SPC
- **Purpose**: Handles social marketing agency work
- **Status**: Should NOT exist as a separate `party` record
- **Relationship**: Operates UNDER Falcon Eye Modern Investments SPC

---

## Current System Structure

### What Should Exist:
1. **16+ Falcon Eye Companies** as `parties` with `type = 'Employer'`
2. **Company Records** in `companies` table linked to each Falcon Eye party
3. **Profiles** for employers (via `contact_email`)
4. **Promoters** linked to their respective Falcon Eye employer companies

### What Should NOT Exist:
1. ❌ "Falcon Eye Group" as a separate `party` record
2. ❌ "Digital Morph" as a separate `party` record

---

## Data Alignment Issues to Fix

### Issue 1: Missing Company Records
- Some Falcon Eye parties may not have corresponding `companies` records
- **Fix**: Create `companies` records for all Falcon Eye parties

### Issue 2: Missing Profiles
- Some Falcon Eye parties may not have employer profiles
- **Fix**: Ensure all employer parties have profiles (via `contact_email`)

### Issue 3: Digital Morph Misrepresentation
- If "Digital Morph" exists as a separate party, it should be removed or merged
- **Fix**: Remove Digital Morph as separate party, ensure it's represented as a brand/trademark under Falcon Eye Modern Investments

### Issue 4: Falcon Eye Group Misrepresentation
- If "Falcon Eye Group" exists as a separate party, it should be removed
- **Fix**: Remove Falcon Eye Group as separate party (it's a holding group, not a company)

---

## Recommended Actions

1. **Analyze Current Structure**: Run `analyze-falcon-eye-structure.sql` to see current state
2. **Create Missing Company Records**: For Falcon Eye parties without `companies` records
3. **Ensure All Have Profiles**: Verify all Falcon Eye employer parties have profiles
4. **Remove Incorrect Parties**: Remove "Falcon Eye Group" and "Digital Morph" if they exist as separate parties
5. **Document Relationships**: Add notes or metadata to indicate holding group relationship

---

## Notes

- **Holding Group**: Falcon Eye Group is a conceptual entity that groups the 16+ companies
- **Trademark**: Digital Morph is a brand/trademark, not a legal entity
- **System Representation**: The system should only have the actual legal entities (the 16+ companies) as `parties`

