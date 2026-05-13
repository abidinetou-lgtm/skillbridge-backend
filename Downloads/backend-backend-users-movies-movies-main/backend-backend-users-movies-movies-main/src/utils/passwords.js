import bcrypt from "bcryptjs";

export const hashPassword = async (password) =>{
    const hashPassword = await bcrypt.hash(password, 10);

    return hashPassword;
};

export const comparePasswords = async (password, passwordHash) =>{
    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    return isPasswordValid;
};