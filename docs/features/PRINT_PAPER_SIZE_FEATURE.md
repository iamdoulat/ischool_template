# Print Header/Footer Settings - Paper Size Customization

## Overview
Enhanced print header/footer settings with **paper size customization**. Each document type can now be configured with a specific paper size (A4, A5, or Legal), allowing for highly customizable print layouts.

## New Features Added

### ✅ Paper Size Selection
- **A4**: 210mm × 297mm (Standard international paper)
- **A5**: 148mm × 210mm (Half of A4, compact documents)
- **Legal**: 216mm × 356mm (US legal size)

### ✅ Per-Document Type Configuration
Each of the 7 document types can have its own paper size:
- Fees Receipt
- Payslip
- Online Admission Receipt
- Online Exam
- Email
- General Purpose
- Invoice

### ✅ Visual Paper Size Selector
- Dropdown selector showing paper dimensions
- Real-time preview of selected size
- Highlighted selection with dimensions displayed
- Located prominently at the top of each tab

### ✅ Enhanced Preview
- Preview modal shows actual paper size dimensions
- Document preview scales to selected paper size
- Paper size label displayed in preview
- Print-ready layout visualization

## Database Schema Update

```sql
ALTER TABLE print_header_footer_settings
ADD COLUMN paper_size ENUM('A4', 'A5', 'Legal') DEFAULT 'A4' AFTER footer_content;
```

## API Changes

### Request Format (Updated)
```http
POST /api/v1/system-setting/print-settings
Content-Type: multipart/form-data

type=Fees Receipt
paper_size=A4           # NEW: Required field
header_image=[file]
footer_content=Footer text
```

### Response Format (Updated)
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "type": "Fees Receipt",
        "header_image_url": "...",
        "footer_content": "...",
        "paper_size": "A4"     // NEW: Paper size field
    }
}
```

## Validation Rules (Updated)

| Field | Required | Type | Values | Notes |
|-------|----------|------|--------|-------|
| type | Yes | string | - | Document type |
| paper_size | **Yes** | enum | A4, A5, Legal | Paper size selection |
| header_image | No | file | - | Max 5MB |
| footer_content | No | text | - | Max 10,000 chars |

## Paper Size Specifications

### A4 (Default)
- **Dimensions**: 210mm × 297mm (8.27" × 11.69")
- **Use Case**: Standard documents, reports, certificates
- **Most Common**: International standard

### A5 (Compact)
- **Dimensions**: 148mm × 210mm (5.83" × 8.27")
- **Use Case**: Receipts, small invoices, notes
- **Benefits**: Paper-saving, portable

### Legal (US Standard)
- **Dimensions**: 216mm × 356mm (8.5" × 14")
- **Use Case**: Legal documents, contracts, official forms
- **Benefits**: More vertical space

## Usage Instructions

### Setting Paper Size

1. Navigate to Print Header/Footer settings
2. Select the document type tab
3. At the top, find the **Paper Size** selector (highlighted in blue)
4. Click the dropdown and choose your desired size
5. Configure header/footer as needed
6. Click **Save**

### Previewing Different Sizes

1. Configure your document
2. Select a paper size
3. Click **Preview** button
4. The preview modal will show the document at the actual paper size
5. Paper size is displayed in the preview header

## UI Features

### Paper Size Selector Design
- 🎨 **Blue background** section for visibility
- 📏 **Dimensions shown** in dropdown (e.g., "A4 (210mm × 297mm)")
- ✅ **Current selection** displayed below dropdown
- 🔄 **Real-time update** when changed

### Preview Modal Enhancements
- Paper size dimensions rendered accurately
- Size label shown in preview header
- Proper scaling for each paper type
- Print button respects selected size

## Migration Steps

### Run New Migration
```bash
cd backend
"C:\Program Files\FlyEnv-Data\app\php-8.3.31\php.exe" artisan migrate
```

This will add the `paper_size` column to existing records with default value 'A4'.

### Update Existing Data (Optional)
```bash
"C:\Program Files\FlyEnv-Data\app\php-8.3.31\php.exe" artisan db:seed --class=PrintHeaderFooterSettingSeeder
```

## Testing

### New Test Cases Added (5)
1. ✅ Requires paper_size field
2. ✅ Paper size must be valid value (A4, A5, Legal only)
3. ✅ Accepts all valid paper sizes
4. ✅ Paper size is saved with setting
5. ✅ Returns paper size when fetching settings

### Run Updated Tests
```bash
cd backend
composer test --filter PrintHeaderFooterSettingTest
```

**Expected**: 27 tests passing (22 original + 5 new)

## Example Scenarios

### Scenario 1: Receipt on A5
```javascript
// Small receipts work best on A5
{
    type: "Fees Receipt",
    paper_size: "A5",           // Compact size
    header_image: logo.jpg,
    footer_content: "Thank you"
}
```

### Scenario 2: Legal Document on Legal Size
```javascript
// Legal contracts need more space
{
    type: "General Purpose",
    paper_size: "Legal",        // Extra vertical space
    header_image: header.jpg,
    footer_content: "Legal notice..."
}
```

### Scenario 3: Standard Invoice on A4
```javascript
// Most invoices use A4
{
    type: "Invoice",
    paper_size: "A4",           // Standard size
    header_image: company-logo.jpg,
    footer_content: "Terms and conditions..."
}
```

## Frontend Implementation

### Paper Size Constants
```typescript
const paperSizes = [
    { value: "A4", label: "A4 (210mm × 297mm)", width: "210mm", height: "297mm" },
    { value: "A5", label: "A5 (148mm × 210mm)", width: "148mm", height: "210mm" },
    { value: "Legal", label: "Legal (216mm × 356mm)", width: "216mm", height: "356mm" },
];
```

### State Management
```typescript
const [settingsData, setSettingsData] = useState({
    "Fees Receipt": {
        paper_size: "A4",  // Default
        header_image_url: null,
        footer_content: ""
    }
});
```

## Benefits

1. ✅ **Flexibility**: Each document type gets appropriate paper size
2. ✅ **Cost Savings**: Use A5 for small receipts to save paper
3. ✅ **Compliance**: Legal size for official documents
4. ✅ **User Choice**: Admins control paper usage per document type
5. ✅ **Print Optimization**: Correct size reduces printing issues

## Future Enhancements

- [ ] Custom paper size dimensions
- [ ] Page orientation (Portrait/Landscape)
- [ ] Margins configuration
- [ ] Multi-page support with page numbers
- [ ] Paper size templates (predefined layouts)
- [ ] Print preview with actual printer settings
- [ ] PDF export with correct paper size
- [ ] Batch print with mixed paper sizes

## Troubleshooting

### Paper Size Not Saving
- Ensure migration has run: `php artisan migrate`
- Check database column exists: `paper_size` in `print_header_footer_settings`
- Verify frontend sends `paper_size` in FormData

### Preview Shows Wrong Size
- Clear browser cache
- Check that `currentPaperSize` is correctly calculated
- Verify CSS `width` and `height` are applied

### Print Doesn't Match Preview
- Browser print settings may override paper size
- Use "Print to PDF" for accurate preview
- Check printer paper size settings

---

**Last Updated**: June 25, 2026  
**Version**: 1.1.0 (Paper Size Feature)  
**Status**: ✅ Production Ready  
**New Tests**: 5 additional (27 total)
