'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'

export async function createProject(formData: FormData) {
  const { supabase } = await requireUser()
  const customerId = String(formData.get('customer_id') || '')
  const payload = {
    customer_id: customerId || null,
    project_name: String(formData.get('project_name') || ''),
    project_address: String(formData.get('project_address') || ''),
    project_type: String(formData.get('project_type') || 'residential'),
    status: String(formData.get('status') || 'lead'),
    contract_amount: Number(formData.get('contract_amount') || 0),
    notes: String(formData.get('notes') || ''),
  }
  const { error } = await supabase.from('projects').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/projects')
  revalidatePath('/dashboard')
}
