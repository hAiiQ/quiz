import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/server/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validators/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Login",
      credentials: {
        identifier: { label: "E-Mail oder Username", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { identifier, password } = parsed.data;
        const normalized = identifier.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: normalized }, { username: normalized }],
          },
        });

        if (!user) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          username: user.username,
          displayName: user.displayName,
        } as unknown as {
          id: string;
          email: string;
          name: string;
          username: string;
          displayName: string;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as { username?: string }).username ?? token.username;
        token.displayName = (user as { displayName?: string }).displayName ?? token.displayName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.username = (token.username as string) ?? "";
        session.user.displayName = (token.displayName as string) ?? session.user.name ?? "";
      }
      return session;
    },
  },
  theme: {
    colorScheme: "dark",
  },
};
