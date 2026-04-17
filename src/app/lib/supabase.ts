import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://riklmgcrlshvjaowyfvz.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_JwZL6MA5MuUv1bPEoPCbsw_VCmwP43L"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);