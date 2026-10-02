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
    contract_amount: 0,
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
    // Preserve the contract value. Project status/details edits must never reset financials.
    notes: text(formData, 'notes'),
  }).eq('id', projectId)
  if (error) throw new Error(error.message)
  await supabase.from('activity_logs').insert({ project_id: projectId, user_id: user.id, action: 'Project updated' })
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}


export async function deleteProject(projectId: string) {
  const { supabase, user } = await requireUser()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(profileError.message)
  if (!profile || !['owner', 'administrator'].includes(profile.role)) {
    throw new Error('Only an owner or administrator can permanently delete a project.')
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id,project_number,project_name')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    throw new Error(projectError?.message || 'Project not found.')
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw new Error(error.message)

  revalidatePath('/projects')
  revalidatePath('/dashboard')
  return { ok: true, projectNumber: project.project_number, projectName: project.project_name }
}
