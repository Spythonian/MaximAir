# Iconic FM Backend API

A complete Node.js backend for the Iconic FM radio station website with authentication, file uploads, and episode management.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Episode Management** - CRUD operations for radio episodes with file uploads
- **User Management** - Admin panel for managing users and permissions
- **File Uploads** - Support for audio files and episode images
- **RESTful API** - Clean, documented API endpoints
- **Database** - MongoDB with Mongoose ODM
- **Security** - Helmet, CORS, rate limiting, input validation

## 🛠️ Tech Stack

- **Node.js** with TypeScript
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

## 📦 Installation

1. **Clone and install dependencies:**
```bash
cd iconic-fm-backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB** (make sure MongoDB is running on your system)

4. **Seed the database:**
```bash
npm run seed
```

5. **Start the development server:**
```bash
npm run dev
```

## 🔐 Default Login Credentials

After running the seed script:

- **Admin:** admin@iconicfm.com / admin123
- **Editor:** editor@iconicfm.com / editor123

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Episodes
- `GET /api/episodes/public` - Get published episodes (public)
- `GET /api/episodes` - Get all episodes (admin/editor)
- `POST /api/episodes` - Create episode (admin/editor)
- `PUT /api/episodes/:id` - Update episode (admin/editor)
- `DELETE /api/episodes/:id` - Delete episode (admin/editor)
- `POST /api/episodes/:id/play` - Increment play count

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### File Uploads
Episodes support file uploads for:
- Audio files (audioFile field)
- Episode images (imageFile field)

## 🏗️ Project Structure

```
src/
├── middleware/
│   ├── auth.ts          # Authentication middleware
│   └── upload.ts        # File upload middleware
├── models/
│   ├── User.ts          # User model
│   └── Episode.ts       # Episode model
├── routes/
│   ├── auth.ts          # Authentication routes
│   ├── episodes.ts      # Episode routes
│   └── users.ts         # User routes
├── scripts/
│   └── seed.ts          # Database seeding
└── server.ts            # Main server file
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Request rate limiting
- Input validation and sanitization
- CORS protection
- Security headers with Helmet

## 🚀 Deployment

1. **Build the project:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm start
```

## 📝 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/iconic-fm
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50000000
```

## 🧪 Testing

The API includes comprehensive error handling and validation. Test endpoints using tools like Postman or curl.

## 📄 License

MIT License