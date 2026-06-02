import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          });

          if (!res.ok) {
             const text = await res.text();
             console.error("Login API returned status:", res.status, "Body:", text);
             return null;
          }

          const user = await res.json();

          if (user) {
            const returnedUser = {
              id: user.user.id.toString(),
              name: user.user.name,
              email: user.user.email,
              token: user.token,
            };
            console.log("Authorize returning:", returnedUser);
            return returnedUser;
          }
          return null;
        } catch (error) {
          console.error("Login failed:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("JWT callback user:", user);
        token.id = user.id;
        token.accessToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session as any).accessToken = token.accessToken;
      }
      console.log("Session callback session:", session);
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  }
})
