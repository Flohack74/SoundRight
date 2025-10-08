# SoundRight Setup Guide

This guide will help you set up and run the SoundRight application locally.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SoundRight
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp backend/env.example backend/.env
   
   # Edit the .env file with your configuration
   # The default values should work for development
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Manual Setup

If you prefer to set up each part manually:

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

## Default User Account

After starting the application, you can create your first user account by:

1. Going to http://localhost:3000/register
2. Creating an account with admin role
3. Or use the registration form in the application

## Database

The application uses SQLite for development, which is automatically created when you first run the backend. The database file will be created at `backend/data/soundright.db`.

## API Documentation

The backend API provides the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### Equipment
- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Create equipment
- `GET /api/equipment/:id` - Get equipment details
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment
- `GET /api/equipment/meta/categories` - Get categories
- `GET /api/equipment/meta/stats` - Get statistics

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/equipment` - Get project equipment
- `POST /api/projects/:id/equipment` - Allocate equipment
- `PUT /api/projects/:id/equipment/:equipmentId` - Return equipment

### Quotes
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/:id` - Get quote details
- `PUT /api/quotes/:id` - Update quote
- `DELETE /api/quotes/:id` - Delete quote
- `POST /api/quotes/:id/items` - Add quote item
- `PUT /api/quotes/:id/items/:itemId` - Update quote item
- `DELETE /api/quotes/:id/items/:itemId` - Delete quote item

### Delivery Notes
- `GET /api/delivery` - List delivery notes
- `POST /api/delivery` - Create delivery note
- `GET /api/delivery/:id` - Get delivery note details
- `PUT /api/delivery/:id` - Update delivery note
- `POST /api/delivery/:id/items` - Add delivery item

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/items` - Add invoice item

### Users
- `GET /api/users` - List users (Admin/Manager only)
- `GET /api/users/:id` - Get user details (Admin/Manager only)
- `PUT /api/users/:id` - Update user (Admin/Manager only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/meta/stats` - Get user statistics

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm start
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the PORT in backend/.env
   - Or kill the process using the port

2. **Database issues**
   - Delete the database file and restart the backend
   - Check file permissions in the backend/data directory

3. **CORS issues**
   - Ensure the CORS_ORIGIN in backend/.env matches your frontend URL

4. **Authentication issues**
   - Clear localStorage in your browser
   - Check that the JWT_SECRET is set in backend/.env

### Getting Help

If you encounter any issues:

1. Check the console logs in both frontend and backend
2. Ensure all dependencies are installed
3. Verify environment variables are set correctly
4. Check that both servers are running on the correct ports

## Production Deployment

For production deployment:

1. Set NODE_ENV=production in backend/.env
2. Use a production database (PostgreSQL recommended)
3. Set secure JWT_SECRET
4. Configure proper CORS origins
5. Build the frontend and serve static files
6. Use a process manager like PM2 for the backend

## License

This project is licensed under the MIT License.
