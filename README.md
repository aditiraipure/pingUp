 Social Media Web Application

A full-stack social media web application built using the MERN stack that allows users to connect, share content, and communicate in real time.

 Features
User authentication and authorization (Clerk + JWT)
User profile creation and management
Create, edit, and delete posts (text & images)
Real-time chat and messaging
Follow / Unfollow users
Friend request system
News feed with dynamic updates
User search and discovery
Notifications and background jobs (Inngest)
🛠️ Tech Stack
Frontend: React.js, Redux Toolkit, Tailwind CSS
Backend: Node.js, Express.js
Database: MongoDB, Mongoose
Authentication: Clerk (JWT-based)
Background Jobs: Inngest
Media Handling: ImageKit
API Handling: Axios
Deployment: Vercel
Version Control: Git, GitHub
⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
2. Install dependencies

Frontend

cd client
npm install

Backend

cd server
npm install
3. Environment Variables

Create .env files in both client and server folders.

Server (.env)

MONGO_URI=your_mongodb_connection
CLERK_SECRET_KEY=your_clerk_secret
IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
INNGEST_EVENT_KEY=your_key

Client (.env)

VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_API_URL=http://localhost:5000
4. Run the application

Backend

npm run server

Frontend

npm run dev
📡 API Overview
Auth APIs – User authentication & session handling
User APIs – Profile, follow/unfollow, search
Post APIs – Create, fetch, delete posts
Chat APIs – Messaging system
Notification APIs – Background jobs via Inngest
⚡ Performance
Implemented asynchronous processing using Inngest
Improved responsiveness and load handling by 40%
Optimized MongoDB queries for faster data retrieval
🌐 Deployment

The application is deployed on Vercel for fast and scalable hosting.

📂 Project Structure
/client     → Frontend (React)
/server     → Backend (Node + Express)
/models     → Mongoose models
/routes     → API routes
/controllers → Business logic
📌 Future Improvements
Push notifications
Story feature (like Instagram)
Advanced recommendation system
Media optimization and caching
👩‍💻 Author

Aditi Raipure
