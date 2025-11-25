import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { assignedMigration } from "./assigned.migration";
import { attendanceMigration } from "./attendance.migration";
import { createClub } from "./club.create";
import { matchMigration } from "./match.migration";
import { mercenaryMigration } from "./mercenary.migration";
import { playerMigration } from "./player.migration";
import { ratingMigration } from "./rating.migration";
import { recordMigration } from "./record.migration";
import { statsMigration } from "./stats.migration";
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

    console.log("⚽ [mercenaryMigration] start");
    await mercenaryMigration();
    console.log("✅ [mercenaryMigration] done");

    console.log("⚽ [attendanceMigration] start");
    await attendanceMigration();
    console.log("✅ [attendanceMigration] done");

    console.log("⚽ [assignedMigration] start");
    await assignedMigration();
    console.log("✅ [assignedMigration] done");

    console.log("⚽ [recordMigration] start");
    await recordMigration();
    console.log("✅ [recordMigration] done");

    console.log("⚽ [ratingMigration] start");
    await ratingMigration();
    console.log("✅ [ratingMigration] done");

    // DB 에서 해결.
    console.log("⚽ [statsMigration] start");
    await statsMigration();
    console.log("✅ [statsMigration] done");
  } catch (error) {
    console.error("❌ Migration failed", error);
    throw error;
  }
  console.log("🎉 Migration finished");
}

main();
