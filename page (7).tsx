'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').insert({
    customer_id: String(formData.get('customer_id') || '') || null,
    name: String(formData.get('name') || ''),
    project_address: String(formData.get('project_address') || '') || null,
    project_type: String(formData.get('project_type') || 'Residential'),
    status: String(formData.get('status') || 'Lead'),
    contract_amount: Number(formData.get('contract_amount') || 0),
    notes: String(formData.get('notes') || '') || null,
  })
  if (error) throw new Error(error.message)
  redirect('/projects')
}
