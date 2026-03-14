# AGENTS

## Agent Strategy

Zero@Production is expanding toward an agent-supported architecture.

The first approved agent families are:

1. Universal Data Intake Agent
2. Report Generator Agent

---

## 1. Universal Data Intake Agent

### Purpose
Accept heterogeneous data sources and convert them into the canonical schema used by the system’s manual input form.

### Supported source types
- CSV
- XLSX
- PDF
- scanned documents
- images
- screenshots
- pasted text

### Responsibilities
- detect source type
- extract structured values
- normalize units
- map fields to canonical schema
- generate CSV
- store normalized JSON
- store original source
- prepare review-ready import draft

### Safety principle
The intake agent should not write directly into production-final records without review.
It should produce:
- parsed draft
- mapped draft
- review state
- approved import

---

## 2. Report Generator Agent

### Purpose
Generate management-ready reports from available system data.

### Supported report families
- Zero@Production standard report
- Executive board report
- Sustainability / ESG report
- Data audit report
- custom template report

### Supported export formats
- PDF
- DOCX
- HTML
- CSV
- JSON

### Responsibilities
- collect normalized source data
- assemble report sections
- apply template logic
- generate exportable output
- preserve report metadata and revision trace

---

## Design Principle

Agents must remain:
- modular
- auditable
- review-safe
- extendable
- compatible with the Zero@ UI and data standards

---

## 2026-03-11 — Intake Agent Status Update

Status is now consolidated into:
- `AGENTS_MASTER_STATUS_2026-03-11.md`

Current summary:
- Universal Data Intake Agent Phase 2 / 2.1 stable
- Reporting Agent architecture defined
- Next phase: Report Generator MVP skeleton


---

## SAP Mock Feeder Agent

Location:
agents/sap_mock_feeder

Purpose:

Simulates a **live ERP / SAP operational data stream** into Zero@Production.

This agent is used for:

• ingestion testing  
• migration simulation  
• dashboard live data demos  

Architecture:

sap_event_generator.py  
→ generates realistic factory events

sap_api_sender.py  
→ sends events to intake API

sap_csv_writer.py  
→ exports events to CSV

sap_feeder_runner.py  
→ orchestrates generator + delivery modes

Supported delivery modes:

api  
csv  
both  

Burst simulation:

Supports batch export behavior similar to enterprise ERP systems.

Example:

1 event → 1 POST  
or  
N events → burst batch

Output pipeline:

SAP Feeder  
→ /api/intake/raw  
→ intake_agent  
→ normalized JSON  
→ review manifest

Golden snapshot:

.golden/golden-sap-feeder-v1-ui-ready-*

Next planned feature:

Executive Dashboard **Live Data Intake Monitor**

---

## Production Decision Engine Agent — 2026-03-14

The Production Decision Engine acts as a lightweight **Factory Intelligence Agent** within the Zero@Production dashboard.

Responsibilities:

- evaluate machine candidates for a production order
- verify capacity compatibility
- estimate sustainability metrics
- generate operational decision guidance

Inputs:

- production_orders
- process_benchmarks
- machine_status_live

Core decision view:

public.v_production_decision_engine

Output signals:

- recommended machine
- capacity verdict
- estimated energy
- estimated water
- estimated CO₂
- decision note

### Next Evolution

The agent will evolve into a **Machine Optimizer Agent**.

Planned capabilities:

- ranking candidate machines
- computing decision score
- identifying best machine automatically
- supporting multi-scenario comparison
- producing executive optimization insight

This layer will extend the current decision engine without redesigning the database or dashboard architecture.


---

## Brain V2 / Executive Intelligence Agent — 2026-03-14 Checkpoint

### New Brain V2 Endpoint
- `/api/brain/status/v2?facility=ekoten&strategy=balanced`

### Brain V2 Output Blocks
- facility
- timestamp
- overall_status
- confidence
- summary
- signals
- anomalies
- recommended_actions
- views
- optimization_decision
- twin

### Executive Integration Status
- executive drawer is connected
- frontend fetch order:
  1. Brain V2
  2. fallback to Brain V1
- V2 sections are now visible in the Executive AI modal

### Critical Logic Gap
Machine optimization is not yet filtered by process compatibility.

Example failure:
- order process type: `finishing`
- recommended machine: `JET-02`
- machine line: `dyeing`

Required next agent evolution:
- add compatibility filter before ranking
- allow only eligible machines into optimization candidates
- optionally expose `eligible / ineligible` status in response

