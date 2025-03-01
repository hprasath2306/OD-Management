import { UserRole } from "@prisma/client";
import { isRegNo } from "./checker";
import { isEmail } from "./checker";
import prisma from "../../db/config";
export async function createUser(
    username: string,
    password: string,
    userRole?: UserRole
) {
    const isValidUserName =
        isEmail(username, ["psnacet.edu.in"]) && !isRegNo(username);
    // const isValidUserEmail = isEmail(username, ["psnacet.edu.in"]);
    if (!isValidUserName) {
        return null;
    }

    return prisma.user.create({
        data: {
            role: userRole || UserRole.ADMIN,
            email: username,
            username: username,
            password: password,
        },
    });
}