from __future__ import annotations

from typing import Literal

from .models import (
    AlternativeDecision,
    DecisionContext,
    OptimizationDecision,
)
from .twin import build_facility_twin


Strategy = Literal["eco", "energy", "capacity", "balanced"]


def _score_machine(machine, strategy: Strategy) -> float:
    load_score = max(0.0, 100.0 - abs(75.0 - machine.load_pct) * 1.5)
    energy_score = max(0.0, 100.0 - (machine.energy_kwh / 15.0))
    water_score = max(0.0, 100.0 - (machine.water_m3 * 1.2))
    co2_score = max(0.0, 100.0 - (machine.co2_kg / 8.0))
    warning_penalty = 18.0 if machine.status == "warning" else 0.0

    if strategy == "eco":
        score = (co2_score * 0.45) + (water_score * 0.25) + (energy_score * 0.20) + (load_score * 0.10)
    elif strategy == "energy":
        score = (energy_score * 0.55) + (load_score * 0.20) + (co2_score * 0.15) + (water_score * 0.10)
    elif strategy == "capacity":
        score = (load_score * 0.60) + (energy_score * 0.15) + (co2_score * 0.15) + (water_score * 0.10)
    else:
        score = (load_score * 0.35) + (energy_score * 0.25) + (co2_score * 0.25) + (water_score * 0.15)

    return round(max(0.0, score - warning_penalty), 1)


def build_optimization_decision(
    facility: str,
    strategy: Strategy = "balanced",
    order_id: str = "ORD-24115",
    current_machine: str = "RM-08",
) -> OptimizationDecision:
    twin = build_facility_twin(facility)

    order = next((o for o in twin.active_orders if o.order_id == order_id), None)
    required_process = getattr(order, "process_type", None)

    eligible_machines = list(twin.machines)
    compatibility_note = ""

    if required_process:
        matched = [m for m in twin.machines if (m.line_id or "").lower() == str(required_process).lower()]
        if matched:
            eligible_machines = matched
            compatibility_note = (
                f" Compatibility filter applied: only {required_process} machines were evaluated."
            )
        else:
            compatibility_note = (
                f" No compatible machines were found for required process {required_process}; "
                f"fallback ranking used all machines."
            )

    ranked = []
    for m in eligible_machines:
        ranked.append(
            AlternativeDecision(
                machine=m.machine_id,
                score=_score_machine(m, strategy),
                load_pct=m.load_pct,
                energy_kwh=m.energy_kwh,
                water_m3=m.water_m3,
                co2_kg=m.co2_kg,
                verdict="fallback",
            )
        )

    ranked.sort(key=lambda x: x.score, reverse=True)

    for i, item in enumerate(ranked):
        if i == 0:
            item.verdict = "recommended"
        elif item.score < 60:
            item.verdict = "avoid"
        else:
            item.verdict = "fallback"

    best = ranked[0]
    note = (
        f"Use {best.machine} for {order_id}. "
        f"It offers the strongest {strategy} profile across load fit, energy, water, and CO2 impact."
        f"{compatibility_note}"
    )

    return OptimizationDecision(
        decision_context=DecisionContext(
            order_id=order_id,
            current_machine=current_machine,
            strategy=strategy,
        ),
        alternatives=ranked,
        decision_note=note,
    )
