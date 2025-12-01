import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { jwtVerify } from "jose";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const ADMIN_COOKIE = "maths4e_admin";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Check for admin cookie first
  const adminCookie = ctx.req.cookies?.[ADMIN_COOKIE];
  if (adminCookie) {
    try {
      const { payload } = await jwtVerify(adminCookie, JWT_SECRET);
      if (payload.role === "admin") {
        return next({
          ctx: {
            ...ctx,
            user: {
              id: "admin",
              name: "Professeur",
              email: null,
              loginMethod: "password",
              role: "admin" as const,
              createdAt: new Date(),
              lastSignedIn: new Date(),
            },
          },
        });
      }
    } catch {
      // Invalid token, continue to check ctx.user
    }
  }

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);
