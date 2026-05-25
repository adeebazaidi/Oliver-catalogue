// =============================================
// CatalogueGen — Configuration Manager
// Loads environment variables for Supabase sync
// =============================================

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks if Supabase has been properly configured
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
  return typeof SUPABASE_URL === 'string' && 
         SUPABASE_URL.trim().length > 0 && 
         typeof SUPABASE_KEY === 'string' && 
         SUPABASE_KEY.trim().length > 0;
};
