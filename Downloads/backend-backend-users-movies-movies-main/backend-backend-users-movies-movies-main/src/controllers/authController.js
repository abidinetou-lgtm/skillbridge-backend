import * as authService from "../services/authService.js";

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required!!"
            });
        }

        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Email, password and name are required!!"
            });
        }

        const result = await authService.register(email, password, name);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

// 🔥 NOUVEAU
const getMe = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await authService.getMe(userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export { 
    login,
    register,
    getMe
};