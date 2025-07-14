## Comprehensive Project Division for 5 Team Members

## Member 1(hamdi): Authentication & User Management

Backend Endpoints (12 total)
```
// Authentication Controller (9 endpoints)
POST /api/auth/register                  # Register new user (mentor or mentee)
POST /api/auth/login                     # Login with email/password
POST /api/auth/external-login            # Social login (Google/Facebook/LinkedIn)
POST /api/auth/refresh-token             # Refresh JWT token
POST /api/auth/forgot-password           # Initiate password reset
POST /api/auth/reset-password            # Complete password reset with token
GET  /api/auth/verify-email/{token}      # Verify email address
POST /api/auth/resend-verification       # Resend verification email
POST /api/auth/logout                    # Logout (invalidate refresh token)

// User Profile Endpoints (3 endpoints)
GET  /api/users/profile                  # Get current user profile
PUT  /api/users/profile                  # Update user profile
PUT  /api/users/change-password          # Change password
```

Pages (5 total)

1. Login Page
Implementation Details:
- Create a professional login form with email/password fields
- Add "Remember me" checkbox functionality
- Implement social login buttons with proper OAuth integration
- Add form validation with helpful error messages
- Create "Forgot password" workflow link
- Design responsive layout for all devices
- Implement JWT token storage and security

2. Register Page
Implementation Details:
- Build role-selection toggle (Mentor/Mentee)
- Create dynamic form that changes fields based on selected role
- Implement comprehensive form validation
- For mentors, add fields for skills, hourly rate, bio
- Add password strength requirements display
- Integrate with skills API from Member 5
- Show success state with email verification instructions

3. Email Verification Page
Implementation Details:
- Create token validation logic
- Design success/error states with clear messaging
- Add "Resend verification" functionality with cooldown timer
- Include animated success checkmark for verified accounts
- Add "Return to login" button
- Handle expired token scenarios

4. Password Reset Pages
Implementation Details:
- Create two separate views: request and reset
- Build email input form with validation
- Create secure token handling for password reset
- Implement password strength requirements
- Design mobile-responsive layouts for both pages
- Add clear success/error message handling

5. Basic Profile Page
Implementation Details:
- Build profile picture upload functionality
- Create form for updating basic user information
- Implement password change section with current/new fields
- Add form validation for all inputs
- Design responsive layout for all screen sizes
- Implement success/error message handling

## Member 2(Rawan): Mentee Experience

Backend Endpoints (14 total)
```
// Mentee-focused Bookings (6 endpoints)
GET    /api/bookings/mentee/{menteeId}   # Get mentee bookings
GET    /api/bookings/upcoming            # Get upcoming bookings
GET    /api/bookings/completed           # Get completed bookings
POST   /api/bookings                     # Create new booking
GET    /api/bookings/{id}                # Get booking details
POST   /api/bookings/{id}/join           # Get Google Meet link

// CV Management (6 endpoints)
GET    /api/cvs                          # Get mentee's CVs
POST   /api/cvs                          # Upload new CV
DELETE /api/cvs/{id}                     # Delete CV
GET    /api/cvs/comments/{cvId}          # Get CV comments
POST   /api/users/upload-cv              # Upload CV (alternate)
GET    /api/users/cv                     # Get current CV

// Mentor Search (2 endpoints)
GET    /api/users/mentors                # Get mentors with filters
GET    /api/users/{id}                   # Get mentor profile
```

Pages (7 total)

1. Dashboard Page (Mentee View)
Implementation Details:
- Create personalized welcome section with mentee name
- Build dynamic stats cards showing session counts
- Design upcoming sessions preview with quick-join functionality
- Implement recent activity feed
- Add quick navigation section to key mentee features
- Ensure mobile responsiveness for all elements

2. Search Mentors Page
Implementation Details:
- Build advanced filtering sidebar with skill selection, price range, rating filters
- Create toggleable list/grid view for results
- Design mentor cards showing profile picture, skills, ratings, price
- Implement pagination for search results
- Add sort functionality by multiple criteria
- Create empty state handling for no results
- Ensure filters work correctly with backend API calls

3. Mentor Profile View
Implementation Details:
- Design detailed profile header with mentor photo and basic info
- Create sections for bio, skills, experience
- Build ratings and reviews component showing average and recent reviews
- Implement availability calendar showing open slots
- Add prominent "Book a Session" call-to-action button
- Ensure responsive layout on all devices

4. Booking Form Page
Implementation Details:
- Create multi-step booking process
- Implement session type selection (mentorship/interview)
- Build date picker showing only available dates
- Design time slot selection grid
- Calculate and display pricing information
- Add terms acceptance checkbox
- Create integration with payment flow
- Design responsive mobile layout

5. Mentee Bookings Page
Implementation Details:
- Build tabbed navigation between upcoming/past/all bookings
- Implement search and filter functionality
- Create booking cards with relevant session information
- Add status-based action buttons (join, cancel, review)
- Design empty state for each tab
- Implement pagination for many bookings

6. Booking Details Page (Mentee View)
Implementation Details:
- Create status-aware header banner
- Design session details section with mentor info, date/time
- Add Google Meet integration with join button
- Implement payment information display
- Create chat access button linking to chat system
- Add review section for completed sessions
- Design responsive layout for all information

7. CV Management Page
Implementation Details:
- Build CV upload section with drag-and-drop functionality
- Create list view of uploaded CVs with metadata
- Implement active/inactive toggling for CVs
- Design comment viewing interface for mentor feedback
- Add delete functionality with confirmation
- Implement file type validation and size limits
- Create responsive layout for mobile devices

## Member 3 (reda): Mentor Experience, Chat System & All Email Functionality

Backend Endpoints (25 total)
```
// Mentor-focused Endpoints (10 endpoints)
GET    /api/availability/{userId}        # Get availability schedule
POST   /api/availability                 # Add availability slot
PUT    /api/availability/{id}            # Update availability slot
DELETE /api/availability/{id}            # Delete availability slot
GET    /api/bookings/mentor/{mentorId}   # Get mentor bookings
PUT    /api/bookings/{id}/status         # Update booking status
PUT    /api/users/toggle-mentor-status   # Toggle mentor/interviewer status
PUT    /api/users/hourly-rate            # Update hourly rate
POST   /api/cvs/comments                 # Add CV comment
DELETE /api/cvs/comments/{id}            # Delete CV comment

// Chat & Notifications (7 endpoints)
GET    /api/chat/{bookingId}             # Get chat history
POST   /api/chat                         # Send new message
GET    /api/chat/unread-count            # Get unread messages count
PUT    /api/chat/{messageId}/read        # Mark message as read
POST   /api/chat/attachment              # Upload chat attachment
GET    /api/notifications                # Get user notifications
PUT    /api/notifications/read-all       # Mark all notifications as read

// Payment Endpoints (5 endpoints)
POST   /api/payments/create-intent       # Create Stripe payment intent
POST   /api/payments/confirm             # Confirm payment
GET    /api/payments/history             # Get payment history
GET    /api/payments/{id}                # Get payment details
GET    /api/payments/mentor-earnings     # Get mentor earnings summary


```

Pages (7 total)

1. Dashboard Page (Mentor View)
What You Need to Implement:
- Create a mentor-specific dashboard layout
- Build today's sessions schedule component
- Implement earnings summary cards with dynamic data
- Design recent reviews component
- Add availability status toggle
- Create upcoming sessions preview with join functionality
- Include quick action links to key mentor features
- Ensure responsive design for all screen sizes

2. Mentor Profile Management
What You Need to Implement:
- Build comprehensive profile editor for mentor details
- Create rich text editor for bio and expertise
- Implement skills selection interface (using skill API from Member 5)
- Add profile picture upload functionality
- Build hourly rate setting with input validation
- Create mentor/interviewer role toggle switches
- Implement form validation and error handling
- Add success messaging for saved changes

3. Mentor Availability Management
What You Need to Implement:
- Create weekly calendar view with time grid
- Build add availability panel with day/time selection
- Implement recurring availability option
- Create visual display of existing slots
- Add edit/delete functionality for availability slots
- Implement conflict detection to prevent overlapping slots
- Add bulk action support for managing multiple days
- Ensure mobile responsiveness for calendar view

4. Bookings Page (Mentor View)
What You Need to Implement:
- Create tabbed navigation between booking status types
- Implement search and filter functionality
- Build booking cards/list showing session information
- Add status-specific action buttons (join, cancel, complete)
- Create session details modal/view
- Implement Google Meet integration
- Add empty state handling
- Ensure responsive design for all screen sizes

5. CV Review Page
What You Need to Implement:
- Build PDF/document viewer for CVs
- Implement commenting system for providing feedback
- Create threaded replies for existing comments
- Add delete functionality for comments
- Design document navigation controls for multi-page CVs
- Add mentee information display
- Implement real-time or periodic comment updates
- Ensure mobile responsiveness for document viewing

6. Chat Page
What You Need to Implement:
- Create real-time chat interface using SignalR
- Build conversation list sidebar with unread indicators
- Implement message thread view with sent/received styling
- Add attachment upload and preview functionality
- Create typing indicators and read receipts
- Build message input area with emoji support
- Implement responsive design for mobile chat
- Create empty state for no conversations

7. Notifications Center
What You Need to Implement:
- Create notifications list with read/unread states
- Implement filters for notification types
- Add "Mark all as read" functionality
- Create clickable notifications that navigate to relevant pages
- Design responsive notification components for all screens
- Implement real-time notification updates via SignalR
- Create empty state for no notifications



## Member 4(dareen): UI Focus, Static Pages & Payment UI

Backend Endpoints (4 total)
```
// Reviews Display (2 endpoints)
GET    /api/reviews/mentor/{mentorId}    # Get reviews for a mentor
GET    /api/reviews/mentee/{menteeId}    # Get reviews by a mentee

// Contact Form (2 endpoints)
POST   /api/contact                      # Submit contact form
GET    /api/faq                          # Get FAQ content
```

Pages (7 total)

1. Home Page
Implementation Details:
- Create engaging hero section with main value proposition
- Build "How it works" section explaining the platform process
- Implement features showcase with attractive icons and descriptions
- Design mentor categories/skills carousel
- Create testimonials section for social proof
- Add prominent call-to-action buttons
- Design responsive footer with navigation links
- Ensure mobile responsiveness for all sections

2. About Us Page
Implementation Details:
- Create compelling mission statement section
- Build narrative about platform purpose and goals
- Design team section (if applicable)
- Implement platform benefits/advantages section
- Add testimonials or success stories
- Include call-to-action to register
- Ensure consistent branding and styling
- Create responsive layout for all screen sizes

3. Contact Us Page
Implementation Details:
- Build contact form with name, email, subject, message fields
- Implement form validation with helpful error messages
- Create success state for form submission
- Add alternative contact methods display
- Include FAQ links or quick answers section
- Design responsive layout for mobile devices
- Integrate with backend to submit contact form data

4. Reviews Display Components
Implementation Details:
- Create reusable star rating component
- Build individual review card component
- Design review list component with filtering options
- Implement review summary statistics component
- Create "Write a review" form component
- Design empty states for no reviews 
- Ensure all components are responsive
- Create loading states for async data

5. Payment Processing Page
Implementation Details:
- Create order summary section showing session details
- Build Stripe Elements integration for credit card inputs
- Design secure payment form layout with validation
- Implement billing information collection if needed
- Add order confirmation checkbox for terms
- Create loading states during payment processing
- Design success/error handling with clear messages
- Ensure mobile responsiveness for all elements
- Connect UI to Member 3's payment endpoints

6. Payment Confirmation Page
Implementation Details:
- Design success animation/illustration
- Create booking confirmation details display
- Build receipt information section
- Add Google Meet link display when available
- Implement "Add to calendar" functionality
- Design next steps guidance for users
- Create responsive layout for all screen sizes
- Connect to Member 3's payment confirmation endpoint

7. Admin UI Components
Implementation Details:
- Create reusable admin UI components that Member 5 can use:
  - Data tables with sorting/filtering
  - Admin cards for statistics
  - Chart components for data visualization
  - Action buttons (approve/reject/delete)
  - Status badges and indicators
  - Filter components
  - Search components
  - Modal dialogs for confirmations
- Work collaboratively with Member 5 to ensure admin UI consistency
- These components should be used in Member 5's admin pages
- Do not implement the actual admin pages - focus on reusable components

## Member 5(Marina): Admin Dashboard & Skills Management

Backend Endpoints (13 total)
```
// Admin Controller (7 endpoints)
GET    /api/admin/users                  # Get all users
PUT    /api/admin/users/{id}/status      # Activate/deactivate user
GET    /api/admin/bookings               # Get all bookings
GET    /api/admin/payments               # Get all payments
GET    /api/admin/revenue                # Get revenue summary
GET    /api/admin/reviews                # Get all reviews
DELETE /api/admin/reviews/{id}           # Delete inappropriate review

// Skills Controller (6 endpoints)
GET    /api/skills                       # Get all skills
POST   /api/skills                       # Add new skill (admin only)
PUT    /api/skills/{id}                  # Update skill (admin only)
DELETE /api/skills/{id}                  # Delete skill (admin only)
POST   /api/skills/user                  # Add skill to user
DELETE /api/skills/user/{skillId}        # Remove skill from user
```

Pages (5 total)

1. Admin Dashboard Overview
Implementation Details:
- Create admin navigation sidebar with role-based access
- Build key metrics cards showing platform statistics
- Implement interactive charts for user growth and revenue
- Create recent activity feed with important events
- Design quick action buttons for common admin tasks
- Implement responsive layout for all screen sizes
- Connect to backend endpoints for real-time data
- Use UI components from Member 4 for consistent design

2. User Management Page
Implementation Details:
- Build comprehensive user search functionality
- Create advanced filtering options (role, status, date)
- Design user table with sortable columns
- Implement user detail modal/sidebar
- Add user status toggle functionality
- Create pagination for large user lists
- Add export functionality for user data
- Ensure responsive design for all screen sizes
- Use UI components from Member 4 for consistent design

3. Admin Bookings Management
Implementation Details:
- Create date range picker for filtering bookings
- Build status filter dropdown for booking states
- Implement user search for mentor/mentee filtering
- Design bookings table with session details
- Create booking detail view for comprehensive information
- Add status update controls for admins
- Implement export functionality
- Design responsive layout for all devices
- Use UI components from Member 4 for consistent design

4. Admin Payments Management
Implementation Details:
- Build date range selector for financial reporting
- Create summary cards showing financial metrics
- Implement revenue chart with time period toggles
- Design transactions table with sortable columns
- Add payment detail view functionality
- Create export options for financial reports
- Implement search and filtering options
- Ensure responsive design for all screen sizes
- Use UI components from Member 4 for consistent design

5. Skills Management Page
Implementation Details:
- Create skills management interface for adding/editing
- Build skills table with usage statistics
- Implement skill detail modal for editing
- Add category management if implementing skill categories
- Create search and filter functionality
- Implement delete confirmation flow
- Design bulk actions for multiple skills
- Ensure responsive design for all screen sizes
- Use UI components from Member 4 for consistent design

Integration Points Between Team Members

Member 3 ↔️ Member 4
Email System & Payment Integration:
- Member 3 build all email functionality including templates and sending
- Member 3 create the payment backend with Stripe integration
- Member 4 creates the payment UI components
- Member 4 will use your endpoints for payment processing
- Coordinate on UI/UX for payment flows

Member 4 ↔️ Member 5
Admin UI Collaboration:
- Member 4 creates reusable UI components
- Member 5 uses these components in admin pages
- Member 5 retains full responsibility for admin functionality
- Member 4 does not implement any admin logic or pages
- Regular communication needed for consistent admin UI

Shared Dependencies Management
1. Skills API Access:
   - Member 5 implements fully
   - You and other members use mock data until ready

2. User Authentication:
   - Member 1 delivers first
   - All members use auth guard components

3. Email Service:
   - (Member 3) create and own the email service
   - Other team members will call your service for sending emails
   - Member 4 does not need to design email templates; you handle all email aspects


   ## schema :
-- 1. CREATE DATABASE
CREATE DATABASE Rafeeq;
GO

USE Rafeeq;
GO

-- 2. Roles Table
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL
);

-- 3. Users Table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    ProfilePicture NVARCHAR(255),
    Bio NVARCHAR(MAX),
    IsEmailVerified BIT DEFAULT 0,
    RoleId INT FOREIGN KEY REFERENCES Roles(RoleId),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExternalId NVARCHAR(100) NULL,
    ExternalType NVARCHAR(50) NULL,
    ExternalToken NVARCHAR(MAX) NULL,
    IsMentor BIT DEFAULT 0,
    IsInterviewer BIT DEFAULT 0,
    IsDeleted BIT DEFAULT 0,
    HourlyRate DECIMAL(10,2) NULL
);

-- 4. Skills Table
CREATE TABLE Skills (
    SkillId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL
);

-- 5. MentorSkills Table
CREATE TABLE MentorSkills (
    MentorSkillId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    SkillId INT FOREIGN KEY REFERENCES Skills(SkillId)
);

-- 6. MenteeSkills Table
CREATE TABLE MenteeSkills (
    MenteeSkillId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    SkillId INT FOREIGN KEY REFERENCES Skills(SkillId)
);

-- 7. Availability Table
CREATE TABLE Availability (
    AvailabilityId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    DayOfWeek INT,
    StartTime TIME,
    EndTime TIME
);

-- 8. Bookings Table
CREATE TABLE Bookings (
    BookingId INT PRIMARY KEY IDENTITY(1,1),
    MentorId INT FOREIGN KEY REFERENCES Users(UserId),
    MenteeId INT FOREIGN KEY REFERENCES Users(UserId),
    SessionType NVARCHAR(50),
    StartDateTime DATETIME,
    EndDateTime DATETIME,
    Status NVARCHAR(50) DEFAULT 'Pending',
    GoogleMeetLink NVARCHAR(255),
    PaymentStatus NVARCHAR(50) DEFAULT 'Unpaid',
    TotalAmount DECIMAL(10, 2),
    Commission DECIMAL(10, 2),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    IsDeleted BIT DEFAULT 0
);

-- 9. Reviews Table
CREATE TABLE Reviews (
    ReviewId INT PRIMARY KEY IDENTITY(1,1),
    ReviewerId INT FOREIGN KEY REFERENCES Users(UserId),
    ReviewedUserId INT FOREIGN KEY REFERENCES Users(UserId),
    BookingId INT FOREIGN KEY REFERENCES Bookings(BookingId),
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);

-- 10. ChatConversations Table
CREATE TABLE ChatConversations (
    ConversationId INT PRIMARY KEY IDENTITY(1,1),
    BookingId INT FOREIGN KEY REFERENCES Bookings(BookingId),
    MentorId INT FOREIGN KEY REFERENCES Users(UserId),
    MenteeId INT FOREIGN KEY REFERENCES Users(UserId),
    LastMessageAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 11. ChatMessages Table
CREATE TABLE ChatMessages (
    MessageId INT PRIMARY KEY IDENTITY(1,1),
    BookingId INT FOREIGN KEY REFERENCES Bookings(BookingId),
    SenderId INT FOREIGN KEY REFERENCES Users(UserId),
    MessageText NVARCHAR(MAX),
    IsRead BIT DEFAULT 0,
    SentAt DATETIME DEFAULT GETDATE(),
    ConversationId INT FOREIGN KEY REFERENCES ChatConversations(ConversationId),
    IsEdited BIT DEFAULT 0,
    IsVoiceMessage BIT DEFAULT 0
);

-- 12. ChatAttachments Table
CREATE TABLE ChatAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    MessageId INT FOREIGN KEY REFERENCES ChatMessages(MessageId),
    FilePath NVARCHAR(255) NOT NULL,
    FileName NVARCHAR(100) NOT NULL,
    FileSize INT NOT NULL,
    ContentType NVARCHAR(100) NOT NULL,
    IsVoiceMessage BIT DEFAULT 0
);

-- 13. MessageReadStatus Table
CREATE TABLE MessageReadStatus (
    ReadStatusId INT PRIMARY KEY IDENTITY(1,1),
    MessageId INT FOREIGN KEY REFERENCES ChatMessages(MessageId),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    ReadAt DATETIME DEFAULT GETDATE()
);

-- 14. Payments Table
CREATE TABLE Payments (
    PaymentId INT PRIMARY KEY IDENTITY(1,1),
    BookingId INT FOREIGN KEY REFERENCES Bookings(BookingId),
    AmountPaid DECIMAL(10,2),
    PaymentMethod NVARCHAR(50),
    TransactionId NVARCHAR(255),
    PaymentDate DATETIME DEFAULT GETDATE()
);

-- 15. Notifications Table
CREATE TABLE Notifications (
    NotificationId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    Message NVARCHAR(255),
    IsRead BIT DEFAULT 0,
    Type NVARCHAR(50),
    RelatedEntityId INT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 16. UserTokens Table
CREATE TABLE UserTokens (
    TokenId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    TokenType NVARCHAR(50) NOT NULL,
    TokenValue NVARCHAR(255) NOT NULL,
    ExpiryDate DATETIME NOT NULL,
    IsUsed BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 17. MenteeCVs Table
CREATE TABLE MenteeCVs (
    CVId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    FilePath NVARCHAR(255) NOT NULL,
    FileName NVARCHAR(100) NOT NULL,
    FileSize INT NOT NULL,
    ContentType NVARCHAR(100) NOT NULL,
    UploadDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- 18. CVComments Table
CREATE TABLE CVComments (
    CommentId INT PRIMARY KEY IDENTITY(1,1),
    CVId INT FOREIGN KEY REFERENCES MenteeCVs(CVId),
    MentorId INT FOREIGN KEY REFERENCES Users(UserId),
    Comment NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);

-- 19. ContactMessages Table
CREATE TABLE ContactMessages (
    MessageId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Subject NVARCHAR(200) NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'New',
    IsDeleted BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ResponseDate DATETIME NULL,
    ResponseMessage NVARCHAR(MAX) NULL,
    RespondedBy INT NULL FOREIGN KEY REFERENCES Users(UserId)
);

-- 20. Indexes
CREATE INDEX IX_ChatMessages_ConversationId ON ChatMessages(ConversationId);
CREATE INDEX IX_ChatMessages_SenderId ON ChatMessages(SenderId);
CREATE INDEX IX_ChatConversations_BookingId ON ChatConversations(BookingId);
CREATE INDEX IX_ChatConversations_MentorId ON ChatConversations(MentorId);
CREATE INDEX IX_ChatConversations_MenteeId ON ChatConversations(MenteeId);
CREATE INDEX IX_MessageReadStatus_MessageId ON MessageReadStatus(MessageId);
CREATE INDEX IX_MessageReadStatus_UserId ON MessageReadStatus(UserId);

-- 21. Default Roles
INSERT INTO Roles (RoleName) VALUES ('Admin'), ('Mentor'), ('Mentee');
CREATE TABLE MessageReactions (
    ReactionId INT PRIMARY KEY IDENTITY(1,1),
    MessageId INT FOREIGN KEY REFERENCES ChatMessages(MessageId),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    ReactionType NVARCHAR(50),
    CreatedAt DATETIME
);

-- Articles Table for Knowledge Base
CREATE TABLE Articles (
    ArticleId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(300) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Summary NVARCHAR(500),
    Category NVARCHAR(100), -- 'Mentoring', 'Career', 'Interview', 'CV'
    AuthorId INT FOREIGN KEY REFERENCES Users(UserId),
    IsPublished BIT DEFAULT 1,
    ViewCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);

-- FAQ Table for Help Center
CREATE TABLE FAQ (
    FAQId INT PRIMARY KEY IDENTITY(1,1),
    Question NVARCHAR(500) NOT NULL,
    Answer NVARCHAR(MAX) NOT NULL,
    Category NVARCHAR(100), -- 'Getting Started', 'Payments', 'Technical', 'Booking'
    SortOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    ViewCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

Collecting workspace information# 🎯 **Minimal AI Enhancement Plan for Rafeq Platform**

## **What I Will Implement**

### **1. Smart Mentor Search Enhancement**
- Replace basic keyword matching with semantic search using OpenAI embeddings
- When mentee searches "I need help with React interviews" → automatically finds mentors with "JavaScript", "Frontend", "Interview preparation" skills
- Combine regular search results with AI-powered semantic matching for better mentor discovery

### **2. Voice Messages in Chat System**
- Voice message recording and playback already available in chat interface
- **Enhancement:** Automatically transcribe voice messages using Whisper API for searchability and accessibility
- **Enhancement:** Display each voice message with an audio player, transcript (speech-to-text), and audio duration
- **Enhancement:** Allow users to search chat history by transcribed voice message content
- **Enhancement:** (Optional) Show waveform visualization and playback speed controls for voice messages


### **3. AI Chatbot Voice Output**
- Add text-to-speech capability to existing AI chatbot responses
- Users can toggle voice output on/off in chatbot interface
- AI responses will be spoken aloud using OpenAI TTS API
- Improves accessibility and user engagement with AI assistant

---

## **Database Changes Required**

### **Execute These SQL Commands:**

````sql
-- 1. Add mentor embeddings for semantic search
CREATE TABLE MentorEmbeddings (
    EmbeddingId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    BioEmbedding VARBINARY(MAX), -- Mentor bio + skills as vector
    LastUpdated DATETIME DEFAULT GETDATE(),
    CONSTRAINT IX_MentorEmbeddings_UserId UNIQUE(UserId)
);

-- 2. Store AI configuration securely
CREATE TABLE AIConfiguration (
    ConfigId INT PRIMARY KEY IDENTITY(1,1),
    ConfigKey NVARCHAR(100) NOT NULL UNIQUE,
    ConfigValue NVARCHAR(MAX) NOT NULL,
    ConfigType NVARCHAR(50), -- 'embedding', 'whisper', 'tts'
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- 3. Extend existing ChatMessages for voice capability (NON-BREAKING)
ALTER TABLE ChatMessages ADD 
    AudioFilePath NVARCHAR(255) NULL,
    TranscriptText NVARCHAR(MAX) NULL,
    AudioDuration INT NULL;

-- 4. Add user voice preferences (NON-BREAKING)
ALTER TABLE Users ADD 
    TTSEnabled BIT DEFAULT 0,
    PreferredTTSVoice NVARCHAR(50) DEFAULT 'alloy',
    VoiceSearchEnabled BIT DEFAULT 1;

-- 5. Cache TTS responses for performance (OPTIONAL)
CREATE TABLE TTSCache (
    CacheId INT PRIMARY KEY IDENTITY(1,1),
    TextHash NVARCHAR(64) NOT NULL UNIQUE,
    AudioFilePath NVARCHAR(255) NOT NULL,
    Voice NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastUsed DATETIME DEFAULT GETDATE()
);

-- 6. Insert AI configuration
INSERT INTO AIConfiguration (ConfigKey, ConfigValue, ConfigType) VALUES
('openai_api_key', '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', 'general'),
('embedding_model', 'text-embedding-3-small', 'embedding'),
('whisper_model', 'whisper-1', 'whisper'),
('tts_model', 'tts-1', 'tts'),
('similarity_threshold', '0.7', 'embedding'),
('max_audio_duration', '300', 'whisper'),
('tts_cache_enabled', 'true', 'tts');

-- 7. Create performance indexes

CREATE INDEX IX_AIConfiguration_ConfigKey ON AIConfiguration(ConfigKey);
CREATE INDEX IX_TTSCache_TextHash ON TTSCache(TextHash);
CREATE INDEX IX_ChatMessages_AudioFilePath ON ChatMessages(AudioFilePath);
````

---

## **New API Endpoints Needed**

### **Backend Developer Instructions:**

### **1. Embedding & Semantic Search Endpoints**

````csharp
// EmbeddingController.cs
[ApiController]
[Route("api/[controller]")]
public class EmbeddingController : ControllerBase
{
    [HttpPost("generate-mentor")]
    public async Task<IActionResult> GenerateMentorEmbedding([FromBody] int mentorId)
    {
        // 1. Get mentor's bio, skills, and experience from database
        // 2. Combine into single text string
        // 3. Call OpenAI embedding API: text-embedding-3-small
        // 4. Store 1536-dimension vector in MentorEmbeddings table
        // 5. Return success/failure status
    }

    [HttpPost("mentors/semantic-search")]
    public async Task<IActionResult> SemanticMentorSearch([FromBody] SemanticSearchRequest request)
    {
        // 1. Create embedding for search query using OpenAI
        // 2. Calculate cosine similarity with all mentor embeddings
        // 3. Return mentors with similarity > threshold (0.7)
        // 4. Combine with regular search results
        // 5. Remove duplicates and rank by relevance
    }

    [HttpPost("bulk-generate")]
    public async Task<IActionResult> BulkGenerateEmbeddings()
    {
        // Background job to generate embeddings for all mentors
        // Use this to populate embeddings for existing mentors
    }
}

// Request/Response Models
public class SemanticSearchRequest
{
    public string Query { get; set; }
    public int? MinRating { get; set; }
    public decimal? MaxHourlyRate { get; set; }
    public List<string> Skills { get; set; }
}

public class SemanticSearchResponse
{
    public List<MentorResult> Mentors { get; set; }
    public float SearchTime { get; set; }
    public int TotalResults { get; set; }
}

public class MentorResult
{
    public int UserId { get; set; }
    public string FullName { get; set; }
    public string Bio { get; set; }
    public decimal HourlyRate { get; set; }
    public float SimilarityScore { get; set; } // 0-1
    public List<string> Skills { get; set; }
    public double AverageRating { get; set; }
}
````

### **2. Voice Message Endpoints**

````csharp
// VoiceController.cs
[ApiController]
[Route("api/[controller]")]
public class VoiceController : ControllerBase
{
    [HttpPost("upload-message")]
    public async Task<IActionResult> UploadVoiceMessage([FromForm] VoiceMessageRequest request)
    {
        // 1. Validate audio file (max 25MB, supported formats)
        // 2. Save audio file to storage (local or cloud)
        // 3. Send to OpenAI Whisper API for transcription
        // 4. Create ChatMessage with audio path and transcript
        // 5. Send via SignalR to conversation participants
        // 6. Return message details
    }

    [HttpPost("transcribe")]
    public async Task<IActionResult> TranscribeAudio([FromForm] IFormFile audioFile)
    {
        // 1. Validate audio file
        // 2. Call OpenAI Whisper API
        // 3. Return transcription text
        // Used for voice-to-text conversion
    }

    [HttpGet("message/{messageId}/audio")]
    public async Task<IActionResult> GetVoiceMessageAudio(int messageId)
    {
        // 1. Get message from database
        // 2. Verify user has access to conversation
        // 3. Return audio file stream
        // 4. Set appropriate content-type headers
    }
}

// Request/Response Models
public class VoiceMessageRequest
{
    public IFormFile AudioFile { get; set; }
    public int BookingId { get; set; }
    public string MessageText { get; set; } // Optional text with voice
}

public class VoiceMessageResponse
{
    public int MessageId { get; set; }
    public string AudioUrl { get; set; }
    public string TranscriptText { get; set; }
    public int DurationSeconds { get; set; }
    public DateTime SentAt { get; set; }
}
````

### **3. Text-to-Speech Endpoints**

````csharp
// TTSController.cs
[ApiController]
[Route("api/[controller]")]
public class TTSController : ControllerBase
{
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateTextToSpeech([FromBody] TTSRequest request)
    {
        // 1. Check cache first using text hash
        // 2. If not cached, call OpenAI TTS API
        // 3. Save audio file to storage
        // 4. Cache the result
        // 5. Return audio URL and duration
    }

    [HttpGet("voices")]
    public async Task<IActionResult> GetAvailableVoices()
    {
        // Return list of available TTS voices
        // ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    }

    [HttpPut("user-preferences")]
    public async Task<IActionResult> UpdateUserVoicePreferences([FromBody] VoicePreferencesRequest request)
    {
        // Update user's TTS preferences in database
        // TTSEnabled, PreferredTTSVoice, VoiceSearchEnabled
    }
}

// Request/Response Models
public class TTSRequest
{
    public string Text { get; set; }
    public string Voice { get; set; } = "alloy";
    public float Speed { get; set; } = 1.0f;
}

public class TTSResponse
{
    public string AudioUrl { get; set; }
    public int DurationSeconds { get; set; }
    public string Voice { get; set; }
    public bool FromCache { get; set; }
}

public class VoicePreferencesRequest
{
    public bool TTSEnabled { get; set; }
    public string PreferredTTSVoice { get; set; }
    public bool VoiceSearchEnabled { get; set; }
}
````

### **4. Configuration Management**

````csharp
// ConfigController.cs
[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    [HttpGet("ai-settings")]
    public async Task<IActionResult> GetAIConfiguration()
    {
        // Return non-sensitive AI configuration
        // DO NOT return API keys in response
    }

    [HttpPut("ai-settings")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAIConfiguration([FromBody] AIConfigRequest request)
    {
        // Admin-only endpoint to update AI settings
        // Threshold values, cache settings, etc.
    }
}
````

---

## **Integration Points**

### **Existing Endpoints - NO CHANGES NEEDED**
- All current chat endpoints continue working unchanged
- All mentor search endpoints continue working unchanged
- All user management endpoints continue working unchanged
- All booking endpoints continue working unchanged

### **Enhanced Endpoints - BACKWARD COMPATIBLE**
- `GET /api/users/mentors` - Add optional `semanticQuery` parameter
- `GET /api/chat/{bookingId}` - Add optional `includeTranscripts` parameter
- `POST /api/chat` - Enhanced to handle voice messages automatically

### **Frontend Integration**
- Search component: Add semantic search toggle
- Chat component: Add voice recording button
- AI chatbot: Add voice output toggle
- All features are optional and don't affect existing functionality

---

## **Why This Approach Works**

### **✅ Zero Breaking Changes**
- New columns have default values
- New tables are independent
- Existing API calls work unchanged
- Features can be enabled/disabled per user

### **✅ Minimal Implementation**
- Only 3 core AI features
- Uses existing chat and search infrastructure
- Progressive enhancement approach
- Each feature is independent

### **✅ High Impact**
- **Better mentor discovery** - semantic search finds relevant mentors
- **Modern chat experience** - voice messages like WhatsApp
- **Accessible AI** - voice output for chatbot responses

### **✅ Secure & Scalable**
- API keys stored in database configuration
- File uploads validated and secured
- Audio files cached for performance
- Rate limiting on AI API calls

This plan gives you **3 powerful AI features** with minimal database changes and zero disruption to existing functionality!

## 🗂️ 1. Database Schema (Forum Tables Only)

**Run these queries to add forum support:**

````sql
-- Forum Categories Table
CREATE TABLE ForumCategories (
    CategoryId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Forum Posts Table
CREATE TABLE ForumPosts (
    PostId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    CategoryId INT FOREIGN KEY REFERENCES ForumCategories(CategoryId),
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    IsSolved BIT DEFAULT 0,
    Upvotes INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    IsDeleted BIT DEFAULT 0
);

-- Forum Comments Table
CREATE TABLE ForumComments (
    CommentId INT PRIMARY KEY IDENTITY(1,1),
    PostId INT FOREIGN KEY REFERENCES ForumPosts(PostId),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    Content NVARCHAR(MAX) NOT NULL,
    IsAnswer BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsDeleted BIT DEFAULT 0
);

-- Forum Post Upvotes Table
CREATE TABLE ForumPostUpvotes (
    UpvoteId INT PRIMARY KEY IDENTITY(1,1),
    PostId INT FOREIGN KEY REFERENCES ForumPosts(PostId),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_ForumPostUpvotes UNIQUE(PostId, UserId)
);
````

---

## 🖥️ 2. Pages & Their Content

### **A. Forum Home Page**
- List all categories (with name, description, post count)
- Show recent posts (title, author, category, upvotes, solved status)
- Show most upvoted posts
- Button: “Create New Post”

### **B. Category Page**
- List all posts in the selected category
- Filters: most recent, most upvoted, unsolved/solved
- Each post: title, author, upvotes, solved status, date
- Button: “Create New Post” (pre-selects this category)

### **C. Post Detail Page**
- Show post title, content, author, date, upvotes, solved status
- List all comments (content, author, date)
- Upvote button for post
- “Mark as Solved” button (visible to post owner)
- Add comment form (textarea + submit)

### **D. Create/Edit Post Page**
- Form: title, content (rich text), category dropdown
- Submit/cancel buttons

### **E. My Posts Page**
- List all posts created by the logged-in user
- Edit/delete buttons for own posts

---

## 🔗 3. API Endpoints

### **Categories**
- `GET /api/forum/categories`  
  List all categories.

### **Posts**
- `GET /api/forum/posts`  
  List all posts (with optional filters: categoryId, search, sort).
- `GET /api/forum/posts/{postId}`  
  Get a single post with all comments.
- `POST /api/forum/posts`  
  Create a new post.
- `PUT /api/forum/posts/{postId}`  
  Edit a post (if owner).
- `DELETE /api/forum/posts/{postId}`  
  Delete a post (if owner).
- `POST /api/forum/posts/{postId}/upvote`  
  Upvote a post (toggle).
- `DELETE /api/forum/posts/{postId}/upvote`  
  Remove upvote.
- `POST /api/forum/posts/{postId}/solve`  
  Mark a post as solved (by post owner).

### **Comments**
- `POST /api/forum/posts/{postId}/comments`  
  Add a comment to a post.
- `PUT /api/forum/comments/{commentId}`  
  Edit a comment (if owner).
- `DELETE /api/forum/comments/{commentId}`  
  Delete a comment (if owner).

### **User Posts**
- `GET /api/forum/users/{userId}/posts`  
  List all posts by a user.

---



## 📝 **Summary**

- **Both mentors and mentees** can create posts and comments.
- “Mark as solved” lets the post owner indicate their question was answered.
- No moderation or admin tools included.
- New tables and endpoints are fully independent—**no impact on your current schema or endpoints**.
- Clear backend/frontend division for efficient teamwork.

If you need sample endpoint code or UI wireframes, just ask!


Absolutely! Here’s a **clear division** for the Community Forum feature so you and Hamdi can work in parallel, with no conflicts—each of you handles separate backend controllers and frontend components.

---

## 🗂️ Database Tables (for reference)

(Use the SQL from the previous answer to create: `ForumCategories`, `ForumPosts`, `ForumComments`, `ForumPostUpvotes`.)

---

## 🛠️ Backend Division

### **You:**  
**Forum Category & Post Management**

- **Controllers:**
  - `ForumCategoryController` (CRUD for categories)
  - `ForumPostController` (CRUD for posts, upvote, mark as solved, get posts by category, get user’s posts)

- **Endpoints you implement:**
  - `GET /api/forum/categories`
  - `POST /api/forum/categories`
  - `GET /api/forum/posts`
  - `GET /api/forum/posts/{postId}`
  - `POST /api/forum/posts`
  - `PUT /api/forum/posts/{postId}`
  - `DELETE /api/forum/posts/{postId}`
  - `POST /api/forum/posts/{postId}/upvote`
  - `DELETE /api/forum/posts/{postId}/upvote`
  - `POST /api/forum/posts/{postId}/solve`
  - `GET /api/forum/users/{userId}/posts`

---

### **Hamdi:**  
**Forum Comment Management**

- **Controller:**
  - `ForumCommentController` (CRUD for comments/replies)

- **Endpoints Hamdi implements:**
  - `POST /api/forum/posts/{postId}/comments`
  - `PUT /api/forum/comments/{commentId}`
  - `DELETE /api/forum/comments/{commentId}`

---

## 🖥️ Frontend Division

### **You:**  
**Forum Structure & Post Management**

- **Components you build:**
  - `ForumHomeComponent` (list categories, recent/popular posts)
  - `ForumCategoryComponent` (list posts in a category)
  - `ForumCreateEditPostComponent` (create/edit post form)
  - `MyForumPostsComponent` (user’s own posts)

---

### **Hamdi:**  
**Post Detail & Comment Management**

- **Components Hamdi builds:**
  - `ForumPostDetailComponent` (view post, list/add/edit/delete comments, upvote, mark as solved)
  - `ForumCommentFormComponent` (add/edit comment form)

---

## 📄 Page Content Details

### **Forum Home**
- List all categories (name, description, post count)
- Recent posts (title, author, upvotes, solved status)
- Most upvoted posts
- “Create New Post” button

### **Category Page**
- List posts in selected category
- Filters: recent, upvoted, solved/unsolved
- “Create New Post” button

### **Post Detail Page**
- Post title, content, author, upvotes, solved status
- List of comments (content, author, date)
- Upvote button
- “Mark as Solved” button (if owner)
- Add comment form

### **Create/Edit Post Page**
- Form: title, content, category dropdown

### **My Posts Page**
- List all posts by logged-in user
- Edit/delete buttons

---

## 📝 Summary

- **You:** Categories, posts, upvotes, solved status (backend & related frontend)
- **Hamdi:** Comments/replies (backend & related frontend)
- **No overlap**—work in parallel, no merge conflicts!

If you need sample controller/component code, just ask!

# A. Add Pinning Support 
  ALTER TABLE ForumPosts ADD IsPinned BIT DEFAULT 0;

  # B. Add Reporting Support
 CREATE TABLE ForumPostReports (
    ReportId INT PRIMARY KEY IDENTITY(1,1),
    PostId INT FOREIGN KEY REFERENCES ForumPosts(PostId),
    ReportedByUserId INT FOREIGN KEY REFERENCES Users(UserId),
    Reason NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(50) DEFAULT 'Pending', -- e.g. Pending, Resolved, Ignored
    AdminNote NVARCHAR(255) NULL
);



