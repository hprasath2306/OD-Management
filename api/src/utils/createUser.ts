import { UserRole } from "@prisma/client";
import prisma from "../db/config.js";
export async function createUser(
  email: string,
  password: string,
  userRole?: UserRole
) {
  return prisma.user.create({
    data: {
      role: userRole || UserRole.ADMIN,
      email: email,
      password: password,
    },
  });
}
