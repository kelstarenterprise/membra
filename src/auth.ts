// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { JWT } from "next-auth/jwt";
import type { User as NextAuthUser } from "next-auth";

type Role = "ADMIN" | "MEMBER";

type AppUser = NextAuthUser & {
  role: Role;
  memberId?: string | null; // FK
  membershipId?: string | null; // public code
};
type TokenWithStuff = JWT & {
  role?: Role;
  memberId?: string | null;
  membershipId?: string | null;
};

const CredsSchema = z.object({
  usernameOrEmail: z.string().min(1), // email | username | membershipId
  password: z.string().min(1),
});

export const { auth, signIn, signOut, handlers } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // secret: process.env.NEXTAUTH_SECRET, // enable in prod

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        usernameOrEmail: {
          label: "Email / Username / Member ID",
          type: "text",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { usernameOrEmail, password } = parsed.data;
        const id = usernameOrEmail.trim();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: id, mode: "insensitive" } },
              { username: { equals: id, mode: "insensitive" } },
              { member: { membershipId: id } }, // login via 9-char code
            ],
          },
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            memberId: true,
            passwordHash: true,
            member: { select: { membershipId: true } },
          },
        });

        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const out: AppUser = {
          id: user.id,
          email: user.email ?? null,
          name: user.username ?? null,
          role: user.role as Role,
          memberId: user.memberId ?? null,
          membershipId: user.member?.membershipId ?? null,
        };
        return out;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      const t = token as TokenWithStuff;

      if (user) {
        const u = user as AppUser;
        t.role = u.role;
        t.memberId = u.memberId ?? null;
        t.membershipId = u.membershipId ?? null;
      }

      // Refresh from DB if missing or on explicit update
      if (!t.role || !t.membershipId || trigger === "update") {
        if (token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              role: true,
              memberId: true,
              member: { select: { membershipId: true } },
            },
          });
          if (dbUser) {
            t.role = dbUser.role as Role;
            t.memberId = dbUser.memberId ?? null;
            t.membershipId = dbUser.member?.membershipId ?? null;
          }
        }
      }
      return t;
    },

    async session({ session, token }) {
      const s = session as typeof session & {
        user: typeof session.user & {
          id?: string;
          role?: Role;
          memberId?: string | null;
          membershipId?: string | null;
        };
      };
      const t = token as TokenWithStuff;

      if (s.user) {
        if (typeof token.sub === "string") {
          s.user.id = token.sub; // guard fixes "string | undefined" error
        }
        s.user.role = t.role;
        s.user.memberId = t.memberId ?? null;
        s.user.membershipId = t.membershipId ?? null;
      }
      return s;
    },
  },
});
