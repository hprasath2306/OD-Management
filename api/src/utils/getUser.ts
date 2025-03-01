import prisma from "../../db/config";

export const isValidUUID = (id: string): boolean => {
    return id.match(/^[0-9a-fA-F]{24}$/) !== null;
};

export async function getUser(username: string) {
    try {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username },
            { student: { regNo: username } },
            isValidUUID(username) ? { id: username } : {},
          ],
        },
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  