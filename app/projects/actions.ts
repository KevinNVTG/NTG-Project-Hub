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
  const contractAmountRaw = formData.get('contract_amount')
  const updatePayload: Record<string, string | number | null> = {
    customer_id: customerId || null,
    project_name: text(formData, 'project_name'),
    project_address: text(formData, 'project_address'),
    project_type: text(formData, 'project_type') || 'residential',
    status: text(formData, 'status') || 'lead',
    notes: text(formData, 'notes'),
  }

  // Save a manually edited contract value when the project form actually submits one.
  // If a different project form does not include contract_amount, leave the stored value untouched.
  if (contractAmountRaw !== null && String(contractAmountRaw).trim() !== '') {
    const contractAmount = Number(contractAmountRaw)
    if (!Number.isFinite(contractAmount) || contractAmount < 0) {
      throw new Error('Contract amount must be a valid non-negative number.')
    }
    updatePayload.contract_amount = contractAmount
  }

  const { error } = await supabase.from('projects').update(updatePayload).eq('id', projectId)
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
