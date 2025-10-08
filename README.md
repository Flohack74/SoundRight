# SoundRight - Sound Equipment Inventory Management System

A comprehensive web application for managing sound equipment inventory, project allocation, quotes, delivery notes, and invoices for live sound applications.

## Features

- **Equipment Inventory Management**: Track all sound equipment with detailed specifications
- **Project Allocation**: Assign equipment to specific projects and events
- **Quote Generation**: Create professional quotes for clients
- **Delivery Notes**: Generate delivery notes for equipment handovers
- **Invoice Creation**: Generate invoices for completed projects
- **User Management**: Secure authentication and role-based access

## Project Structure

```
SoundRight/
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend API
├── docs/             # Documentation
└── README.md         # This file
```

## Quick Start

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Start Development Environment**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Technology Stack

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- React Router
- Axios for API calls

### Backend
- Node.js
- Express.js
- TypeScript
- SQLite (development) / PostgreSQL (production)
- JWT Authentication
- Multer for file uploads

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

## Production Build

```bash
npm run build
npm start
```

## License

MIT License - see LICENSE file for details
