import { unstable_cache } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Get the active term with caching
 * This query is used everywhere and rarely changes, so we cache it for 5 minutes
 */
export async function getActiveTerm() {
  return unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('terms')
        .select('id, name, is_active, start_date, end_date')
        .eq('is_active', true)
        .single()
      return data
    },
    ['active-term'],
    { 
      revalidate: 300, // 5 minutes
      tags: ['terms', 'active-term'] // Tags for manual revalidation
    }
  )()
}
