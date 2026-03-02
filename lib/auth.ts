// lib/auth.ts – NextAuth configuration
import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import AuditLogModel from "@/models/AuditLog";
import type { Role } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        await connectDB();

        const user = await UserModel.findOne({
          email: credentials.email.toLowerCase().trim(),
        }).select("+password");

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        if (user.status !== "active") {
          throw new Error("Your account has been deactivated. Please contact the administrator.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        // Update last login
        await UserModel.findByIdAndUpdate(user._id, {
          lastLogin: new Date(),
        });

        // Audit log
        try {
          await AuditLogModel.create({
            actor: user._id,
            action: "LOGIN",
            resource: "auth",
            resourceId: user._id.toString(),
            details: { email: user.email, role: user.role },
            ipAddress: req?.headers?.["x-forwarded-for"] as string ?? "unknown",
            userAgent: req?.headers?.["user-agent"] ?? "unknown",
          });
        } catch {
          // Non-blocking
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          staffCode: user.staffCode,
          status: user.status,
        } as User;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.role = (user as User & { role: Role }).role;
        token.staffCode = (user as User & { staffCode: string }).staffCode;
        token.status = (user as User & { status: string }).status;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.staffCode = token.staffCode as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (a full hospital shift)
  },

  jwt: {
    maxAge: 8 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

// ─── Session Type Extensions ──────────────────────────────────────────────────
// This extends next-auth types globally
declare module "next-auth" {
  interface User {
    role: Role;
    staffCode: string;
    status: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      staffCode: string;
      status: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    staffCode: string;
    status: string;
  }
}
