import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function checkDb() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Checking database connection...");

  // Check resources table
  const result = await sql`SELECT COUNT(*) as count FROM resources`;
  console.log(`Resources in database: ${result[0].count}`);

  if (Number(result[0].count) > 0) {
    const resources = await sql`SELECT id, title, visible FROM resources LIMIT 5`;
    console.log("\nFirst 5 resources:");
    resources.forEach((r: any) => {
      console.log(`  - ${r.title} (visible: ${r.visible})`);
    });
  }
}

checkDb().catch(console.error);
