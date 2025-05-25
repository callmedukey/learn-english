import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Kakao, { Gender } from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";

import { signInSchema } from "./lib/schemas/auth.schema";
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
      role: Role;
      hasPaidSubscription: boolean;
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

  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role as Role;
      session.user.nickname = token.nickname as string;
      session.user.gender = token.gender as Gender;
      session.user.birthday = token.birthday as Date;
      session.user.country = token.country as string;
      session.user.hasPaidSubscription = token.hasPaidSubscription as boolean;
      return session;
    },
    async jwt({ token }) {
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
        },
      });

      token.role = foundUser?.role;
      token.nickname = foundUser?.nickname;
      token.gender = foundUser?.gender;
      token.birthday = foundUser?.birthday;
      token.country = foundUser?.countryId;
      token.username = foundUser?.username;

      // Check for active, non-expired subscriptions
      const now = new Date();
      const activeSubscriptions =
        foundUser?.subscriptions.filter(
          (subscription) =>
            subscription.status === SubscriptionStatus.ACTIVE &&
            subscription.endDate > now,
        ) || [];

      const hasPaidSubscription = activeSubscriptions.length > 0;
      token.hasPaidSubscription = hasPaidSubscription;

      return token;
    },
    async signIn({ user, account }) {
      if (!user.email) {
        return "/signup";
      }

      const foundUser = await prisma.user.findUnique({
        where: { email: user.email },
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
        return "/signup/social?email=" + encodeURIComponent(user.email);
      } else if (!foundUser) {
        return "/signup";
      }

      return true;
    },
  },
  logger: {
    error(error: Error) {
      if ((error as any).type === "CredentialsSignin") {
        return;
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
