import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { createClub } from "./club.create";
import { matchMigration } from "./match.migration";
import { playerMigration } from "./player.migration";
import { userMigration } from "./user.migration";

config();

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("🚀 Migration start");
  try {
    console.log("🧑‍💻 [userMigration] start");
    await userMigration();
    console.log("✅ [userMigration] done");

    console.log("🏟️ [createClub] start");
    await createClub();
    console.log("✅ [createClub] done");

    console.log("⚽ [playerMigration] start");
    await playerMigration();
    console.log("✅ [playerMigration] done");

    console.log("⚽ [matchMigration] start");
    await matchMigration();
    console.log("✅ [matchMigration] done");
  } catch (error) {
    console.error("❌ Migration failed", error);
    throw error;
  }
  console.log("🎉 Migration finished");
}

main();
