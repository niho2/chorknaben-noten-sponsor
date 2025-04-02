import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "geheimespasswort"; // In .env setzen!

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.password === ADMIN_PASSWORD) {
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login", // Deine Login-Seite
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, // Setze ein sicheres Secret in .env
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
