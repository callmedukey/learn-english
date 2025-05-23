# Novel Edit System

This comprehensive novel editing system provides full control over the entire novel database schema, allowing administrators to manage:

## Features

### 1. Novel Basic Information

- **Title**: Edit novel title
- **Description**: Update novel description
- **AR Level**: Change the AR (Accelerated Reader) level assignment
- **Cover Image**: Upload/change novel cover image with preview

### 2. Chapter Management

- **Create Chapters**: Add new chapters with title, description, and order number
- **Edit Chapters**: Modify existing chapter details
- **Delete Chapters**: Remove chapters (cascades to question sets and questions)
- **Order Management**: Reorder chapters with automatic conflict detection

### 3. Question Set Management

- **Create Question Sets**: Add question sets to chapters with instructions
- **Edit Question Sets**: Modify instructions for existing question sets
- **Delete Question Sets**: Remove question sets (cascades to questions)
- **One-to-One Relationship**: Each chapter can have only one question set

### 4. Question Management

- **Create Questions**: Add multiple-choice questions with:
  - Question text
  - Multiple choices (up to 4)
  - Correct answer
  - Explanation
  - Score points
  - Time limit
  - Order number
- **Edit Questions**: Modify all question properties
- **Delete Questions**: Remove individual questions
- **Order Management**: Reorder questions with conflict detection

## File Structure

```
app/(after-auth)/admin/novels/[id]/[novelId]/edit/
├── page.tsx                           # Main page with data fetching
├── components/
│   ├── novel-edit-form.tsx           # Main form component
│   ├── image-upload-section.tsx      # Image upload with preview
│   └── chapter-section.tsx           # Comprehensive chapter/question management
└── actions/
    ├── novel-edit.actions.ts         # Novel CRUD operations
    └── chapter.actions.ts            # Chapter/QuestionSet/Question CRUD operations
```

## Key Features

### User Experience

- **Collapsible Sections**: Chapters expand/collapse for better organization
- **Color-Coded Forms**: Different background colors for create/edit/delete operations
- **Real-time Validation**: Form validation with helpful error messages
- **Loading States**: Visual feedback during operations
- **Toast Notifications**: Success/error feedback

### Data Integrity

- **Order Number Validation**: Prevents duplicate order numbers
- **Cascade Deletion**: Proper cleanup when deleting parent entities
- **File Management**: Automatic cleanup of uploaded images
- **Transaction Safety**: Database operations wrapped in transactions

### Technical Implementation

- **Next.js 15**: Uses async params and proper server components
- **Server Actions**: All mutations handled server-side
- **Prisma**: Type-safe database operations
- **Sharp**: Image processing and metadata extraction
- **Revalidation**: Automatic cache invalidation after mutations

## Usage

1. Navigate to `/admin/novels/[arLevelId]/[novelId]/edit`
2. Edit basic novel information in the top section
3. Expand chapters to manage their content
4. Create question sets for chapters that need them
5. Add questions to question sets with full configuration
6. Save changes with real-time feedback

## Database Schema Control

This system provides complete control over:

- `Novel` table (title, description, AR level, image)
- `NovelChapter` table (title, description, order)
- `NovelQuestionSet` table (instructions)
- `NovelQuestion` table (all question properties)
- `NovelImage` table (image metadata and file management)

All operations respect foreign key constraints and provide proper error handling for data integrity violations.
