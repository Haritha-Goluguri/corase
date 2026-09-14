import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Google sign-in error: No email returned from Google profile");
          return false;
        }

        try {
          await connectToDatabase();
          const email = user.email.toLowerCase().trim();
          let existingUser = await User.findOne({ email });

          // Check if this Google email should be granted admin/provider role
          const adminEmails = (process.env.ADMIN_EMAIL || "")
            .toLowerCase()
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);
          const shouldBeAdmin = adminEmails.includes(email);

          if (!existingUser) {
            existingUser = await User.create({
              name: user.name || email.split("@")[0] || "User",
              email: email,
              image: user.image || "",
              provider: "google",
              role: shouldBeAdmin ? "admin" : "user",
              cart: [],
              wishlist: [],
            });
          } else {
            // Elevate to admin if configured in ADMIN_EMAIL
            if (shouldBeAdmin && existingUser.role !== "admin") {
              existingUser.role = "admin";
              await existingUser.save();
            }
            // If the user previously didn't have an avatar, save Google's picture
            if (!existingUser.image && user.image) {
              existingUser.image = user.image;
              await existingUser.save();
            }
          }

          // Attach MongoDB ID & role to user object
          user.id = existingUser._id.toString();
          (user as any).role = existingUser.role;
          return true;
        } catch (error) {
          console.error("Google sign-in callback error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session, account }) {
      // If signing in via Google, or if token.id is missing or not a valid MongoDB ObjectId
      if (
        account?.provider === "google" ||
        !token.id ||
        !mongoose.Types.ObjectId.isValid(token.id as string)
      ) {
        if (token.email) {
          try {
            await connectToDatabase();
            const email = token.email.toLowerCase().trim();
            const dbUser = await User.findOne({ email });
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role || "user";
            }
          } catch (error) {
            console.error("Error setting MongoDB ID in jwt callback:", error);
          }
        }
      } else if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }

      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "corase-jwt-secret-key-streetwear-2026",
};
