import { Router } from "express";
import * as movieController from "../controllers/movieController.js";
import authenticate from "../middlewares/authenticate.js";

const router = Router();

// 🔒 Toutes les routes protégées
router.get("/movies", authenticate, movieController.getAllMovies);
router.get("/movies/search", authenticate, movieController.searchMovies);
router.get("/movies/:id", authenticate, movieController.getMovieById);
router.post("/movies", authenticate, movieController.createMovie);
router.put("/movies/:id", authenticate, movieController.updateMovie);
router.delete("/movies/:id", authenticate, movieController.deleteMovie);

export default router;