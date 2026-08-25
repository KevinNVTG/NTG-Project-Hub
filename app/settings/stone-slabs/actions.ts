'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'

function text(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) || 0)
  return Number.isFinite(value) ? value : 0
}

export async function createStoneSlab(formData: FormData) {
  const { supabase, user } = await requireUser()
  const name = text(formData, 'name')
  if (!name) throw new Error('Stone slab name is required.')

  const { error } = await supabase.from('stone_slabs').insert({
    name,
    material_type: text(formData, 'material_type') || 'Quartz',
    supplier: text(formData, 'supplier') || null,
    color: text(formData, 'color') || null,
    sku: text(formData, 'sku') || null,
    slab_size: text(formData, 'slab_size') || null,
    estimate_price: numberValue(formData, 'estimate_price'),
    internal_cost: numberValue(formData, 'internal_cost'),
    notes: text(formData, 'notes') || null,
    active: true,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings/stone-slabs')
}

export async function updateStoneSlab(slabId: string, formData: FormData) {
  const { supabase } = await requireUser()
  const name = text(formData, 'name')
  if (!name) throw new Error('Stone slab name is required.')

  const { error } = await supabase.from('stone_slabs').update({
    name,
    material_type: text(formData, 'material_type') || 'Quartz',
    supplier: text(formData, 'supplier') || null,
    color: text(formData, 'color') || null,
    sku: text(formData, 'sku') || null,
    slab_size: text(formData, 'slab_size') || null,
    estimate_price: numberValue(formData, 'estimate_price'),
    internal_cost: numberValue(formData, 'internal_cost'),
    notes: text(formData, 'notes') || null,
    active: formData.get('active') === 'on',
  }).eq('id', slabId)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/stone-slabs')
}

export async function deleteStoneSlab(slabId: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from('stone_slabs').delete().eq('id', slabId)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/stone-slabs')
}
