import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { user as userTable, account as accountTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      userType?: string | null;
    }
  }
  
  interface User {
    id: string;
    userType?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const [foundUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, credentials.email));
        if (!foundUser) return null;
        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/register",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider && user?.email) {
        const [existingAccount] = await db
          .select()
          .from(accountTable)
          .where(eq(accountTable.providerAccountId, account.providerAccountId));

        if (!existingAccount) {
          const [existingUser] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, user.email));

          if (existingUser) {
            await db.insert(accountTable).values({
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              type: account.type,
              access_token: account.access_token,
              expires_at: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            });
            return true;
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        
        // Fetch user data to get userType
        try {
          const [userData] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, token.id as string));
          
          if (userData) {
            session.user.userType = userData.userType;
          }
        } catch (error) {
          console.error('Error fetching user data in session:', error);
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await sendWelcomeEmail(user.email!, user.name || undefined);
        console.log(` Welcome email sent to ${user.email}`);
      } catch (err) {
        console.error(` Error sending welcome email to ${user.email}`, err);
      }
    },
  },
}; 