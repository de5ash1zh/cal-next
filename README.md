# Cal.com Clone - Modern Scheduling Platform

A complete, production-ready scheduling platform built with Next.js, featuring a minimal, premium monochrome design with comprehensive functionality.

## ✨ Features

### 🔐 Authentication & User Management
- **Email/Password Authentication** - Secure user registration and login
- **Google OAuth Integration** - One-click sign-in with Google accounts
- **Session Management** - Persistent authentication with NextAuth.js
- **User Profiles** - Customizable user profiles with avatars and settings

### 📅 Event Type Management
- **Custom Event Types** - Create events with custom durations, descriptions, and pricing
- **Meeting Links Integration** - Automatic Zoom and Google Meet link generation
- **Custom Fields** - Collect additional information from attendees (text, dropdown, checkbox, etc.)
- **Event Templates** - Duplicate and customize event types
- **Active/Inactive Toggle** - Control which events accept bookings

### 📱 Mobile-First Design
- **Responsive Dashboard** - Mobile-friendly sidebar and navigation
- **Touch Gestures** - Swipe actions for mobile booking flow
- **Mobile Booking Flow** - Touch-optimized calendar and forms
- **Progressive Web App** - Works seamlessly across all devices

### 📊 Analytics & Insights
- **Comprehensive Dashboard** - Real-time booking statistics and insights
- **Performance Metrics** - Conversion rates, revenue tracking, and trends
- **Top Event Types** - Most popular events by booking count
- **Time Range Filtering** - 7, 30, 90 days, and yearly views

### 🔒 Security & Performance
- **Database Indexing** - Optimized query performance
- **API Rate Limiting** - Prevent abuse with configurable limits
- **Input Validation** - Zod schemas for all forms
- **Error Boundaries** - Comprehensive error handling
- **Loading States** - Skeleton loaders and smooth transitions

### 🎨 Design Philosophy
- **Minimal & Premium** - Clean, professional monochrome design
- **Light Mode Only** - Consistent bright appearance
- **Premium Typography** - Clear hierarchy and readability
- **Intuitive UX** - Easy-to-understand interface
- **Accessibility** - WCAG compliant design patterns

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- SQLite (or PostgreSQL for production)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Initialize the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Frontend
- **Next.js 15** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful, customizable icons
- **React Hook Form** - Performant forms with validation
- **Zod** - TypeScript-first schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database queries
- **SQLite** - Lightweight database (PostgreSQL for production)
- **NextAuth.js** - Authentication framework
- **Rate Limiting** - API abuse prevention

### Database Schema
- **Users** - User accounts and profiles
- **Event Types** - Configurable event templates
- **Bookings** - Appointment scheduling
- **Availability** - Weekly schedule management
- **Custom Fields** - Dynamic form fields
- **Analytics** - Performance tracking

## 📱 Mobile Features

### Touch Gestures
- **Swipe Navigation** - Left/right swipes between booking steps
- **Touch-Friendly Buttons** - Optimized for mobile interaction
- **Responsive Calendar** - Mobile-optimized date selection
- **Progressive Forms** - Step-by-step booking process

### Mobile Booking Flow
1. **Date Selection** - Visual calendar with available dates
2. **Time Selection** - Available time slots for chosen date
3. **Details Entry** - Attendee information and custom fields
4. **Confirmation** - Review and confirm booking details

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler

### Event Types
- `GET /api/event-types` - List user's event types
- `POST /api/event-types` - Create new event type
- `GET /api/event-types/[id]` - Get specific event type
- `PUT /api/event-types/[id]` - Update event type
- `DELETE /api/event-types/[id]` - Delete event type

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get specific booking
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking

### Availability
- `GET /api/availability` - Get user's availability
- `POST /api/availability` - Set availability
- `PUT /api/availability` - Update availability
- `DELETE /api/availability` - Remove availability
- `GET /api/availability/slots` - Get available time slots

### Analytics
- `GET /api/analytics` - Get comprehensive analytics data

## 🎨 Customization

### Design System
- **Color Palette** - Monochrome grays with premium accents
- **Typography** - Clear hierarchy with proper spacing
- **Components** - Reusable UI components with consistent styling
- **Animations** - Smooth transitions and micro-interactions

### Custom Fields
- **Field Types** - Text, textarea, select, radio, checkbox, number, email, phone, date, time
- **Validation** - Required/optional field configuration
- **Options** - Custom dropdown and radio button choices
- **Ordering** - Flexible field arrangement

### Meeting Links
- **Zoom Integration** - Automatic meeting link generation
- **Google Meet** - Seamless video meeting setup
- **Template URLs** - Dynamic meeting ID replacement
- **Booking Integration** - Links automatically added to confirmations

## 🚀 Deployment

### Production Setup
1. **Database** - Use PostgreSQL for production
2. **Environment** - Set production environment variables
3. **Authentication** - Configure production OAuth providers
4. **Rate Limiting** - Implement Redis-based rate limiting
5. **Monitoring** - Add error tracking and analytics

### Deployment Options
- **Vercel** - Zero-config deployment
- **Netlify** - Git-based deployment
- **AWS** - Scalable cloud infrastructure
- **Docker** - Containerized deployment

## 🔒 Security Features

### Authentication
- **Password Hashing** - bcrypt with salt rounds
- **Session Management** - Secure, encrypted sessions
- **OAuth Security** - Secure third-party authentication
- **CSRF Protection** - Cross-site request forgery prevention

### API Security
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Comprehensive data validation
- **SQL Injection Protection** - Prisma ORM security
- **Error Handling** - Secure error messages

### Data Protection
- **User Isolation** - Users can only access their own data
- **Input Sanitization** - Clean, safe data storage
- **Audit Logging** - Track important actions
- **Privacy Controls** - User data management

## 📊 Performance

### Optimization
- **Database Indexing** - Optimized query performance
- **Lazy Loading** - On-demand component loading
- **Image Optimization** - Next.js image optimization
- **Code Splitting** - Automatic bundle optimization

### Monitoring
- **Performance Metrics** - Core Web Vitals tracking
- **Error Tracking** - Comprehensive error monitoring
- **Analytics** - User behavior insights
- **Uptime Monitoring** - Service availability tracking

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- **TypeScript** - Type-safe development
- **ESLint** - Code quality enforcement
- **Prettier** - Consistent code formatting
- **Husky** - Git hooks for quality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cal.com** - Inspiration for the scheduling platform
- **Next.js Team** - Amazing React framework
- **Vercel** - Deployment and hosting platform
- **Open Source Community** - Countless contributions

## 📞 Support

For support and questions:
- **Issues** - GitHub issue tracker
- **Documentation** - Comprehensive guides and API docs
- **Community** - Active developer community
- **Email** - Direct support contact

---

Built with ❤️ using modern web technologies
