'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function text(formData: FormData, key: string) { return String(formData.get(key) || '').trim() }

export async function createVendor(formData: FormData) {
  const { supabase, user } = await requireUser()
  const vendorName = text(formData, 'vendor_name')
  if (!vendorName) throw new Error('Vendor name is required.')
  const { data, error } = await supabase.from('vendors').insert({
    vendor_name: vendorName,
    contact_name: text(formData, 'contact_name'),
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    address: text(formData, 'address'),
    payment_terms: text(formData, 'payment_terms'),
    notes: text(formData, 'notes'),
    created_by: user.id,
  }).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/vendors')
  redirect(`/vendors/${data.id}`)
}

export async function updateVendor(id: string, formData: FormData) {
  const { supabase } = await requireUser()
  const vendorName = text(formData, 'vendor_name')
  if (!vendorName) throw new Error('Vendor name is required.')
  const { error } = await supabase.from('vendors').update({
    vendor_name: vendorName,
    contact_name: text(formData, 'contact_name'),
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    address: text(formData, 'address'),
    payment_terms: text(formData, 'payment_terms'),
    notes: text(formData, 'notes'),
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/vendors')
  revalidatePath(`/vendors/${id}`)
}
