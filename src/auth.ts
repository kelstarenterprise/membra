// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { z } from "zod";
import type { JWT } from "next-auth/jwt";
import type { User as NextAuthUser } from "next-auth";

type Role = "ADMIN" | "MEMBER";
type AppUser = NextAuthUser & { role: Role; memberId?: string | null };
type TokenWithRole = JWT & { role?: Role; memberId?: string | null };

const CredsSchema = z.object({
  // allow login by email OR username
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export const { auth, signIn, signOut, handlers } = NextAuth({
  // IMPORTANT when deploying behind a proxy (Vercel/etc.)
  trustHost: true,
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

        // look up by email OR username, select only what we need
        const user = await prisma.user.findFirst({
          where: { OR: [{ email: id }, { username: id }] },
          select: {
            id: true,
            email: true,
            username: true,
            role: true, // Prisma enum UserRole
            memberId: true,
            passwordHash: true, // <- must exist in your Prisma model
          },
        });

        if (!user || !user.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        // Return minimal payload; additional fields go into JWT in callbacks
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role as Role,
          memberId: user.memberId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as TokenWithRole;
      if (user) {
        const u = user as AppUser;
        t.role = u.role;
        t.memberId = u.memberId ?? null;
      }
      return t;
    },
    async session({ session, token }) {
      const s = session as typeof session & {
        user: typeof session.user & { role?: Role; memberId?: string | null };
      };
      const t = token as TokenWithRole;

      if (s.user) {
        s.user.role = t.role;
        s.user.memberId = t.memberId ?? null;
      }
      return s;
    },
  },
});
