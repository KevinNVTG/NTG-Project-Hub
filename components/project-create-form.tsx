'use client'

import { useMemo, useState } from 'react'
import { createProject } from '@/app/projects/actions'

type CustomerOption = {
  id: string
  label: string
  billing_address: string
}

export function ProjectCreateForm({
  customers,
  defaultCustomerId = '',
}: {
  customers: CustomerOption[]
  defaultCustomerId?: string
}) {
  const [customerId, setCustomerId] = useState(defaultCustomerId)
  const [useBillingAddress, setUseBillingAddress] = useState(false)
  const [projectAddress, setProjectAddress] = useState('')

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customers, customerId],
  )

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
    <form className="card sticky-form" action={createProject}>
      <h3 className="section-title">Create project</h3>

      <div className="field">
        <label>Customer</label>
        <select
          name="customer_id"
          value={customerId}
          onChange={(event) => handleCustomerChange(event.target.value)}
        >
          <option value="">No customer selected</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Project name</label>
        <input name="project_name" required />
      </div>

      <div className="field">
        <label>Project address</label>
        <textarea
          name="project_address"
          rows={3}
          value={projectAddress}
          onChange={(event) => {
            setProjectAddress(event.target.value)
            if (useBillingAddress && event.target.value !== (selectedCustomer?.billing_address || '')) {
              setUseBillingAddress(false)
            }
          }}
          placeholder="Enter the jobsite address"
        />
        <label className="checkbox-row" style={{ marginTop: 10 }}>
          <input
            type="checkbox"
            checked={useBillingAddress}
            disabled={!customerId || !selectedCustomer?.billing_address}
            onChange={(event) => handleBillingToggle(event.target.checked)}
          />
          <span>Use client billing address as project address</span>
        </label>
        {customerId && !selectedCustomer?.billing_address ? (
          <small className="muted">This client does not have a billing address saved yet.</small>
        ) : null}
        {useBillingAddress && selectedCustomer?.billing_address ? (
          <small className="muted">Using: {selectedCustomer.billing_address}</small>
        ) : null}
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Type</label>
          <select name="project_type">
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select name="status">
            <option value="lead">Lead</option>
            <option value="estimating">Estimating</option>
            <option value="awarded">Awarded</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="complete">Complete</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="field-help-box">
        <strong>Project value is set later.</strong>
        <span>Create the project first, then build the estimate/proposal. The contract value will update when the estimate is converted to a contract.</span>
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea name="notes" rows={3} />
      </div>

      <button className="primary-button" type="submit">Create project</button>
    </form>
  )
}
