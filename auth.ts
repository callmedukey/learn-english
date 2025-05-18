import NextAuth, { CredentialsSignin } from "next-auth";
import type {
  NextAuthConfig,
  User,
  Account,
  Profile,
  DefaultSession,
  Session as NextAuthSession,
  JWT as NextAuthJWT
} from "next-auth";
import type { AdapterUser } from "@auth/core/adapters";
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
  interface Session extends DefaultSession {
    user?: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: Role;
      isProfileIncomplete: boolean;
    } & DefaultSession["user"]
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: Role;
    username?: string | null;
  }

  interface JWT extends NextAuthJWT {
    id: string;
    email?: string;
    role?: Role;
    isProfileIncomplete?: boolean;
  }
}

// Validation Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const socialSignUpSchema = z.object({
  nickname: z.string({
    required_error: "Nickname is required",
  }).min(3, "Nickname must be at least 3 characters"),
  
  gender: z.nativeEnum(Gender, {
    required_error: "Gender is required",
  }),
  
  country: z.string({
    required_error: "Country is required",
  }).min(1, "Country is required"),
  
  birthday: z.string({
    required_error: "Birthday is required",
  }).transform((str) => new Date(str)),
  
  referrer: z.string().optional(),
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

// Custom error classes for specific auth failures
class InvalidCredentialsError extends CredentialsSignin {
  code = "InvalidCredentials";
  name = "InvalidCredentialsError";
  message = "Please provide both email and password";
}

class UserNotFoundError extends CredentialsSignin {
  code = "UserNotFound";
  name = "UserNotFoundError";
  message = "No account found with this email";
}

class InvalidPasswordError extends CredentialsSignin {
  code = "InvalidPassword";
  name = "InvalidPasswordError";
  message = "Invalid password";
}

// Extend the built-in session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id: string;
      email: string;
      role: Role;
      isProfileIncomplete: boolean;
    } & DefaultSession["user"]
  }

  interface JWT {
    id: string;
    email?: string;
    role?: Role;
    isProfileIncomplete?: boolean;
  }
}

type AuthUser = {
  id: string;
  email: string;
  role: Role;
  isProfileIncomplete: boolean;
} & DefaultSession["user"];

// Auth.js configuration
export const authConfig = {
  adapter: {
    ...PrismaAdapter(prisma),
    async createUser(data: Omit<AdapterUser, "id">) {
      const user = await prisma.user.create({
        data: {
          email: data.email!,
          nickname: data.name || data.email!.split('@')[0], // Use name or email prefix as temporary nickname
          gender: Gender.OTHER, // Default gender
          country: "PENDING", // Temporary country
          birthday: new Date("2000-01-01"), // Temporary birthday
          password: "", // Empty password for OAuth users
          image: data.image,
          emailVerified: data.emailVerified,
          role: "USER" as Role,
        },
      });
      return user;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new InvalidCredentialsError();
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user?.password) {
          throw new UserNotFoundError();
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new InvalidPasswordError();
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
    async signIn(params: {
      user: User;
      account: Account | null;
      profile?: Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, any>;
      error?: "InvalidCredentials" | "UserNotFound" | "InvalidPassword";
    }) {
      console.log('SignIn callback:', { 
        userEmail: params.user.email,
        accountType: params.account?.type 
      });

      // For credentials provider, we handle errors in the authorize callback
      if (params.account?.type === "credentials") {
        return true;
      }

      // For OAuth providers
      if (params.account?.type === "oauth") {
        // Check if user exists in database
        const dbUser = await prisma.user.findUnique({
          where: { email: params.user.email! },
          select: {
            nickname: true,
            gender: true,
            country: true,
            birthday: true,
          }
        });

        console.log('DB User in signIn:', dbUser);

        // If user exists, check if profile needs completion
        if (dbUser) {
          const needsCompletion = 
            dbUser.country === "PENDING" || 
            dbUser.birthday.getTime() === new Date("2000-01-01").getTime();
          
          if (needsCompletion) {
            return `/sign-up/social`;
          }
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Handle internal URLs
      if (url.startsWith(baseUrl)) return url;
      
      // Handle OAuth callbacks
      if (url.includes('/api/auth/callback')) {
        return baseUrl;
      }

      // Default fallback
      return baseUrl;
    },

    async jwt({ token, user, account }) {
      if (user?.id) {
        // Get user from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            nickname: true,
            gender: true,
            country: true,
            birthday: true,
            role: true,
          }
        });

        console.log('DB User in JWT:', {
          nickname: dbUser?.nickname,
          country: dbUser?.country,
          hasTemporaryBirthday: dbUser?.birthday?.getTime() === new Date("2000-01-01").getTime()
        });

        // Check if profile needs completion
        const needsCompletion = dbUser && (
          dbUser.country === "PENDING" || 
          (dbUser.birthday?.getTime() ?? 0) === new Date("2000-01-01").getTime()
        );

        console.log('Profile needs completion:', needsCompletion);

        return {
          ...token,
          id: user.id,
          email: user.email,
          role: (dbUser?.role || "USER") as Role,
          isProfileIncomplete: needsCompletion,
        };
      }

      return token;
    },
    async session({ session, token }) {
      console.log('Session callback:', { 
        hasToken: !!token,
        tokenId: token?.id,
        sessionUser: session?.user 
      });

      if (!token?.id || !token?.email) {
        return session;
      }

      const user: AuthUser = {
        ...session.user,
        id: token.id,
        email: token.email,
        role: token.role as Role,
        isProfileIncomplete: token.isProfileIncomplete as boolean,
      };

      return {
        ...session,
        user
      };
    }
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
