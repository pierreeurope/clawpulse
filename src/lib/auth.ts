import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Allow build without env vars (they'll be set in production)
const githubId = process.env.GITHUB_ID || "placeholder";
const githubSecret = process.env.GITHUB_SECRET || "placeholder";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.githubId = profile.id;
        token.username = (profile as any).login;
        token.avatar = (profile as any).avatar_url;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).githubId = token.githubId;
        (session.user as any).username = token.username;
        (session.user as any).avatar = token.avatar;
      }
      return session;
    },
  },
});
