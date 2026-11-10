import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import sponsoredRouter from "./routes/sponsoredRoutes.js";

const app = express();

// Ensure DB is connected before processing requests
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection error in middleware:", err);
  }
  next();
});

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://pingup-app-swart.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("Server is running"));

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/message", messageRouter);
app.use("/api/sponsored", sponsoredRouter);

const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  app.listen(PORT, () =>
    console.log(`Server is running on port ${PORT}`)
  );
}

export default app;
