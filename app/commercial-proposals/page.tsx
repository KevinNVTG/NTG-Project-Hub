import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'

function money(v:any){return Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'})}
function basis(v:string){return ({lump_sum:'Lump Sum',time_and_materials:'T&M',unit_price:'Unit Price',cost_plus:'Cost Plus',gmp:'GMP',not_to_exceed:'Not-to-Exceed'} as any)[v]||v}
export default async function CommercialProposalsPage(){
 const {supabase}=await requireUser()
 const {data:proposalRows}=await supabase.from('commercial_proposals').select('id,proposal_number,status,proposal_date,valid_until,title,pricing_basis,template_depth,projects(project_number,project_name),customers(first_name,last_name,co_client_first_name,co_client_last_name,company_name),commercial_proposal_items(quantity,unit_price,is_alternate)').order('created_at',{ascending:false})
 const rows = proposalRows ?? []
 return <AppShell title="Commercial Proposals"><div className="page-heading"><div><h2>Commercial Proposals</h2><p>CSI-formatted proposals for small service scopes through large commercial bid packages.</p></div><Link className="primary-button" href="/commercial-proposals/new">+ New Commercial Proposal</Link></div>
 <div className="card"><div className="table-wrap"><table><thead><tr><th>Proposal</th><th>Project</th><th>Basis</th><th>Format</th><th>Date</th><th>Base Bid</th><th>Status</th></tr></thead><tbody>{rows.map((r:any)=>{const p=Array.isArray(r.projects)?r.projects[0]:r.projects;const base=(r.commercial_proposal_items||[]).filter((i:any)=>!i.is_alternate).reduce((s:number,i:any)=>s+Number(i.quantity)*Number(i.unit_price),0);return <tr key={r.id}><td><Link className="text-link" href={`/commercial-proposals/${r.id}`}><strong>{r.proposal_number}</strong></Link><small className="table-subline">{r.title}</small></td><td>{p?.project_number}<small className="table-subline">{p?.project_name}</small></td><td>{basis(r.pricing_basis)}</td><td className="proposal-format-cell">{r.template_depth}</td><td>{r.proposal_date}</td><td>{money(base)}</td><td><span className={`badge proposal-status-${r.status}`}>{r.status}</span></td></tr>})}</tbody></table></div>{!rows.length?<div className="empty">No commercial proposals yet.</div>:null}</div></AppShell>
}
