'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function text(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireUser()
  const customerId = text(formData, 'customer_id')
  const projectName = text(formData, 'project_name')
  if (!projectName) throw new Error('Project name is required.')

  const { data, error } = await supabase.from('projects').insert({
    customer_id: customerId || null,
    project_name: projectName,
    project_address: text(formData, 'project_address'),
    project_type: text(formData, 'project_type') || 'residential',
    status: text(formData, 'status') || 'lead',
    contract_amount: Number(formData.get('contract_amount') || 0),
    notes: text(formData, 'notes'),
  }).select('id,project_number').single()

  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({ project_id: data.id, user_id: user.id, action: 'Project created', details: { project_number: data.project_number } })
  revalidatePath('/projects')
  revalidatePath('/dashboard')
  redirect(`/projects/${data.id}`)
}

export async function updateProject(projectId: string, formData: FormData) {
  const { supabase, user } = await requireUser()
  const customerId = text(formData, 'customer_id')
  const { error } = await supabase.from('projects').update({
    customer_id: customerId || null,
    project_name: text(formData, 'project_name'),
    project_address: text(formData, 'project_address'),
    project_type: text(formData, 'project_type') || 'residential',
    status: text(formData, 'status') || 'lead',
    contract_amount: Number(formData.get('contract_amount') || 0),
    notes: text(formData, 'notes'),
  }).eq('id', projectId)
  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({ project_id: projectId, user_id: user.id, action: 'Project updated' })
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}
