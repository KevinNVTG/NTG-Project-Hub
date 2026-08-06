'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('customers').insert({
    name: String(formData.get('name') || ''),
    company_name: String(formData.get('company_name') || '') || null,
    email: String(formData.get('email') || '') || null,
    phone: String(formData.get('phone') || '') || null,
    billing_address: String(formData.get('billing_address') || '') || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/customers')
}
