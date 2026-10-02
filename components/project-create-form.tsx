'use client'

import { useMemo, useState } from 'react'
import { createProject } from '@/app/projects/actions'

type CustomerOption = {
  id: string
  label: string
  billing_address: string
}

export function ProjectCreateForm({ customers, defaultCustomerId = '' }: { customers: CustomerOption[]; defaultCustomerId?: string }) {
  const [customerId, setCustomerId] = useState(defaultCustomerId)
  const [useBillingAddress, setUseBillingAddress] = useState(false)
  const [projectAddress, setProjectAddress] = useState('')

  const selectedCustomer = useMemo(() => customers.find((customer) => customer.id === customerId), [customers, customerId])

  function handleCustomerChange(nextCustomerId: string) {
    setCustomerId(nextCustomerId)
    if (useBillingAddress) {
      const customer = customers.find((item) => item.id === nextCustomerId)
      setProjectAddress(customer?.billing_address || '')
    }
  }

  function handleBillingToggle(checked: boolean) {
    setUseBillingAddress(checked)
    if (checked) setProjectAddress(selectedCustomer?.billing_address || '')
  }

  return (
    <form className="card project-create-card" action={createProject}>
      <div className="section-heading project-create-heading">
        <div><h3 className="section-title">Create new project</h3><p className="muted-copy">Start the job record first. Pricing and contract value are established later through the estimate, proposal, and contract workflow.</p></div>
      </div>
      <div className="project-create-grid">
        <div className="field span-2"><label>Customer</label><select name="customer_id" value={customerId} onChange={(event) => handleCustomerChange(event.target.value)}><option value="">No customer selected</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.label}</option>)}</select></div>
        <div className="field span-2"><label>Project name</label><input name="project_name" required placeholder="Project or job name" /></div>
        <div className="field span-2"><label>Project address</label><textarea name="project_address" rows={2} value={projectAddress} onChange={(event) => { setProjectAddress(event.target.value); if (useBillingAddress && event.target.value !== (selectedCustomer?.billing_address || '')) setUseBillingAddress(false) }} placeholder="Enter the jobsite address" /><label className="checkbox-row compact-check"><input type="checkbox" checked={useBillingAddress} disabled={!customerId || !selectedCustomer?.billing_address} onChange={(event) => handleBillingToggle(event.target.checked)} /><span>Use client billing address</span></label>{customerId && !selectedCustomer?.billing_address ? <small className="muted">This client does not have a billing address saved.</small> : null}</div>
        <div className="field"><label>Type</label><select name="project_type"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>
        <div className="field"><label>Status</label><select name="status"><option value="lead">Lead</option><option value="estimating">Estimating</option><option value="awarded">Awarded</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="complete">Complete</option><option value="closed">Closed</option></select></div>
        <div className="field span-2"><label>Notes</label><textarea name="notes" rows={2} placeholder="Internal project notes, schedule notes, access information, etc." /></div>
        <div className="project-create-action"><button className="inline-primary" type="submit">Create project</button></div>
      </div>
    </form>
  )
}
