 PingUp — MERN Social Media Web App

PingUp is a full-stack social media platform built using the MERN stack (MongoDB, Express.js, React.js, Node.js). It allows users to create accounts, connect with others, share posts, upload media, and interact in real time through a modern and responsive interface.

This project showcases a complete web application with authentication, media upload, real-time workflows, and optimized performance, demonstrating real-world full-stack development skills.

🔹 Features
# Core Functionality

User Authentication with secure sign-up and login

Create, Edit & Delete Posts

Like and Share Posts

User Profile Management

Follow / Unfollow Other Users

Responsive UI for Web and Mobile Screens

# Media & Performance

Image Upload & Optimization

Efficient Media Storage

Fast Loading & Smooth Interface

# Technical Workflow

Authentication & user sessions

Full CRUD for posts & comments

Media handling with optimized delivery

Event-driven updates and background workflows

# Tech Stack

Frontend -React.js,Tailwind CSS,React Router
Backend - Node.js,Express.js
Database-MongoDB with Mongoose ODM

Authentication & Services-Clerk (Authentication & User Management),Inngest (Event-Driven Workflows),ImageKit (Image Storage & Optimization)

Tools

Git & GitHub

VS Code

Postman / Insomnia for API testing

# Features Breakdown

 -Secure Authentication: Powered by Clerk for user login and session management

 -Optimized Media Upload: Images stored and delivered via ImageKit

- Background Jobs & Events: Inngest for scalable event handling

-Clean Architecture: Modular frontend and backend code structure

- Responsive UI: Works seamlessly on desktop and mobile

# Getting Started
1. Clone the repo
git clone https://github.com/aditiraipure/pingUp.git

2. Install dependencies
npm install

3. Configure environment

Create a .env file with:

MONGO_URI = <your MongoDB URI>
CLERK_API_KEY = <Clerk API key>
IMAGEKIT_PRIVATE_KEY = <ImageKit key>
INGNEST_SECRET = <Inngest secret>

4. Start the App

Backend - npm run server

Frontend-npm start

# How It Works

User registers or logs in via Clerk.

User creates posts with text & media.

Posts are saved to MongoDB and optimized via ImageKit.

Inngest handles background workflows and events.

Users interact in real time with a responsive UI.

# Learning & Impact

By building PingUp, you learn:

Connecting frontend & backend in a real project

Using third-party tools for authentication & media

Event-based workflows and app optimization

Full MERN stack development with best practices

# Future Enhancements

Add comments and nested replies

Real-time chat or notifications

“Stories” feature with auto-expiry

Progressive Web App (PWA) support

# Acknowledgements

Project built using ideas from MERN tutorials and adapted with custom logic, authentication, and media workflows.
