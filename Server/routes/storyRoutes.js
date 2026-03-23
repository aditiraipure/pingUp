import express from "express";

const storyRouter = express.Router();

import { addUserStory, getStories } from "../controllers/storyController.js";
import { Protect } from "../middlewares/auth.js";
import upload from "../configs/multer.js";

storyRouter.post('/create', Protect, upload.single('media'), addUserStory);
storyRouter.get('/get', Protect, getStories);

export default storyRouter;