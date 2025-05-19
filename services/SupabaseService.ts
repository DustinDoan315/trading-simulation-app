import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import type { Database } from "@/app/types/supabase";

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase configuration missing. Please check your app.json extra config."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const PortfolioService = {
  async getPortfolioList() {
    const { data, error } = await supabase
      .from("portfolio_list")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Database["public"]["Tables"]["portfolio_list"]["Row"][];
  },

  async addAsset(
    asset: Database["public"]["Tables"]["portfolio_list"]["Insert"]
  ) {
    const { data, error } = await supabase
      .from("portfolio_list")
      .insert(asset)
      .select();

    if (error) throw error;
    return data[0] as Database["public"]["Tables"]["portfolio_list"]["Row"];
  },

  async updateAsset(
    id: string,
    updates: Database["public"]["Tables"]["portfolio_list"]["Update"]
  ) {
    const { data, error } = await supabase
      .from("portfolio_list")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0] as Database["public"]["Tables"]["portfolio_list"]["Row"];
  },

  async deleteAsset(id: string) {
    const { error } = await supabase
      .from("portfolio_list")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
