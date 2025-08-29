const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testError() {
  try {
    const { data, error } = await supabase
      .rpc('add_custom_service_category', {
        category_name: 'LIMPEZA PROFUNDA',
        category_description: 'Teste',
        category_color: '#FF0000'
      })
    
    if (error) {
      console.log('Error object:', JSON.stringify(error, null, 2))
      console.log('Error message:', error.message)
      console.log('Error details:', error.details)
      console.log('Error hint:', error.hint)
      console.log('Error code:', error.code)
    }
  } catch (e) {
    console.log('Caught exception:', e)
  }
}

testError()
