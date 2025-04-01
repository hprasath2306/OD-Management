import { UserRole } from "@prisma/client";
import prisma from "../db/config.js";
export async function createUser(email, password, userRole) {
    return prisma.user.create({
        data: {
            role: userRole || UserRole.ADMIN,
            email: email,
            password: password,
        },
    });
}
