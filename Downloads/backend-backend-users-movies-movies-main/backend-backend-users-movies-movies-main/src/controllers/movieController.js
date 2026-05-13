import * as movieService from "../services/movieService.js";

// GET ALL
const getAllMovies = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const result = await movieService.getAllMovies(
            parseInt(page),
            parseInt(limit)
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

// GET BY ID
const getMovieById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const movie = await movieService.getMovieById(id);
        res.json(movie);
    } catch (error) {
        next(error);
    }
};

// CREATE
const createMovie = async (req, res, next) => {
    try {
        const { title, releaseYear, genre, director } = req.body;

        if (!title || !releaseYear || !genre || !director) {
            return res.status(400).json({
                message: "title, releaseYear, genre and director are required"
            });
        }

        const movie = await movieService.createMovie(req.body);
        res.status(201).json(movie);
    } catch (error) {
        next(error);
    }
};

// UPDATE
const updateMovie = async (req, res, next) => {
    try {
        const { id } = req.params;
        const movie = await movieService.updateMovie(id, req.body);
        res.json(movie);
    } catch (error) {
        next(error);
    }
};

// DELETE
const deleteMovie = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await movieService.deleteMovie(id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// SEARCH
const searchMovies = async (req, res, next) => {
    try {
        const { title, genre } = req.query;
        const movies = await movieService.searchMovies(title, genre);
        res.json(movies);
    } catch (error) {
        next(error);
    }
};

export {
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie,
    searchMovies
};