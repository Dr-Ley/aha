import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { authConfig } from "@/lib/auth.config";
import { findUserByEmail, findUserById } from "@/lib/users-store";

const nextAuth = NextAuth({
  ...authConfig,
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
        const row = await findUserById(String(token.sub));
        if (row?.role) token.role = row.role;
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

        const user = await findUserByEmail(String(credentials.email));
        if (!user?.passwordHash) return null;

        const passwordMatch = await compare(String(credentials.password), user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
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
