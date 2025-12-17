import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Kakao, { Gender } from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";

import { signInSchema } from "./lib/schemas/auth.schema";
import { getIncompleteProfileRedirect, isProfileComplete } from "./lib/utils/profile-validation";
import { Role, SubscriptionStatus } from "./prisma/generated/prisma";
import { prisma } from "./prisma/prisma-client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      nickname: string;
      username: string;
      gender: Gender | undefined;
      birthday: Date;
      country: string;
      campusId: string | null;
      role: Role;
      hasPaidSubscription: boolean;
      profileComplete: boolean;
      hasPassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    role?: Role;
    nickname?: string | null;
    gender?: Gender | null;
    birthday?: Date | null;
    country?: string | null;
    hasPaidSubscription?: boolean;
    profileComplete?: boolean;
    hasPassword?: boolean;
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
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = signInSchema.safeParse(credentials);

        if (!parsed.success) {
          throw new InvalidCredentialsError();
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) {
          throw new UserNotFoundError();
        }

        const passwordsMatch = await compare(
          parsed.data.password,
          user.password,
        );

        if (!passwordsMatch) {
          throw new InvalidCredentialsError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          gender: user.gender as Gender,
          birthday: user.birthday,
          country: user.countryId,
          role: user.role as Role,
        };
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  trustHost:
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "development",
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub as string;
      }
      
      session.user.role = (token.role as Role) || Role.USER;
      session.user.nickname = (token.nickname as string) || '';
      session.user.gender = token.gender as Gender;
      session.user.birthday = token.birthday as Date;
      session.user.country = (token.country as string) || '';
      session.user.campusId = (token.campusId as string | null) || null;
      session.user.hasPaidSubscription = (token.hasPaidSubscription as boolean) || false;
      session.user.profileComplete = (token.profileComplete as boolean) || false;
      session.user.hasPassword = (token.hasPassword as boolean) || false;

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) {
        return token;
      }

      try {
        const foundUser = await prisma.user.findUnique({
          where: {
            id: token.sub as string,
          },
          include: {
            subscriptions: {
              include: {
                plan: true,
              },
            },
            country: true,
          },
        });

        if (!foundUser) {
          return token;
        }

        token.role = foundUser.role;
        token.nickname = foundUser.nickname;
        token.gender = foundUser.gender;
        token.birthday = foundUser.birthday;
        token.country = foundUser.country?.name || foundUser.countryId || '';
        token.campusId = foundUser.campusId;
        token.username = foundUser.username;

        // Check for active, non-expired subscriptions
        const now = new Date();
        const activeSubscriptions =
          foundUser.subscriptions.filter(
            (subscription) =>
              subscription.status === SubscriptionStatus.ACTIVE &&
              subscription.endDate > now,
          ) || [];

        const hasPaidSubscription = activeSubscriptions.length > 0;
        token.hasPaidSubscription = hasPaidSubscription;
        
        // Check if profile is complete
        token.profileComplete = isProfileComplete(foundUser);

        // Check if user has a password (for social login users)
        token.hasPassword = !!foundUser.password;
      } catch (error) {
        console.error('Error in JWT callback:', error);
      }

      return token;
    },
    async signIn({ user, account }) {
      if (!user.email) {
        return "/signup";
      }

      const foundUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      });

      if (!foundUser && account) {
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
          },
        });

        await prisma.account.create({
          data: {
            userId: newUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            type: account.type,
          },
        });
        return getIncompleteProfileRedirect(user.email);
      } else if (!foundUser) {
        return "/signup";
      }

      // Check if existing user has this provider linked
      if (account) {
        const hasProvider = foundUser.accounts.some(
          (acc) => acc.provider === account.provider
        );

        if (!hasProvider) {
          // User exists but with different provider - block and show error
          const originalProvider = foundUser.accounts.length > 0
            ? foundUser.accounts[0].provider
            : 'credentials';
          return `/login?error=OAuthAccountNotLinked&provider=${originalProvider}`;
        }
      }

      // Check if existing user has complete profile
      if (!isProfileComplete(foundUser)) {
        return getIncompleteProfileRedirect(user.email);
      }

      return true;
    },
  },
  logger: {
    error(error: Error) {
      if ((error as any).type === "CredentialsSignin") {
        console.log("CredentialsSignin", error);
      }
      console.error(error);
    },
    warn(message: string) {
      console.warn(message);
    },
    debug(message: string) {
      console.debug(message);
    },
  },
});
