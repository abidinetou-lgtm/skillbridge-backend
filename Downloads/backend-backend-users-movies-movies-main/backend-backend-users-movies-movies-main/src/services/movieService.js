import prisma from "../models/prisma.js";

// GET ALL (avec pagination simple)
const getAllMovies = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const movies = await prisma.movie.findMany({
        skip,
        take: limit,
        orderBy: {
            createdAt: "desc"
        }
    });

    const total = await prisma.movie.count();

    return {
        data: movies,
        total
    };
};

// GET BY ID
const getMovieById = async (id) => {
    const movie = await prisma.movie.findUnique({
        where: { id }
    });

    if (!movie) {
        const error = new Error("Movie not found");
        error.status = 404;
        throw error;
    }

    return movie;
};

// CREATE
const createMovie = async (movieData) => {
    const movie = await prisma.movie.create({
        data: {
            title: movieData.title,
            description: movieData.description,
            releaseYear: movieData.releaseYear,
            genre: movieData.genre,
            director: movieData.director,
            rating: movieData.rating || 0
        }
    });

    return movie;
};

// UPDATE
const updateMovie = async (id, movieData) => {
    const movie = await prisma.movie.update({
        where: { id },
        data: {
            ...(movieData.title && { title: movieData.title }),
            ...(movieData.description && { description: movieData.description }),
            ...(movieData.releaseYear && { releaseYear: movieData.releaseYear }),
            ...(movieData.genre && { genre: movieData.genre }),
            ...(movieData.director && { director: movieData.director }),
            ...(movieData.rating !== undefined && { rating: movieData.rating })
        }
    });

    return movie;
};

// DELETE
const deleteMovie = async (id) => {
    await prisma.movie.delete({
        where: { id }
    });

    return { message: "Movie deleted successfully" };
};

// SEARCH
const searchMovies = async (title, genre) => {
    const movies = await prisma.movie.findMany({
        where: {
            ...(title && {
                title: {
                    contains: title,
                    mode: "insensitive"
                }
            }),
            ...(genre && {
                genre: {
                    contains: genre,
                    mode: "insensitive"
                }
            })
        }
    });

    return movies;
};

export {
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie,
    searchMovies
};