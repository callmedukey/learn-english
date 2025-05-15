import NextAuth, { CredentialsSignin } from "next-auth";
import type { DefaultSession, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import Naver from "next-auth/providers/naver";
import Kakao from "next-auth/providers/kakao";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma/prisma-client";
import { Role } from "./prisma/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: Role;
    username?: string | null;
  }
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "InvalidCredentials";
}
class UserNotFoundError extends CredentialsSignin {
  code = "UserNotFound";
}

// import { hashPassword } from "@/lib/utils/hashPassword";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = null;

        // return user object with their profile data
        return user;
      },
    }),
    Naver({
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },

  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role as Role;
      session.user.username = token.username as string;
      return session;
    },

    async jwt({ token, user, session, trigger }) {
      const foundUser = await prisma.user.findUnique({
        where: {
          id: token.sub as string,
        },
      });

      token.role = foundUser?.role;
      token.username = foundUser?.username;
      return token;
    },
  },
});
