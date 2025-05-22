import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/app/types/supabase";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase configuration missing. Please check your app.json file."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const AuthService = {
  async signInWithHardcodedCredentials() {
    // Hardcoded credentials from task
    const user_id = "3d914144-cee8-4d0c-ac2d-1e06db33ba39";
    const email = "doankhanhdong3105@gmail.com";

    // Set auth session with hardcoded user
    let { data, error } = await supabase.auth.signUp({
      email: "someone@email.com",
      password: "VdxWaXnGooSAmLFeXYdA",
    });

    // Update user data separately
    await supabase.auth.updateUser({
      data: {
        user_id,
        email,
      },
    });

    if (error) throw error;
    return data;
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

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
