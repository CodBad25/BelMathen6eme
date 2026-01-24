import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { SignJWT, jwtVerify } from "jose";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, inArray, sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Schema defined inline
const typeEnum = pgEnum("type", ["pdf", "video", "link"]);
const visibleEnum = pgEnum("visible", ["true", "false"]);

const resources = pgTable("resources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  sectionId: varchar("sectionId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: typeEnum("type").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  visible: visibleEnum("visible").default("false").notNull(),
  // Visibilité par classe
  visible6A: visibleEnum("visible6A").default("true").notNull(),
  visible6B: visibleEnum("visible6B").default("true").notNull(),
  visible6C: visibleEnum("visible6C").default("true").notNull(),
  visible6D: visibleEnum("visible6D").default("true").notNull(),
  order: integer("order").notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  correctionId: varchar("correctionId", { length: 64 }),
});

// Constants
const ADMIN_COOKIE = "maths6e_admin";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

// Database
const getDb = () => {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
};

// tRPC setup
const t = initTRPC.context<{ req: VercelRequest; res: VercelResponse; isAdmin: boolean }>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;

// Router
const appRouter = t.router({
  system: t.router({
    health: publicProcedure
      .input(z.object({ timestamp: z.number().min(0).optional() }).optional())
      .query(() => ({ ok: true })),
  }),

  auth: t.router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (ctx.isAdmin) {
        return {
          id: "admin",
          name: "Professeur",
          email: null,
          loginMethod: "password",
          role: "admin" as const,
          createdAt: new Date(),
          lastSignedIn: new Date(),
        };
      }
      return null;
    }),

    loginWithPassword: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
          throw new Error("ADMIN_PASSWORD non configuré");
        }
        if (input.password !== adminPassword) {
          throw new Error("Mot de passe incorrect");
        }

        const token = await new SignJWT({ role: "admin" })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(JWT_SECRET);

        const maxAge = 7 * 24 * 60 * 60;
        const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
        const cookieValue = `${ADMIN_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
        ctx.res.setHeader("Set-Cookie", cookieValue);

        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      const cookies = [
        `app_session_id=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
        `${ADMIN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
      ];
      ctx.res.setHeader("Set-Cookie", cookies);
      return { success: true } as const;
    }),
  }),

  resources: t.router({
    list: publicProcedure.query(async () => {
      const db = getDb();
      const allResources = await db.select().from(resources);
      // Return flat list - frontend handles grouping
      return allResources;
    }),

    toggleVisibility: publicProcedure
      .input(z.object({ id: z.string(), visible: z.enum(["true", "false"]) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        await db.update(resources)
          .set({ visible: input.visible, updatedAt: new Date() })
          .where(eq(resources.id, input.id));
        return { success: true };
      }),

    // Toggle all resources in a chapter
    toggleChapter: publicProcedure
      .input(z.object({ chapterId: z.string(), visible: z.enum(["true", "false"]) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        await db.update(resources)
          .set({ visible: input.visible, updatedAt: new Date() })
          .where(eq(resources.chapterId, input.chapterId));
        return { success: true };
      }),

    // Toggle visibility for a specific class
    toggleClassVisibility: publicProcedure
      .input(z.object({
        id: z.string(),
        classe: z.enum(["6A", "6B", "6C", "6D"]),
        visible: z.enum(["true", "false"])
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        const fieldMap: Record<string, Record<string, string | Date>> = {
          "6A": { visible6A: input.visible, updatedAt: new Date() },
          "6B": { visible6B: input.visible, updatedAt: new Date() },
          "6C": { visible6C: input.visible, updatedAt: new Date() },
          "6D": { visible6D: input.visible, updatedAt: new Date() },
        };
        await db.update(resources)
          .set(fieldMap[input.classe])
          .where(eq(resources.id, input.id));
        return { success: true };
      }),

    // Create a new resource
    create: publicProcedure
      .input(z.object({
        chapterId: z.string(),
        sectionId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(["pdf", "video", "link"]),
        url: z.string(),
        icon: z.string().optional(),
        visible: z.enum(["true", "false"]).default("false"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        const id = `${input.chapterId}-${input.sectionId}-${Date.now()}`;

        // Get max order for this chapter/section
        const existing = await db.select().from(resources)
          .where(eq(resources.chapterId, input.chapterId));
        const maxOrder = existing.length > 0
          ? Math.max(...existing.map(r => r.order)) + 1
          : 1;

        await db.insert(resources).values({
          id,
          chapterId: input.chapterId,
          sectionId: input.sectionId,
          title: input.title,
          description: input.description || null,
          type: input.type,
          url: input.url,
          icon: input.icon || null,
          visible: input.visible,
          order: maxOrder,
          displayOrder: maxOrder,
        });
        return { success: true, id };
      }),

    // Delete a resource
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        await db.delete(resources).where(eq(resources.id, input.id));
        return { success: true };
      }),

    // Bulk delete resources
    bulkDelete: publicProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        await db.delete(resources).where(inArray(resources.id, input.ids));
        return { success: true, count: input.ids.length };
      }),

    // Update a resource (title, url)
    update: publicProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        url: z.string().optional(),
        visible: z.enum(["true", "false"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        const { id, ...updates } = input;
        await db.update(resources)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(resources.id, id));
        return { success: true };
      }),

    // Move resource to another chapter
    moveResource: publicProcedure
      .input(z.object({ id: z.string(), chapterId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        await db.update(resources)
          .set({ chapterId: input.chapterId, updatedAt: new Date() })
          .where(eq(resources.id, input.id));
        return { success: true };
      }),

    // Reorder chapters (update displayOrder for all resources in each chapter)
    reorderChapters: publicProcedure
      .input(z.object({ chapterOrder: z.array(z.string()) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();

        // Update displayOrder for each chapter based on new order
        for (let i = 0; i < input.chapterOrder.length; i++) {
          const chapterId = input.chapterOrder[i];
          await db.update(resources)
            .set({ displayOrder: i + 1 })
            .where(eq(resources.chapterId, chapterId));
        }
        return { success: true };
      }),

    // Associate a correction to a resource
    setCorrection: publicProcedure
      .input(z.object({
        id: z.string(),
        correctionId: z.string().nullable()
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.isAdmin) {
          throw new Error("Unauthorized");
        }
        const db = getDb();
        await db.update(resources)
          .set({ correctionId: input.correctionId, updatedAt: new Date() })
          .where(eq(resources.id, input.id));
        return { success: true };
      }),

    // Get all corrections (resources in corrections section)
    getCorrections: publicProcedure
      .input(z.object({ chapterId: z.string() }))
      .query(async ({ input }) => {
        const db = getDb();
        const corrections = await db.select().from(resources)
          .where(eq(resources.sectionId, "corrections"));
        // Filter by chapter if provided
        return corrections.filter(c => c.chapterId === input.chapterId);
      }),

    // Get recent resources (last 7 days, visible only) - based on updatedAt
    getRecent: publicProcedure
      .input(z.object({ days: z.number().default(7) }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        const days = input?.days ?? 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const allResources = await db.select().from(resources)
          .where(eq(resources.visible, "true"));

        // Filter by updatedAt (when resource was last modified/added)
        return allResources
          .filter(r => r.updatedAt && new Date(r.updatedAt) >= cutoffDate)
          .sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA; // Most recent first
          })
          .slice(0, 10); // Max 10 recent items
      }),
  }),
});

// Parse cookies helper
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [key, ...v] = c.trim().split("=");
      return [key, v.join("=")];
    })
  );
}

// Check if admin
async function checkIsAdmin(req: VercelRequest): Promise<boolean> {
  const cookies = parseCookies(req.headers.cookie);
  const adminCookie = cookies[ADMIN_COOKIE];
  if (!adminCookie) return false;

  try {
    const { payload } = await jwtVerify(adminCookie, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const isAdmin = await checkIsAdmin(req);

    const url = new URL(req.url || "", `https://${req.headers.host}`);
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    });

    const fetchRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: fetchRequest,
      router: appRouter,
      createContext: () => ({ req, res, isAdmin }),
    });

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie" || !res.getHeader("set-cookie")) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error("TRPC Error:", error);
    res.status(500).json({ error: String(error) });
  }
}

export type AppRouter = typeof appRouter;
