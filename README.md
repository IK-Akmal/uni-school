# School Management System

A modern desktop application for managing school operations including students, groups, and payments. Built with Tauri, React, and TypeScript.

## Features

- **Student Management**: Add, edit, and manage student information
- **Group Management**: Create and organize student groups
- **Payment Management**: Create, edit, and track all payment records with filtering
- **Statistics & Analytics**: View dashboard with growth trends and payment analytics
- **Notifications**: Get alerts for overdue payments
- **Modern UI**: Clean, responsive interface built with Ant Design

## Tech Stack

### Frontend

- **React 18.3.1** - UI framework
- **TypeScript 5.x** - Type-safe JavaScript
- **Ant Design 5.25.1** - UI component library
- **Redux Toolkit 2.8.1** - State management
- **RTK Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Day.js 1.11.13** - Date manipulation
- **Recharts** - Data visualization

### Backend

- **Tauri 2.0** - Desktop app framework
- **Rust** - Backend runtime
- **SQLite 3.x** - Database

### Plugins & Tools

- **Vite 5.x** - Build tool and dev server
- **Tauri SQL Plugin 2.2.0** - Database integration
- **Tauri Opener Plugin 2.x** - External link handling

## Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **npm** or **yarn**

## Getting Started

### Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd school
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run tauri dev
   ```

### Building

1. **Build for production**
   ```bash
   npm run tauri build
   ```

## Project Structure

```
src/
├── app/                 # App configuration and routing
├── features/           # Feature-based components
├── pages/              # Page components
├── shared/             # Shared utilities and components
│   ├── api/           # API layer (RTK Query)
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── widgets/            # Complex UI widgets
└── main.tsx           # App entry point

src-tauri/
├── migrations/         # Database migrations
├── src/               # Rust backend code
└── tauri.conf.json    # Tauri configuration
```

## Database Schema

The application uses SQLite with the following main tables:

- `student` - Student information
- `group_entity` - Group/class information
- `student_group` - Many-to-many relationship between students and groups
- `payment` - Payment records
- `student_payment` - Links payments to students

## UI Guidelines

- All UI text is in English
- Code comments are in Russian
- Uses Ant Design components for consistency
- Responsive design principles
- Modern, clean interface

## Development Notes

- Uses RTK Query for efficient data fetching and caching
- Implements proper error handling and loading states
- Follows TypeScript best practices
- Database operations use transactions where appropriate
- Modular architecture with feature-based organization

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

This project is licensed under the MIT License.
