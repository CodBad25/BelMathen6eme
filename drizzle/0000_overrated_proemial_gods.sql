CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('pdf', 'video', 'link');--> statement-breakpoint
CREATE TYPE "public"."visible" AS ENUM('true', 'false');--> statement-breakpoint
CREATE TABLE "resources" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"chapterId" varchar(64) NOT NULL,
	"sectionId" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "type" NOT NULL,
	"url" text NOT NULL,
	"icon" text,
	"visible" "visible" DEFAULT 'false' NOT NULL,
	"order" integer NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"correctionId" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "stats_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"lastSignedIn" timestamp DEFAULT now()
);
