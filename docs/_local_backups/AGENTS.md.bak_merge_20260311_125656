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

### Universal Data Intake Agent
Status: **Phase 2 / 2.1 stable checkpoint**

Implemented scope:
- canonical intake schema
- intake workflow
- review / approval flow
- CSV parser
- pasted text parser
- normalized JSON writer
- flat CSV writer
- review manifest writer
- hardening layer
- source hash
- record fingerprint
- validation
- confidence scoring
- TR / EU numeric coercion fix
- CSV raw string preservation before normalization

### Reporting Agent
Status: **architecture defined, MVP not yet implemented**

Next build target:
- Report Generator MVP skeleton
