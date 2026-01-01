CREATE TYPE "public"."jampType" AS ENUM('Méthode', 'Définition', 'Formule', 'Propriété', 'Astuce');--> statement-breakpoint
CREATE TYPE "public"."slideContentType" AS ENUM('image', 'video', 'html');--> statement-breakpoint
CREATE TABLE "jampSlides" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"jampId" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"contentType" "slideContentType" NOT NULL,
	"contentUrl" text,
	"contentHtml" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jamps" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"chapterId" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"type" "jampType" NOT NULL,
	"icon" text DEFAULT '📚',
	"description" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "visible6A" "visible" DEFAULT 'true' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "visible6B" "visible" DEFAULT 'true' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "visible6C" "visible" DEFAULT 'true' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "visible6D" "visible" DEFAULT 'true' NOT NULL;--> statement-breakpoint
ALTER TABLE "jampSlides" ADD CONSTRAINT "jampSlides_jampId_jamps_id_fk" FOREIGN KEY ("jampId") REFERENCES "public"."jamps"("id") ON DELETE cascade ON UPDATE no action;