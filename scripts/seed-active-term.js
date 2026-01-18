const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Checking for active term...')
  const { data: activeTerm, error } = await supabase
    .from('terms')
    .select('*')
    .eq('is_active', true)
    .single()

  if (activeTerm) {
    console.log('Active term already exists:', activeTerm.name)
    return
  }

  // PGRST116 is "JSON object requested, multiple (or no) rows returned"
  // If error is not null and code is not PGRST116, it's a real error
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking active term:', error)
    return
  }

  console.log('No active term found. Creating one...')
  const now = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3) // 3 months from now

  const { data: newTerm, error: insertError } = await supabase
    .from('terms')
    .insert({
      name: 'Term 1 2025',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
      academic_year: '2025',
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating term:', insertError)
  } else {
    console.log('Active term created successfully:', newTerm.name)
  }
}

seed()
