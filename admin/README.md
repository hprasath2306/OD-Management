# Acadify Admin Panel

This is the admin panel for the Acadify application. It provides a user interface for administrators to manage the application.

## Features

- User authentication (login/signup)
- Dashboard with overview statistics
- Protected routes for authenticated users
- Modern UI with Tailwind CSS

## Technologies Used

- React
- TypeScript
- React Router for routing
- React Hook Form for form handling
- Zod for form validation
- TanStack Query for server state management
- Tailwind CSS for styling
- Axios for API requests

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the admin directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the root directory with the following content:

```
VITE_API_URL=http://localhost:3000/api
```

5. Start the development server:

```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Authentication

The admin panel uses cookie-based authentication with the backend API. Make sure the API server is running before using the admin panel.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint to check for code quality issues
- `npm run preview` - Preview the production build locally
