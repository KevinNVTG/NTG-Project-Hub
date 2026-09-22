'use client'

import { useState } from 'react'

const PRESETS = {
  standard: `Nevada Tile & Granite is pleased to submit this proposal for the tile and stone scope associated with the referenced project. Our team specializes in commercial tile and stone installations with an emphasis on quality workmanship, efficient project execution, and maintaining demanding construction schedules.\n\nThis proposal has been prepared based on the project information, drawings, specifications, addenda, and clarifications made available to us at the time of bidding. The following proposal outlines our applicable scope of work, pricing, inclusions, exclusions, and project-specific qualifications. All work will be performed in accordance with the applicable project requirements and recognized industry standards.`,
  tm_union: `Nevada Tile & Granite is pleased to submit this proposal for the tile and stone scope associated with the referenced project. Our team is prepared to provide qualified supervision and union field labor necessary to support the project's schedule, sequencing, and installation requirements.\n\nThe proposed work will be performed on a Time & Materials basis using the labor classifications, billing rates, material allowances, markups, and other terms identified within this proposal. This proposal has been prepared based on the project information and requirements made available to us and is intended to clearly establish the basis of compensation, scope, and commercial terms prior to commencement of work.`,
  tile: `Nevada Tile & Granite is pleased to submit this proposal for the commercial tile scope associated with the referenced project. Our team specializes in efficient, high-quality tile installations and is prepared to coordinate our work with the project schedule, sequencing, drawings, specifications, and other trades.\n\nThe following proposal identifies our tile scope, pricing, inclusions, exclusions, and project-specific qualifications based on the bid information made available to us at the time of proposal.`,
  stone: `Nevada Tile & Granite is pleased to submit this proposal for the stone countertop scope associated with the referenced project. Our team provides professional stone fabrication and installation with careful attention to field dimensions, coordination, finish quality, scheduling, and project requirements.\n\nThe following proposal identifies our stone scope, pricing, inclusions, exclusions, and project-specific qualifications based on the bid information made available to us at the time of proposal.`,
  tile_stone: `Nevada Tile & Granite is pleased to submit this proposal for the tile and stone countertop scopes associated with the referenced project. Our team provides coordinated commercial tile installation and stone fabrication/installation with an emphasis on quality workmanship, efficient execution, and maintaining demanding construction schedules.\n\nFor clarity, the tile and stone countertop work are presented as separate CSI scopes and pricing schedules within this proposal. The proposal is based on the drawings, specifications, addenda, clarifications, and other bid information made available to us at the time of proposal.`
} as const

type PresetKey = keyof typeof PRESETS

export function ProposalIntroductionPresets({ name='executive_summary', defaultValue='' }: { name?: string, defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue)
  const apply = (key: PresetKey) => setValue(PRESETS[key])
  return <div className="field span-3">
    <label>Executive summary / proposal introduction</label>
    <div className="quick-actions-inline" style={{marginBottom:'8px', flexWrap:'wrap'}}>
      <button className="secondary-button" type="button" onClick={()=>apply('standard')}>Standard Commercial</button>
      <button className="secondary-button" type="button" onClick={()=>apply('tm_union')}>T&amp;M / Union</button>
      <button className="secondary-button" type="button" onClick={()=>apply('tile')}>Tile Only</button>
      <button className="secondary-button" type="button" onClick={()=>apply('stone')}>Stone Only</button>
      <button className="secondary-button" type="button" onClick={()=>apply('tile_stone')}>Tile + Stone</button>
      <button className="secondary-button" type="button" onClick={()=>setValue('')}>Clear</button>
    </div>
    <textarea name={name} rows={7} value={value} onChange={e=>setValue(e.target.value)} placeholder="Choose a preset above or write a custom proposal introduction." />
    <p className="muted-copy" style={{marginTop:'6px'}}>A preset fills the introduction only. You can edit any wording before saving the proposal.</p>
  </div>
}
