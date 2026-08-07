'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function text(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

export async function createCustomer(formData: FormData) {
  const { supabase } = await requireUser()
  const firstName = text(formData, 'first_name')
  const lastName = text(formData, 'last_name')
  const companyName = text(formData, 'company_name')

  if (!firstName && !lastName && !companyName) {
    throw new Error('Enter a customer name or company name.')
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      customer_type: text(formData, 'customer_type') || 'residential',
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      email: text(formData, 'email'),
      phone: text(formData, 'phone'),
      billing_address: text(formData, 'billing_address'),
      notes: text(formData, 'notes'),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  redirect(`/customers/${data.id}`)
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const { supabase } = await requireUser()
  const firstName = text(formData, 'first_name')
  const lastName = text(formData, 'last_name')
  const companyName = text(formData, 'company_name')

  if (!firstName && !lastName && !companyName) {
    throw new Error('Enter a customer name or company name.')
  }

  const { error } = await supabase
    .from('customers')
    .update({
      customer_type: text(formData, 'customer_type') || 'residential',
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      email: text(formData, 'email'),
      phone: text(formData, 'phone'),
      billing_address: text(formData, 'billing_address'),
      notes: text(formData, 'notes'),
    })
    .eq('id', customerId)

  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  revalidatePath(`/customers/${customerId}`)
}

export async function deleteCustomer(customerId: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from('customers').delete().eq('id', customerId)
  if (error) throw new Error(error.message)
  revalidatePath('/customers')
  redirect('/customers')
}
