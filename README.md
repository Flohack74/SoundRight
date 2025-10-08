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

1. **Check System Requirements**
   ```bash
   node check-node-version.js
   ```

2. **Install Dependencies**
   ```bash
   npm run install-all
   ```

3. **Start Development Environment**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Technology Stack

### Frontend
- React 18.3+
- TypeScript 5.6+
- Material-UI (MUI) 5.15+
- React Router 6.26+
- Axios 1.7+

### Backend
- Node.js 22.x (LTS)
- Express.js 4.19+
- TypeScript 5.6+
- SQLite (development) / PostgreSQL (production)
- JWT Authentication
- Multer for file uploads

## System Requirements

- **Node.js**: 22.0.0 or higher
- **npm**: 10.0.0 or higher
- **Memory**: 2GB RAM minimum (4GB recommended)
- **Storage**: 1GB free space minimum
- **Platform**: Linux, macOS, or Windows

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
