import NextAuth from "next-auth";
import type { NextAuthConfig, Session, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Naver from "next-auth/providers/naver";
import Kakao from "next-auth/providers/kakao";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma/prisma-client";
import { Role } from "./prisma/generated/prisma";
import { z } from "zod";
import { compare } from "bcryptjs";

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// Auth type extensions
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: Role;
    } & User;
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: Role;
    username?: string | null;
  }

  interface JWT {
    id: string;
    role: Role;
  }
}

// Validation Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  nickname: z.string({
    required_error: "Nickname is required",
  }).min(3, "Nickname must be at least 3 characters"),
  
  email: z.string({
    required_error: "Email is required",
  }).email("Invalid email address"),
  
  gender: z.nativeEnum(Gender, {
    required_error: "Gender is required",
  }),
  
  country: z.string({
    required_error: "Country is required",
  }).min(1, "Country is required"),
  
  birthday: z.string({
    required_error: "Birthday is required",
  }).transform((str) => new Date(str)),
  
  password: z.string({
    required_error: "Password is required",
  })
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be less than 32 characters"),
  
  confirmPassword: z.string({
    required_error: "Password confirmation is required",
  }),
  
  referrer: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>

// Auth.js configuration
const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          role: user.role,
        };
      }
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Naver({
      clientId: process.env.AUTH_NAVER_ID,
      clientSecret: process.env.AUTH_NAVER_SECRET,
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID,
      clientSecret: process.env.AUTH_KAKAO_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
        },
      };
    }
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(config);
