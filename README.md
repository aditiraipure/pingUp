# 📱 Social Media Web Application

A full-stack social media web application built using the MERN stack that enables users to connect, share content, and communicate in real time.

---

##  Features
- User authentication and authorization (Clerk + JWT)
- Profile creation and management
- Real-time chat and messaging
- Follow / Unfollow users
- Friend request system
- News feed with dynamic updates
- User search and discovery
- Notifications and background jobs (Inngest)

---

##  Tech Stack
- React.js, Redux Toolkit, Tailwind CSS
- Node.js, Express.js
- MongoDB, Mongoose
- Clerk (JWT-based authentication)
- Inngest (background jobs)
- ImageKit (media handling)
- Axios (API handling)
- Vercel (deployment)
- Git, GitHub

---


##  Environment Variables
- Server:
  - MONGO_URI=your_mongodb_connection
  - CLERK_SECRET_KEY=your_clerk_secret
  - IMAGEKIT_PUBLIC_KEY=your_key
  - IMAGEKIT_PRIVATE_KEY=your_key
  - INNGEST_EVENT_KEY=your_key
- Client:
  - VITE_CLERK_PUBLISHABLE_KEY=your_key
  - VITE_API_URL=http://localhost:5000

---

## Run Application
- Backend: `npm run server`
- Frontend: `npm run dev`

---

##  API Overview
- Auth APIs – Authentication & session handling
- User APIs – Profile, follow/unfollow, search
- Post APIs – Create, fetch, delete posts
- Chat APIs – Messaging system
- Notification APIs – Background jobs via Inngest

---

##  Deployment
- Deployed on Vercel for scalable cloud hosting
- CI/CD enabled for seamless builds and updates

---

##  Performance Optimization
- Improved responsiveness by 40%
- Optimized MongoDB queries
- Used async processing with Inngest

---

##  Security
- Clerk-based authentication (JWT)
- Protected routes and secure data handling

---

##  Core Features
- Real-time chat and messaging
- Dynamic news feed
- Follow/Unfollow and friend requests
- User search and discovery

---

##  Responsive Design
- Fully responsive UI
- Works on desktop, tablet, and mobile

---

## 📚 Learning Outcomes
- Full-stack MERN development
- REST API design and integration
- Real-time features and async workflows
- State management using Redux Toolkit

---

##  Project Structure
- /client → Frontend (React)
- /server → Backend (Node + Express)
- /models → Database models
- /routes → API routes
- /controllers → Business logic

---

##  Future Improvements
- Push notifications
- Story feature
- Recommendation system
- Media optimization

---

## 👩‍💻 Author
Aditi Raipure
