import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth options (no DB / bcrypt). Used by middleware JWT checks.
 * Full providers + adapter live in `auth.ts`.
 */
export const authConfig = {
  secret:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-secret-replace-in-production" : undefined),
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub as string,
          role: token.role as string | undefined,
          avatar: token.avatar as string | undefined,
        },
      };
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role;
        token.avatar = (user as { avatar?: string | null }).avatar ?? undefined;
      }
      return token;
    },
  },
} satisfies NextAuthConfig;
