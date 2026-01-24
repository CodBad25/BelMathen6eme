import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import { ENV } from "./_core/env";
import { SignJWT, jwtVerify } from "jose";

// Force rebuild: 2024-12-01

const ADMIN_COOKIE = "maths6e_admin";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

export const appRouter = router({
  system: router({
    health: publicProcedure
      .input(
        z.object({
          timestamp: z.number().min(0, "timestamp cannot be negative"),
        })
      )
      .query(() => ({
        ok: true,
      })),
  }),

  auth: router({
    me: publicProcedure.query(async (opts) => {
      // Check for admin cookie first
      const adminCookie = opts.ctx.req.cookies?.[ADMIN_COOKIE];
      if (adminCookie) {
        try {
          const { payload } = await jwtVerify(adminCookie, JWT_SECRET);
          if (payload.role === "admin") {
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
        } catch {
          // Invalid token, ignore
        }
      }
      return opts.ctx.user;
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

        // Create JWT token
        const token = await new SignJWT({ role: "admin" })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(JWT_SECRET);

        // Set cookie using setHeader (compatible with both Express and Vercel)
        const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
        const secure = ENV.isProduction ? "; Secure" : "";
        const cookieValue = `${ADMIN_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
        (ctx.res as any).setHeader("Set-Cookie", cookieValue);

        return { success: true };
      }),

    logout: publicProcedure.mutation(opts => {
      const { ctx } = opts;

      // Clear cookies using setHeader (compatible with both Express and Vercel)
      const secure = ENV.isProduction ? "; Secure" : "";
      const cookies = [
        `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
        `${ADMIN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
      ];
      (ctx.res as any).setHeader("Set-Cookie", cookies);

      return {
        success: true,
      } as const;
    }),
  }),

  resources: router({
    list: publicProcedure.query(async () => {
      const { getAllResources } = await import("./db");
      return getAllResources();
    }),
    getRecent: publicProcedure
      .input(z.object({ days: z.number().default(7) }).optional())
      .query(async ({ input }) => {
        const { getRecentResources } = await import("./db");
        return getRecentResources(input?.days ?? 7);
      }),
    toggleClassVisibility: protectedProcedure
      .input(z.object({
        id: z.string(),
        classe: z.enum(["6A", "6B", "6C", "6D"]),
        visible: z.enum(["true", "false"])
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        const { updateClassVisibility } = await import("./db");
        await updateClassVisibility(input.id, input.classe, input.visible);
        return { success: true };
      }),
    toggleVisibility: protectedProcedure
      .input(z.object({ id: z.string(), visible: z.enum(["true", "false"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        const { updateResourceVisibility } = await import("./db");
        await updateResourceVisibility(input.id, input.visible);
        return { success: true };
      }),
    toggleChapter: protectedProcedure
      .input(z.object({ chapterId: z.string(), visible: z.enum(["true", "false"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        const { toggleChapterVisibility } = await import("./db");
        await toggleChapterVisibility(input.chapterId, input.visible);
        return { success: true };
      }),
    create: protectedProcedure
      .input(
        z.object({
          chapterId: z.string(),
          sectionId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          type: z.enum(["pdf", "video", "link"]),
          url: z.string(),
          icon: z.string().optional(),
          visible: z.enum(["true", "false"]).default("false"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent créer des ressources");
        }
        const { createResource } = await import("./db");
        return await createResource(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          url: z.string().optional(),
          visible: z.enum(["true", "false"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent modifier des ressources");
        }
        const { updateResource } = await import("./db");
        return await updateResource(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent supprimer des ressources");
        }
        const { deleteResource } = await import("./db");
        return await deleteResource(input.id);
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent supprimer des ressources");
        }
        const { deleteResource } = await import("./db");
        for (const id of input.ids) {
          await deleteResource(id);
        }
        return { success: true, count: input.ids.length };
      }),

    reorderChapters: protectedProcedure
      .input(z.object({ chapterOrder: z.array(z.string()) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent réorganiser les chapitres");
        }
        const { updateChapterOrder } = await import("./db");
        return await updateChapterOrder(input.chapterOrder);
      }),

    moveResource: protectedProcedure
      .input(z.object({ id: z.string(), chapterId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent déplacer des ressources");
        }
        const { moveResourceToChapter } = await import("./db");
        return await moveResourceToChapter(input.id, input.chapterId);
      }),

    setCorrection: protectedProcedure
      .input(z.object({ id: z.string(), correctionId: z.string().nullable() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent associer des corrections");
        }
        const { setCorrectionForResource } = await import("./db");
        return await setCorrectionForResource(input.id, input.correctionId);
      }),
  }),

  stats: router({
    getVisitCount: publicProcedure.query(async () => {
      const { getVisitCount } = await import("./db");
      return { count: await getVisitCount() };
    }),
    incrementVisitCount: publicProcedure.mutation(async () => {
      const { incrementVisitCount } = await import("./db");
      return { count: await incrementVisitCount() };
    }),
  }),

  settings: router({
    // Récupère les classes actives
    getActiveClasses: publicProcedure.query(async () => {
      const { getActiveClasses } = await import("./db");
      return { classes: await getActiveClasses() };
    }),

    // Met à jour les classes actives (admin only)
    setActiveClasses: protectedProcedure
      .input(z.object({ classes: z.array(z.enum(["6A", "6B", "6C", "6D"])) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent modifier les classes actives");
        }
        const { setActiveClasses } = await import("./db");
        return setActiveClasses(input.classes);
      }),
  }),

  jamps: router({
    // Liste tous les JAMP
    list: publicProcedure.query(async () => {
      const { getAllJamps } = await import("./db");
      return getAllJamps();
    }),

    // Liste les JAMP d'un chapitre
    byChapter: publicProcedure
      .input(z.object({ chapterId: z.string() }))
      .query(async ({ input }) => {
        const { getJampsByChapter } = await import("./db");
        return getJampsByChapter(input.chapterId);
      }),

    // Récupère un JAMP par ID
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getJampById } = await import("./db");
        return getJampById(input.id);
      }),

    // Crée un JAMP (avec contenu direct)
    create: protectedProcedure
      .input(z.object({
        chapterId: z.string(),
        title: z.string(),
        type: z.enum(["Méthode", "Définition", "Formule", "Propriété", "Astuce"]),
        icon: z.string().optional(),
        description: z.string().optional(),
        contentType: z.enum(["image", "video", "pdf"]).optional(),
        contentUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent créer des JAMP");
        }
        const { createJamp } = await import("./db");
        return createJamp(input);
      }),

    // Met à jour un JAMP
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        type: z.enum(["Méthode", "Définition", "Formule", "Propriété", "Astuce"]).optional(),
        icon: z.string().optional(),
        description: z.string().optional(),
        contentType: z.enum(["image", "video", "pdf"]).optional(),
        contentUrl: z.string().optional(),
        visible: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent modifier des JAMP");
        }
        const { updateJamp } = await import("./db");
        return updateJamp(input);
      }),

    // Supprime un JAMP
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent supprimer des JAMP");
        }
        const { deleteJamp } = await import("./db");
        return deleteJamp(input.id);
      }),
  }),

  exercices: router({
    // Liste les exercices masqués
    getHidden: publicProcedure.query(async () => {
      const { getHiddenExercices } = await import("./db");
      return { hidden: await getHiddenExercices() };
    }),

    // Toggle la visibilité d'un exercice (admin only)
    toggleVisibility: protectedProcedure
      .input(z.object({ exerciceId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Seuls les administrateurs peuvent masquer des exercices");
        }
        const { toggleExerciceVisibility } = await import("./db");
        return toggleExerciceVisibility(input.exerciceId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
