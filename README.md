# Task Management System

A full-stack task management application built with React.js, Node.js, and MongoDB. This system supports two user roles: ADMIN and EMPLOYEE, with role-based access control and task assignment functionality.

## Features

### Admin Features
- **Dashboard**: View statistics and recent tasks
- **Employee Management**: Look up employees by ID and view their details
- **Task Assignment**: Create and assign tasks to available employees
- **Employee Availability**: Override employee availability status
- **Analytics**: View task completion rates and performance metrics
- **Document Management**: Upload documents with tasks

### Employee Features
- **Task Viewing**: View assigned tasks with full details
- **Status Updates**: Update task status (Pending, In Progress, Completed, Cancelled)
- **Availability Management**: Update personal availability and leave status
- **Document Access**: Download task-related documents
- **Comments**: Add comments to tasks for communication

### Key Business Rules
- Only one task can be assigned to an employee at a time
- Employees must be available and not on leave to receive new tasks
- Admins can only assign tasks to available employees
- Task status updates are tracked with timestamps
- Document uploads are supported for task attachments

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React.js** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management
- **CSS3** for styling

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the project root directory
2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskmanagement
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. Start the backend server:
   ```bash
   npm run server
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

### Running Both Services

From the root directory, you can run both services simultaneously:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/documents` - Upload document
- `GET /api/tasks/documents/:filename` - Download document

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:employeeId` - Get employee by ID
- `PUT /api/employees/availability` - Update availability
- `GET /api/employees/tasks/my-tasks` - Get employee's tasks
- `PUT /api/employees/tasks/:id/status` - Update task status
- `POST /api/employees/tasks/:id/comments` - Add comment

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/employees` - Get employees with filters
- `GET /api/admin/employees/:employeeId` - Get employee details
- `PUT /api/admin/employees/:employeeId/availability` - Update employee availability
- `GET /api/admin/analytics` - Get analytics data

## Database Schema

### User Model
- employeeId (String, unique)
- name (String)
- email (String, unique)
- password (String, hashed)
- role (ADMIN | EMPLOYEE)
- department (String)
- position (String)
- isAvailable (Boolean)
- leaveStatus (AVAILABLE | ON_LEAVE | UNAVAILABLE)
- leaveStartDate (Date)
- leaveEndDate (Date)
- currentTask (ObjectId ref to Task)

### Task Model
- title (String)
- description (String)
- assignedBy (ObjectId ref to User)
- assignedTo (ObjectId ref to User)
- status (PENDING | IN_PROGRESS | COMPLETED | CANCELLED)
- priority (LOW | MEDIUM | HIGH | URGENT)
- dueDate (Date)
- completedAt (Date)
- documents (Array of document objects)
- comments (Array of comment objects)

## Usage

### For Administrators

1. **Login** with admin credentials
2. **View Dashboard** to see system statistics
3. **Look up Employees** by entering their Employee ID
4. **Create Tasks** and assign them to available employees
5. **Monitor Progress** through the dashboard and task lists
6. **Upload Documents** to provide additional context for tasks

### For Employees

1. **Login** with employee credentials
2. **View Assigned Tasks** on the dashboard
3. **Update Task Status** as work progresses
4. **Manage Availability** by setting leave status
5. **Download Documents** related to tasks
6. **Add Comments** to communicate with administrators

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- File upload restrictions
- CORS configuration

## File Structure

```
task-management-system/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   ├── employees.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
├── uploads/
│   └── tasks/
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.