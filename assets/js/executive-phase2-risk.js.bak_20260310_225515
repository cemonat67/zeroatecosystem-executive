(function () {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function safeNumber(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function collectModalInputs() {
    return {
      water_m3: safeNumber(byId("water_m3")?.value),
      energy_kwh: safeNumber(byId("energy_kwh")?.value),
      co2_kg: safeNumber(byId("co2_kg")?.value),
      cod: safeNumber(byId("cod")?.value),
      bod: safeNumber(byId("bod")?.value),
      tss: safeNumber(byId("tss")?.value),
      ph: safeNumber(byId("ph")?.value),
      waste_kg: safeNumber(byId("waste_kg")?.value),
      incident_note: (byId("incident_note")?.value || "").trim()
    };
  }

  function calculateExecutiveRisk(data) {
    var ww = (data.cod + data.bod + data.tss) / 3;

    var ceo =
      ww * 0.30 +
      data.co2_kg * 0.20 +
      data.water_m3 * 0.20 +
      (data.incident_note ? 15 : 0) * 0.15 +
      data.waste_kg * 0.15;

    var cfo =
      data.energy_kwh * 0.35 +
      data.co2_kg * 0.30 +
      ww * 0.20 +
      data.waste_kg * 0.15;

    var cto =
      ww * 0.40 +
      data.ph * 0.30 +
      data.water_m3 * 0.20 +
      (data.incident_note ? 10 : 0) * 0.10;

    return {
      ceo: Math.min(Math.round(ceo), 100),
      cfo: Math.min(Math.round(cfo), 100),
      cto: Math.min(Math.round(cto), 100)
    };
  }

  function buildExecutiveAlerts(data, risk) {
    var alerts = [];

    if (data.cod > 120) {
      alerts.push({
        owner: "CTO",
        severity: "high",
        title: "COD threshold exceeded",
        action: "Inspect wastewater treatment"
      });
    }

    if (data.energy_kwh > 10000) {
      alerts.push({
        owner: "CFO",
        severity: "medium",
        title: "Energy cost spike",
        action: "Review facility load"
      });
    }

    if (risk.ceo > 60) {
      alerts.push({
        owner: "CEO",
        severity: "critical",
        title: "Board escalation risk",
        action: "Immediate sustainability review"
      });
    }

    return alerts;
  }

  function persistExecutiveState(payload) {
    localStorage.setItem("zero_exec_phase2_state", JSON.stringify(payload));
  }

  function saveEsgEntryPhase2() {
    var data = collectModalInputs();
    var risk = calculateExecutiveRisk(data);
    var alerts = buildExecutiveAlerts(data, risk);

    persistExecutiveState({
      esg: data,
      risk: risk,
      alerts: alerts,
      ts: new Date().toISOString()
    });

    console.log("[Phase2] ESG saved", { data: data, risk: risk, alerts: alerts });
  }

  window.ZeroExecutivePhase2 = {
    collectModalInputs: collectModalInputs,
    calculateExecutiveRisk: calculateExecutiveRisk,
    buildExecutiveAlerts: buildExecutiveAlerts,
    persistExecutiveState: persistExecutiveState,
    saveEsgEntryPhase2: saveEsgEntryPhase2
  };

  console.log("[Phase2] executive-phase2-risk loaded");
})();
