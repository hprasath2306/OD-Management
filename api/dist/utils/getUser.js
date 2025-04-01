import prisma from "../db/config.js";
export const isValidUUID = (id) => {
    return id.match(/^[0-9a-fA-F]{24}$/) !== null;
};
export async function getUser(email) {
    try {
        return await prisma.user.findFirst({
            where: {
                email,
            },
        });
    }
    catch (err) {
        console.error(err);
        return null;
    }
}
