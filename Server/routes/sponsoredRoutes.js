import express from "express";
import { Protect } from "../middlewares/auth.js";
import { getSponsoredAds } from "../controllers/sponsoredController.js";

const sponsoredRouter = express.Router();

sponsoredRouter.get("/", Protect, getSponsoredAds);

export default sponsoredRouter;
