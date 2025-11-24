import { supabase } from ".";

export const attendanceMigration = async () => {
  // TODO: attendance migration
  const { data: attendances, error } = await supabase.from("player_match_join").select("*");

  if (error) {
    console.error("player_match_join select error - ", error);
    return;
  }
};
