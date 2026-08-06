'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'

export async function createCustomer(formData: FormData) {
  const { supabase } = await requireUser()
  const payload = {
    customer_type: String(formData.get('customer_type') || 'residential'),
    first_name: String(formData.get('first_name') || ''),
    last_name: String(formData.get('last_name') || ''),
    company_name: String(formData.get('company_name') || ''),
    email: String(formData.get('email') || ''),
    phone: String(formData.get('phone') || ''),
    billing_address: String(formData.get('billing_address') || ''),
    notes: String(formData.get('notes') || ''),
  }
  const { error } = await supabase.from('customers').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/customers')
}
