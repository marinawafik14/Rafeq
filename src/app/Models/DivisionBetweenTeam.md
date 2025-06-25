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
