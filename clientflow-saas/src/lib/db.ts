import { supabase } from "./supabase";

export type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: "active" | "inactive" | "lead" | null;
  value: number | null;
  projects: number | null;
  last_contact: string | null; // date string
  created_at: string;
};

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function fetchClients(): Promise<ClientRow[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClientRow[];
}

export async function createClient(input: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}): Promise<ClientRow> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        user_id: userId,
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        status: "lead",
        value: 0,
        projects: 0,
        last_contact: null,
      },
    ])
    .select("*")
    .single();

  if (error) throw error;
  return data as ClientRow;
}

export async function deleteClient(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
