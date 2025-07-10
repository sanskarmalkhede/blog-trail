# BlogTrail Backend

A Node.js/Express.js REST API for the BlogTrail blog application with JWT authentication and PostgreSQL database.

## 📁 Project Structure

```
backend/
├── auth/                    # Authentication modules
│   ├── index.js            # Main auth router
│   ├── login.js            # Login functionality
│   └── signup.js           # Signup functionality
├── middleware/             # Express middleware
│   └── auth.middleware.js  # JWT authentication middleware
├── db.js                   # Database connection and configuration
├── server.js               # Main server file and API routes
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── docker-compose.yml      # Docker setup for database
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/blog_trail
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   JWT_EXPIRES_IN=24h
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb blog_trail
   
   # Or use Docker
   docker-compose up -d
   ```

4. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` and automatically create the required database tables.

## 🗄️ Database Schema

The application uses PostgreSQL with the following tables:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Likes Table
```sql
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (post_id, user_id)
);
```

## 🔐 Authentication System

### JWT-based Authentication
- **Token Generation**: Upon successful login/signup
- **Token Expiration**: Configurable via `JWT_EXPIRES_IN`
- **Password Security**: bcrypt hashing with salt rounds

### Auth Module Structure
- **`auth/index.js`**: Main router combining all auth routes
- **`auth/login.js`**: Login logic and JWT token generation
- **`auth/signup.js`**: User registration with password hashing

### Protected Routes
Routes requiring authentication use the `requireAuth` middleware:
```javascript
app.post('/posts', requireAuth, createPost);
```

## 📡 API Endpoints

### Authentication Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | User registration | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/me` | Get current user info | Yes |

### Post Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/posts` | Get all posts with author info | No |
| POST | `/posts` | Create a new post | Yes |
| PUT | `/posts/:id` | Update post (owner only) | Yes |
| DELETE | `/posts/:id` | Delete post (owner only) | Yes |

### Like Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/posts/:id/like` | Like a post | Yes |
| POST | `/posts/:id/unlike` | Unlike a post | Yes |

### Comment Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/posts/:id/comments` | Add comment to post | Yes |
| DELETE | `/comments/:id` | Delete comment (owner only) | Yes |

## 🛠️ Core Files

### `server.js`
- Main application entry point
- Express server configuration
- Database initialization
- Route definitions
- CORS configuration

### `db.js`
- PostgreSQL connection pool
- Database configuration
- Error handling for DB connections

### `middleware/auth.middleware.js`
- JWT token verification
- Request authentication
- User context injection

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/blog_trail` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` |

## 📊 Features

### Security Features
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ CORS configuration
- ✅ SQL injection prevention (parameterized queries)
- ✅ Authorization checks (owner-only actions)

### Database Features
- ✅ Automatic table creation
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Cascade deletes
- ✅ Unique constraints

### API Features
- ✅ RESTful design
- ✅ JSON responses
- ✅ Error handling
- ✅ CORS support
- ✅ Request logging

## 🧪 Testing

### Manual Testing
Use tools like Postman or curl to test endpoints:

```bash
# Register user
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Create post (with token)
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"My Post","content":"Post content here"}'
```

## 📚 Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **pg** - PostgreSQL client for Node.js

## 🚀 Deployment

### Production Considerations
1. Use strong JWT secrets
2. Set secure CORS origins
3. Use environment variables for all config
4. Enable SSL/TLS
5. Set up proper logging
6. Use connection pooling
7. Implement rate limiting

### Docker Support
```bash
# Start database with Docker
docker-compose up -d

# Build and run the application
docker build -t blog-trail-backend .
docker run -p 3000:3000 blog-trail-backend
```

## 📝 Development

### Scripts
- `npm start` - Start server with nodemon (development)
- `npm test` - Run tests (when implemented)
- `npm run build` - Build for production (when implemented)

### Code Style
- ES6+ JavaScript
- Async/await for asynchronous operations
- Modular architecture
- Clear error handling
- Parameterized SQL queries

## 🔄 Future Enhancements

1. **Testing Suite** - Unit and integration tests
2. **API Documentation** - OpenAPI/Swagger documentation
3. **Rate Limiting** - Prevent API abuse
4. **Email Verification** - Email-based account verification
5. **Password Reset** - Forgot password functionality
6. **File Upload** - Image upload for posts
7. **Search** - Full-text search for posts
8. **Caching** - Redis for session and data caching
9. **Logging** - Structured logging with Winston
10. **Monitoring** - Health checks and metrics 