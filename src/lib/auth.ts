// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { z } from "zod";
import type { Role } from "@/lib/roles";

const CredsSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        usernameOrEmail: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { usernameOrEmail, password } = parsed.data;
        const id = usernameOrEmail.trim();

        // Select only the fields we need (and that exist in the schema)
        const user = await prisma.user.findFirst({
          where: { OR: [{ email: id }, { username: id }] },
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            memberId: true,
            passwordHash: true, // <- this exists in your schema
          },
        });

        if (!user || !user.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          memberId: user.memberId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = 'role' in user ? user.role as Role : undefined;
        token.memberId = 'memberId' in user ? user.memberId ?? null : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      (session.user as { role?: unknown }).role = token.role;
      (session.user as { memberId?: unknown }).memberId = token.memberId ?? null;
      return session;
    },
  },
});
