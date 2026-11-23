import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { verifyCredentials } from "@/server/store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Kata sandi", type: "password" } },
      async authorize(creds) {
        const email = String(creds?.email ?? "");
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await verifyCredentials(email, password);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role, innovatorId: user.innovatorId, villageId: user.villageId } as unknown as import("next-auth").User;
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { role?: string; innovatorId?: string; villageId?: string };
        token.role = u.role; token.innovatorId = u.innovatorId; token.villageId = u.villageId;
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as unknown as { user: Record<string, unknown> };
      s.user.id = token.sub; s.user.role = token.role; s.user.innovatorId = token.innovatorId; s.user.villageId = token.villageId;
      return session;
    },
  },
  pages: { signIn: "/login" },
});
