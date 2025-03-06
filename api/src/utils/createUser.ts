import { UserRole } from "@prisma/client";
import { isRegNo } from "./checker";
import { isEmail } from "./checker";
import prisma from "../db/config";
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
