import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import type { NextAuthConfig, Session } from "next-auth";

const config = {
  secret: process.env.AUTH_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-replace-in-production" : undefined),
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user) return null;

        const passwordMatch = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }: { session: Session; token: any }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        role: token.role,
        avatar: token.avatar,
      },
    }),
    jwt: ({ token, user }: { token: any; user: any }) => {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
} satisfies NextAuthConfig;

const nextAuth = NextAuth(config);

// Export handlers as an object with GET and POST
export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;