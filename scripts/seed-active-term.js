const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vmcsoiqaifkjebdascoq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3NvaXFhaWZramViZGFzY29xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY0NjgxMCwiZXhwIjoyMDg0MjIyODEwfQ.uAmSjNVH_uxa6XVfd5iaSS5nFbxjK5tiYcquAY843I0'

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
