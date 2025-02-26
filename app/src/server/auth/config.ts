import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";
import { env } from "@/env";
import { get } from "lodash-es";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
    GitHubProvider({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
      authorization: {
        url: `https://github.com/login/oauth/authorize`,
        params: {
          scope: env.AUTH_GITHUB_ORGANIZATION
            ? "read:user user:email read:org"
            : "read:user user:email",
        },
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
    signIn: async ({ account }) => {
      if (
        account &&
        account.provider === "github" &&
        env.AUTH_GITHUB_ORGANIZATION
      ) {
        const accessToken = account.access_token;
        try {
          const response = await fetch(`https://api.github.com/user/orgs`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const orgs = await response.json();

          const isMember = orgs.some(
            (org: unknown) =>
              get(org, "login") === env.AUTH_GITHUB_ORGANIZATION,
          );
          if (isMember) {
            return true;
          } else {
            console.log("Failed to signin, orgs:", orgs);
            return false;
          }
        } catch (error) {
          console.error("Error fetching GitHub organizations:", error);
          return false;
        }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
