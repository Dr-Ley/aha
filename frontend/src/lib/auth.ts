import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { authConfig } from "@/lib/auth.config";

const nextAuth = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id as string;
        token.role =
          (user as { role?: string }).role != null
            ? String((user as { role?: string }).role)
            : undefined;
        token.avatar = (user as { avatar?: string | null }).avatar ?? undefined;
      } else if (token.sub && (token.role === undefined || token.role === "")) {
        const userId = parseInt(String(token.sub), 10);
        if (!Number.isNaN(userId)) {
          const [row] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          if (row?.role != null) token.role = String(row.role);
        }
      }
      return token;
    },
    session: authConfig.callbacks.session,
  },
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
});

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
