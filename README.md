# Financial Management System

A comprehensive financial management system with role-based access control, built with Node.js, Express, MySQL, and React.

## Features

### 🔐 Authentication & Authorization
- User registration and login with JWT tokens
- Role-based access control (ROLE_USER, ROLE_CLIENT, ROLE_ADMIN)
- Secure password hashing with bcrypt
- Protected routes and middleware

### 💰 Financial Management
- Dashboard with financial overview
- Account management (Savings, Checking, Credit, Investment)
- Transaction tracking with categories
- Real-time balance updates
- Financial analytics and reporting

### 👨‍💼 Admin Panel
- User management and role assignment
- System analytics and metrics
- Comprehensive admin dashboard

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Modern React components with hooks
- Real-time data updates
- Toast notifications
- Loading states and error handling

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Database Schema

### Tables
1. **users** - User information and authentication
2. **roles** - Available system roles
3. **user_roles** - Many-to-many relationship between users and roles
4. **accounts** - Financial accounts linked to users
5. **transactions** - Transaction records for accounts

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### User API (Protected)
- `GET /api/dashboard` - Financial dashboard data
- `GET /api/accounts` - User's accounts
- `GET /api/accounts/{accountId}/transactions` - Account transactions
- `POST /api/accounts` - Create new account
- `POST /api/accounts/{accountId}/transactions` - Add transaction

### Admin API (Admin Only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{userId}` - Get user details
- `GET /api/admin/analytics/overview` - System analytics
- `PUT /api/admin/users/{userId}/roles` - Update user roles
- `DELETE /api/admin/users/{userId}` - Delete user

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Database Configuration**
   - Create a MySQL database named `Fintech`
   - Update database credentials in `db.js`:
     ```javascript
     const db = mysql.createConnection({
       host: 'localhost',
       user: 'your_username',
       password: 'your_password',
       database: 'Fintech'
     });
     ```

3. **Environment Variables** (Optional)
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   JWT_SECRET=your-secret-key-here
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=Fintech
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3001` and will proxy API requests to the backend on `http://localhost:3000`.

## Usage

### Getting Started

1. **Register a new account** at `http://localhost:3001/register`
2. **Login** with your credentials
3. **Create accounts** and start tracking your finances
4. **Add transactions** to monitor your spending and income

### Admin Access

To create an admin user, you can either:
1. Manually update the database to assign ROLE_ADMIN to a user
2. Use the admin API endpoints to manage user roles

### API Testing

You can test the API endpoints using tools like Postman or curl:

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get dashboard data (with JWT token)
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── api.js           # User API routes
│   │   └── admin.js         # Admin API routes
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── db.js                # Database connection
│   ├── createTables.js      # Database schema
│   ├── index.js             # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── public/              # Static files
│   └── package.json
└── README.md
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Role-based Access Control** - Granular permissions
- **Rate Limiting** - Protection against brute force attacks
- **CORS Configuration** - Controlled cross-origin requests
- **Helmet** - Security headers
- **Input Validation** - Server-side validation
- **SQL Injection Protection** - Parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository. 