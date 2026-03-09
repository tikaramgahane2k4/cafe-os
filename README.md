# Café Owner Panel - Digital Menu System

Complete café management system with digital menu, staff management, inventory control, and customer CRM.

## Features

### 1. Digital Menu Management
- Add, edit, delete menu items
- Upload food images
- Set item prices
- Organize by categories (Coffee, Snacks, Desserts, Beverages)

### 2. Inventory Control
- Mark items as in-stock or out-of-stock
- Real-time inventory updates

### 3. Staff Management
- Add staff members
- Assign roles (Manager, Waiter, Chef, Cashier)
- Manage permissions

### 4. Customer CRM
- View customer visit history
- Track customer orders
- Monitor loyalty points

## Setup Instructions

### Backend Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start MongoDB (make sure MongoDB is running on your system)

3. Create admin account:
```bash
node setup.js
```

4. Start server:
```bash
npm start
```

Server runs on http://localhost:5000

### Frontend Setup

1. Install dependencies:
```bash
cd client
npm install
```

2. Start development server:
```bash
npm run dev
```

Client runs on http://localhost:5173

## Default Admin Credentials

**Email:** admin@cafe.com  
**Password:** admin123

## API Endpoints

### Authentication
- POST `/api/auth/login` - Owner login
- POST `/api/auth/create-admin` - Create default admin

### Menu Management
- GET `/api/menu` - Get all menu items
- POST `/api/menu` - Add menu item
- PUT `/api/menu/:id` - Update menu item
- DELETE `/api/menu/:id` - Delete menu item
- PATCH `/api/menu/:id/stock` - Update stock status

### Staff Management
- GET `/api/staff` - Get all staff
- POST `/api/staff` - Add staff member
- PUT `/api/staff/:id` - Update staff member
- DELETE `/api/staff/:id` - Delete staff member

### Customer CRM
- GET `/api/customers` - Get all customers
- GET `/api/customers/:id` - Get customer details

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- React
- React Router
- CSS3

## Project Structure

```
cafe-os/
├── server/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── server.js        # Main server file
│   └── setup.js         # Admin setup script
└── client/
    └── src/
        ├── pages/Owner/ # Owner dashboard pages
        ├── routes/      # Route configuration
        └── services/    # API service
```
