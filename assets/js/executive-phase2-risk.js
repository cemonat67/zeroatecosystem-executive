(function () {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function round1(v) {
    return Math.round((Number(v) || 0) * 10) / 10;
  }

  function collectFallbackInputs() {
    return {
      facility: (byId("esgFacility")?.value || "Ekoten").trim(),
      period_label: (byId("esgPeriodLabel")?.value || "").trim(),
      electricity_kwh: num(byId("esgElectricityKwh")?.value),
      natural_gas_m3: num(byId("esgNaturalGasM3")?.value),
      steam_ton: num(byId("esgSteamTon")?.value),
      water_m3: num(byId("esgWaterM3")?.value),
      industrial_waste_kg: num(byId("esgIndustrialWasteKg")?.value),
      domestic_waste_kg: num(byId("esgDomesticWasteKg")?.value),
      forklift_fuel_l: num(byId("esgForkliftFuelL")?.value),
      vehicle_fuel_l: num(byId("esgVehicleFuelL")?.value),
      raw_material_transport_tkm: num(byId("esgRawMaterialTransportTkm")?.value),
      product_transport_tkm: num(byId("esgProductTransportTkm")?.value)
    };
  }

  function collectModalInputs() {
    if (typeof window.collectEsgFormData === "function") {
      try {
        return window.collectEsgFormData();
      } catch (e) {
        console.warn("[Phase2] collectEsgFormData failed, fallback used", e);
      }
    }
    return collectFallbackInputs();
  }

  function calculateOverlay(data) {
    if (typeof window.calculateEsgOverlay === "function") {
      try {
        return window.calculateEsgOverlay(data);
      } catch (e) {
        console.warn("[Phase2] calculateEsgOverlay failed, fallback used", e);
      }
    }

    var co2_kg =
      (data.electricity_kwh * 0.42) +
      (data.natural_gas_m3 * 2.02) +
      (data.steam_ton * 65) +
      (data.forklift_fuel_l * 2.68) +
      (data.vehicle_fuel_l * 2.68) +
      (data.raw_material_transport_tkm * 0.09) +
      (data.product_transport_tkm * 0.08);

    var co2_ton = co2_kg / 1000;
    var energyLoad =
      data.electricity_kwh +
      (data.natural_gas_m3 * 10.55) +
      (data.steam_ton * 100);

    var signalVelocity = Math.min(35, co2_ton * 1.8);
    var financialExposure = Math.min(35, co2_ton * 1.5);
    var operationalNoise = Math.min(
      30,
      (data.water_m3 / 8) +
      ((data.industrial_waste_kg + data.domestic_waste_kg) / 120)
    );

    return {
      co2_kg: round1(co2_kg),
      co2_ton: round1(co2_ton),
      energy_load: Math.round(energyLoad),
      water_plus_waste: round1(
        data.water_m3 + ((data.industrial_waste_kg + data.domestic_waste_kg) / 100)
      ),
      signal_velocity: round1(signalVelocity),
      financial_exposure: round1(financialExposure),
      operational_noise: round1(operationalNoise)
    };
  }

  function calculateExecutiveRisk(data, overlay) {
    overlay = overlay || calculateOverlay(data);

    var ceo =
      Math.min(
        100,
        overlay.signal_velocity +
        (overlay.co2_ton * 0.9) +
        (data.water_m3 / 12) +
        ((data.industrial_waste_kg + data.domestic_waste_kg) / 90)
      );

    var cfo =
      Math.min(
        100,
        overlay.financial_exposure +
        (overlay.energy_load / 1200) +
        ((data.electricity_kwh + (data.natural_gas_m3 * 10.55)) / 2200)
      );

    var cto =
      Math.min(
        100,
        overlay.operational_noise +
        (data.water_m3 / 10) +
        ((data.industrial_waste_kg + data.domestic_waste_kg) / 110)
      );

    return {
      ceo: Math.round(ceo),
      cfo: Math.round(cfo),
      cto: Math.round(cto)
    };
  }

  function buildExecutiveAlerts(data, overlay, risk) {
    var alerts = [];

    if (overlay.co2_ton >= 25) {
      alerts.push({
        owner: "CEO",
        severity: "high",
        title: "Carbon visibility rising",
        action: "Review enterprise sustainability posture"
      });
    }

    if (overlay.energy_load >= 25000) {
      alerts.push({
        owner: "CFO",
        severity: "medium",
        title: "Energy cost pressure building",
        action: "Review energy drivers and cost exposure"
      });
    }

    if (data.water_m3 >= 250 || (data.industrial_waste_kg + data.domestic_waste_kg) >= 1000) {
      alerts.push({
        owner: "CTO",
        severity: "high",
        title: "Operational load exceeds monitor band",
        action: "Inspect water and waste control pattern"
      });
    }

    if (risk.ceo >= 60) {
      alerts.push({
        owner: "CEO",
        severity: "critical",
        title: "Board escalation risk",
        action: "Prepare executive review"
      });
    }

    return alerts;
  }

  function persistExecutiveState(payload) {
    localStorage.setItem("zero_exec_phase2_state", JSON.stringify(payload));
  }

  function updatePhase1SummaryIfAvailable(overlay) {
    if (typeof window.updateEsgSummary === "function") {
      try {
        window.updateEsgSummary(overlay);
      } catch (e) {
        console.warn("[Phase2] updateEsgSummary skipped", e);
      }
    }
  }

  function updateExecutiveCards(risk) {
    console.log("[Phase2] card refresh pending", risk);
  }

  function updateAlertsTable(alerts) {
    console.log("[Phase2] alerts refresh pending", alerts);
  }

  function saveEsgEntryPhase2() {
    var data = collectModalInputs();
    var overlay = calculateOverlay(data);
    var risk = calculateExecutiveRisk(data, overlay);
    var alerts = buildExecutiveAlerts(data, overlay, risk);

    updatePhase1SummaryIfAvailable(overlay);
    updateExecutiveCards(risk);
    updateAlertsTable(alerts);

    var payload = {
      esg: data,
      overlay: overlay,
      risk: risk,
      alerts: alerts,
      ts: new Date().toISOString()
    };

    persistExecutiveState(payload);

    console.log("[Phase2] ESG saved", payload);
    return payload;
  }

  function bindSaveButton() {
    var btn = byId("saveEsgConsumptionBtn");
    var form = byId("esgDataEntryForm");

    if (!form || form.__ZERO_PHASE2_BOUND__) return;
    form.__ZERO_PHASE2_BOUND__ = true;

    form.addEventListener("submit", function (e) {
      try {
        e.preventDefault();
      } catch (_) {}
      saveEsgEntryPhase2();
    });

    if (btn) {
      btn.setAttribute("data-phase2-bound", "true");
    }
  }

  window.ZeroExecutivePhase2 = {
    collectModalInputs: collectModalInputs,
    calculateOverlay: calculateOverlay,
    calculateExecutiveRisk: calculateExecutiveRisk,
    buildExecutiveAlerts: buildExecutiveAlerts,
    persistExecutiveState: persistExecutiveState,
    saveEsgEntryPhase2: saveEsgEntryPhase2,
    bindSaveButton: bindSaveButton
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSaveButton);
  } else {
    bindSaveButton();
  }

  console.log("[Phase2] executive-phase2-risk loaded");
})();
