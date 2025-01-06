import bcrypt from 'bcrypt';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { CustomError } from '../app';
import { User } from '@prisma/client';

interface JwtPayload {
    userId: string;
    role: string;
}

export const authenticateToken = async (req: Request & { user?: Partial<User> }, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await prisma.user.findUnique({ where: { id: +decoded.userId } });
        if (!user) {
            const error = new CustomError('Unauthorized: Invalid token.', 401);
            next(error);
            return;
        }
        // Qui posso fare ulteriori controlli sull'utente se necessario

        // Aggiungo l'utente autenticato all'oggetto della request per essere riutilizzato dal middleware successivo
        const { password, ...userData } = user;
        req.user = userData;

        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
        return;
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, confirmPassword, name, lastName, role, avatar } = req.body;

        if (password !== confirmPassword) {
            res.status(400).json({ error: 'Passwords do not match' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                lastName,
                role: role || 'USER',
                avatar: avatar || "src/public/assets/avatars/graduation-cap.gif"
            }
        });

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error creating user' });
    }
};


export const updateUser = async (req: Request, res: Response) => {
    try {
        const { email, password, confirmPassword, name, lastName, role, avatar } = req.body;
        const userId = Number(req.params.id);

        if (password && password !== confirmPassword) {
            res.status(400).json({ error: 'Passwords do not match' });
            return;
        }

        const updateData: any = {};

        if (name) updateData.name = name;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (avatar) updateData.avatar = avatar;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        if (role === 'STUDENT' || role === 'PROFESSOR') {
            const userForExternalUpdate = {
                name: updatedUser.name,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
            };

            try {
                const externalApiUrl = role === 'STUDENT'
                    ? `http://localhost:8080/student/${userId}`
                    : `http://localhost:8080/professor/${userId}`;

                const response = await fetch(externalApiUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userForExternalUpdate),
                });

                if (response.ok) {
                    res.status(200).json(updatedUser);
                } else {
                    const errorData = await response.json();
                    res.status(500).json({ error: `Failed to update user in external system: ${errorData.message || 'Unknown error'}` });
                }
            } catch (error) {
                console.log('Error updating in external system:', error);
                res.status(500).json({ error: 'Error updating user in external system' });
            }
        } else {
            res.status(200).json(updatedUser);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error updating user' });
    }
};



export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });

    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
};

export const user = async (req: Request & { user?: any }, res: Response): Promise<any> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.user.id) },
            select: {
                id: true,
                email: true,
                name: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.log(error);

        res.status(500).json({ error: 'Error fetching user data' });
    }
};


export const updateUserRole = async (req: Request & { user?: any }, res: Response): Promise<any> => {
    const { id } = req.params;
    const { role, classID } = req.body;

    if (!role || !['STUDENT', 'PROFESSOR', 'USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(id),
        },
    });


    if (user?.role === "USER") {
        try {
            const user = await prisma.user.update({
                where: { id: parseInt(id) },
                data: { role },
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const userData = {
                userId: user.id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
            };

            if (role === 'STUDENT') {
                await fetch("http://localhost:8080/student", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...userData }),
                })
                    .then(response => response.json())
                    .then(data => {
                        const studentId = data.id;
                        return fetch("http://localhost:8080/course-class-student", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                studentID: studentId,
                                courseClassID: classID
                            }),
                        });
                    })
                    .then(() => {
                        console.log("Student successfully enrolled in course class.");
                    })
                    .catch((err) => {
                        console.error("Error:", err);
                    });
            } else if (role === 'PROFESSOR') {
                await fetch("http://localhost:8080/professor", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...userData }),
                })
                    .then(response => response.json())
                    .then(data => {
                        const professorId = data.id;
                        return fetch("http://localhost:8080/course-class-professor", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                professorID: professorId,
                                courseClassID: classID
                            }),
                        });
                    })
                    .then(() => {
                        console.log("Professor successfully assigned to course class.");
                    })
                    .catch((err) => {
                        console.error("Error:", err);
                    });
            }

            return res.status(200).json({ message: `${role} role assigned successfully` });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Failed to update role or communicate with backend Java" });
        }

    } else {
        try {
            if (role === "STUDENT") {
                await fetch(`http://localhost:8080/student/user/${id}`)
                    .then(response => response.json())
                    .then(data => {
                        const studentId = data.id;
                        return fetch("http://localhost:8080/course-class-student", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                studentID: studentId,
                                courseClassID: classID
                            }),
                        });
                    });
            } else if (role === "PROFESSOR") {
                await fetch(`http://localhost:8080/professor/user/${id}`)
                    .then(response => response.json())
                    .then(data => {
                        const professorId = data.id;
                        return fetch("http://localhost:8080/course-class-professor", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                professorID: professorId,
                                courseClassID: classID
                            }),
                        });
                    });
            }

            return res.status(200).json({ message: `${role} role assigned successfully` });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Failed to assign role or communicate with backend Java" });
        }
    }
};



export const userDelete = async (req: Request & { user?: any }, res: Response): Promise<any> => {
    try {
        const userId = parseInt(req.params.id);

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error deleting user' });
    }
};

export const users = async (req: Request, res: Response): Promise<any> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (users.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }

        res.status(200).json(users);
    } catch (error) {
        console.log(error);

        res.status(500).json({ error: 'Error fetching users data' });
    }
};


export const updateAvatar = async (req: Request & { user?: any }, res: Response): Promise<any> => {
    const { avatar } = req.body;
    const userId = req.user?.id;

    if (!avatar) {
        return res.status(400).json({ error: 'Avatar is required' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                avatar
            }
        });

        res.status(200).json({ message: 'Avatar updated successfully', avatar: updatedUser.avatar });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error updating avatar' });
    }
};

