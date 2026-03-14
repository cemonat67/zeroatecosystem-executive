
(function injectAIBrainV2Styles() {
  if (document.getElementById("ai-brain-v2-styles")) return;
  const style = document.createElement("style");
  style.id = "ai-brain-v2-styles";
  style.textContent = `
    .ai-section{margin-top:18px}
    .ai-section-title{margin:0 0 10px 0;font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.8}
    .ai-card-stack{display:grid;gap:12px}
    .ai-card{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;background:rgba(255,255,255,.03)}
    .ai-card-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
    .ai-card-body{display:grid;gap:10px}
    .ai-card-message{font-size:13px;line-height:1.45;opacity:.96}
    .ai-meta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}
    .ai-kv-row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed rgba(255,255,255,.08);padding-bottom:4px}
    .ai-kv-label{opacity:.72;font-size:12px}
    .ai-kv-value{font-size:12px;font-weight:600;text-align:right}
    .ai-hint{font-size:12px;opacity:.84}
    .ai-pill{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
    .ai-pill-low{background:rgba(120,180,120,.18);border:1px solid rgba(120,180,120,.35)}
    .ai-pill-medium{background:rgba(249,186,0,.18);border:1px solid rgba(249,186,0,.35)}
    .ai-pill-high,.ai-pill-alert,.ai-pill-critical{background:rgba(213,22,53,.18);border:1px solid rgba(213,22,53,.35)}
    .ai-pill-normal{background:rgba(120,180,120,.18);border:1px solid rgba(120,180,120,.35)}
    .ai-pill-watch{background:rgba(249,186,0,.18);border:1px solid rgba(249,186,0,.35)}
    .ai-hero-status{border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))}
    .ai-hero-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px}
    .ai-hero-headline{font-size:16px;font-weight:700;line-height:1.35;margin-bottom:6px}
    .ai-hero-text{font-size:13px;opacity:.88;line-height:1.45}
    .ai-empty{font-size:13px;opacity:.65;padding:8px 0}
    .ai-table-wrap{overflow:auto}
    .ai-table{width:100%;border-collapse:collapse;font-size:12px}
    .ai-table th,.ai-table td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;white-space:nowrap}
  `;
  document.head.appendChild(style);
})();


(function () {
  const API_URL = "http://127.0.0.1:8010/api/brain/status?facility=ekoten";

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safe(value, fallback = "—") {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  }

  
  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSeverityPill(sev) {
    const val = String(sev || "low").toLowerCase();
    return `<span class="ai-pill ai-pill-${esc(val)}">${esc(val)}</span>`;
  }

  function renderKV(label, value) {
    return `
      <div class="ai-kv-row">
        <span class="ai-kv-label">${esc(label)}</span>
        <span class="ai-kv-value">${esc(value)}</span>
      </div>
    `;
  }

  function renderSignalCard(item) {
    return `
      <div class="ai-card ai-card-signal">
        <div class="ai-card-top">
          <strong>${esc(item.code || "SIGNAL")}</strong>
          ${renderSeverityPill(item.severity)}
        </div>
        <div class="ai-card-body">
          <div class="ai-card-message">${esc(item.message || "")}</div>
          <div class="ai-meta-grid">
            ${renderKV("Dimension", item.dimension || "-")}
            ${renderKV("Value", item.value != null ? `${item.value} ${item.unit || ""}`.trim() : "-")}
            ${renderKV("Baseline", item.baseline != null ? item.baseline : "-")}
            ${renderKV("Delta", item.delta_pct != null ? `${item.delta_pct}%` : "-")}
          </div>
          ${item.action_hint ? `<div class="ai-hint"><strong>Action:</strong> ${esc(item.action_hint)}</div>` : ""}
        </div>
      </div>
    `;
  }

  function renderAnomalyCard(item) {
    return `
      <div class="ai-card ai-card-anomaly">
        <div class="ai-card-top">
          <strong>${esc(item.metric || "ANOMALY")}</strong>
          ${renderSeverityPill(item.severity)}
        </div>
        <div class="ai-card-body">
          <div class="ai-card-message">${esc(item.explanation || "")}</div>
          <div class="ai-meta-grid">
            ${renderKV("Entity", item.entity_id || "-")}
            ${renderKV("Score", item.anomaly_score != null ? item.anomaly_score : "-")}
            ${renderKV("Expected", item.expected_value != null ? item.expected_value : "-")}
            ${renderKV("Actual", item.actual_value != null ? item.actual_value : "-")}
            ${renderKV("Deviation", item.deviation_pct != null ? `${item.deviation_pct}%` : "-")}
          </div>
        </div>
      </div>
    `;
  }

  function renderActionCard(item) {
    const impact = item.expected_impact || {};
    const fin = item.financial_effect || {};
    return `
      <div class="ai-card ai-card-action">
        <div class="ai-card-top">
          <strong>${esc(item.title || "Recommended action")}</strong>
          ${renderSeverityPill(item.priority)}
        </div>
        <div class="ai-card-body">
          <div class="ai-card-message">${esc(item.rationale || "")}</div>
          <div class="ai-meta-grid">
            ${renderKV("Owner", item.owner || "-")}
            ${renderKV("Confidence", item.confidence != null ? item.confidence : "-")}
            ${renderKV("Energy Impact", impact.energy_kwh != null ? impact.energy_kwh : "-")}
            ${renderKV("CO₂ Impact", impact.co2_kg != null ? impact.co2_kg : "-")}
            ${renderKV("Water Impact", impact.water_m3 != null ? impact.water_m3 : "-")}
            ${renderKV("TRY Impact", fin.cost_saving_try != null ? fin.cost_saving_try : "-")}
          </div>
        </div>
      </div>
    `;
  }

  function renderAltRow(item) {
    return `
      <tr>
        <td>${esc(item.machine || "-")}</td>
        <td>${esc(item.score != null ? item.score : "-")}</td>
        <td>${esc(item.load_pct != null ? item.load_pct : "-")}</td>
        <td>${esc(item.energy_kwh != null ? item.energy_kwh : "-")}</td>
        <td>${esc(item.water_m3 != null ? item.water_m3 : "-")}</td>
        <td>${esc(item.co2_kg != null ? item.co2_kg : "-")}</td>
        <td>${esc(item.verdict || "-")}</td>
      </tr>
    `;
  }

  function renderV2Section(title, body) {
    return `
      <section class="ai-section">
        <h4 class="ai-section-title">${esc(title)}</h4>
        ${body}
      </section>
    `;
  }


  function normalizeBrainPayload(data) {
    const isV2 =
      data &&
      (
        data?.optimization_decision ||
        data?.recommended_actions ||
        data?.anomalies ||
        data?.views ||
        data?.overall_status
      );

    if (isV2) {
      const views = data?.views || {};
      const summaryRaw = typeof data?.summary === "string"
        ? data.summary
        : (
            data?.summary?.headline ||
            data?.summary?.text ||
            data?.message ||
            data?.insight ||
            "No summary available."
          );

      const summaryHeadline =
        data?.summary?.headline ||
        data?.summary_headline ||
        data?.overall_status ||
        "AI Brain Summary";

      const summaryText =
        data?.summary?.text ||
        data?.summary?.short_text ||
        data?.summary_text ||
        (typeof data?.summary === "string" ? data.summary : "") ||
        data?.message ||
        data?.insight ||
        "No summary available.";

      const actions = Array.isArray(data?.recommended_actions) ? data.recommended_actions : [];
      const firstAction = actions[0] || {};

      return {
        version: "v2",
        overall_status: data?.overall_status || data?.status || "unknown",
        confidence: data?.confidence ?? "-",
        summary_headline: summaryHeadline,
        summary_text: summaryText,
        summary: summaryRaw,
        recommendation:
          firstAction?.title ||
          firstAction?.rationale ||
          data?.recommended_action ||
          data?.next_action ||
          "No recommendation available.",
        reasons: Array.isArray(data?.signals) ? data.signals : [],
        signals: Array.isArray(data?.signals) ? data.signals : [],
        anomalies: Array.isArray(data?.anomalies) ? data.anomalies : [],
        recommended_actions: actions,
        optimization_decision: data?.optimization_decision || {},
        financial_view:
          views?.financial_view ||
          views?.financial ||
          {},
        sustainability_view:
          views?.sustainability_view ||
          views?.sustainability ||
          {},
        twin: data?.twin || {},
        lastUpdated:
          data?.timestamp ||
          data?.updated_at ||
          data?.last_updated ||
          "—"
      };
    }

    return {
      status:
        data?.status ||
        data?.health ||
        data?.brain_status ||
        "unknown",
      mode:
        data?.mode ||
        data?.lens ||
        data?.active_mode ||
        "executive",
      summary:
        data?.summary ||
        data?.ops_note ||
        data?.message ||
        data?.insight ||
        data?.description ||
        "No summary available.",
      recommendation:
        data?.recommendation ||
        data?.next_action ||
        data?.recommended_action ||
        "No recommendation available.",
      reasons:
        data?.reasons ||
        data?.signals ||
        data?.alerts ||
        data?.issues ||
        [],
      financeNote:
        data?.finance_note ||
        data?.financeNote ||
        "",
      sustainabilityNote:
        data?.sustainability_note ||
        data?.sustainabilityNote ||
        "",
      lastUpdated:
        data?.last_updated ||
        data?.updated_at ||
        data?.timestamp ||
        data?.checked_at ||
        "—"
    };
  }

  function asList(items) {
    const arr = Array.isArray(items) ? items : (items ? [items] : []);
    if (!arr.length) {
      return '<div style="opacity:.78;">No active reasons reported.</div>';
    }
    return '<ul style="margin:8px 0 0 18px; padding:0;">' +
      arr.map(item => `<li style="margin:0 0 6px 0;">${escapeHtml(safe(item))}</li>`).join("") +
      '</ul>';
  }

  function card(label, value) {
    return `
      <div style="
        border:1px solid rgba(100,170,255,.14);
        background:rgba(255,255,255,.03);
        border-radius:14px;
        padding:14px;
        margin-bottom:12px;">
        <div style="
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.06em;
          color:rgba(220,230,255,.62);
          margin-bottom:8px;">${escapeHtml(label)}</div>
        <div style="font-size:15px; line-height:1.5; color:#f4f7ff;">${value}</div>
      </div>
    `;
  }

  function pill(status) {
    const s = String(status || "").toLowerCase();
    let fg = "#ff8da1";
    let border = "rgba(255,106,136,.30)";
    let bg = "rgba(125,24,47,.18)";

    if (["ok", "healthy", "online", "active"].includes(s)) {
      fg = "#8ff7c1";
      border = "rgba(63,230,138,.28)";
      bg = "rgba(25,94,58,.20)";
    } else if (["warning", "warn", "monitor", "degraded", "pending"].includes(s)) {
      fg = "#ffd166";
      border = "rgba(255,209,102,.30)";
      bg = "rgba(124,95,16,.18)";
    }

    return `<span style="
      display:inline-flex;
      align-items:center;
      gap:6px;
      border-radius:999px;
      padding:5px 10px;
      font-size:12px;
      font-weight:600;
      color:${fg};
      border:1px solid ${border};
      background:${bg};">${escapeHtml(safe(status))}</span>`;
  }

  function renderLoading() {
    return card("Status", "Loading AI insights...");
  }

  function renderError(message) {
    return [
      card("Brain Status", pill("unavailable")),
      card("Message", escapeHtml(message || "AI Insights endpoint is unavailable."))
    ].join("");
  }

  function renderSuccess(view) {

    if (view?.version === "v2") {
      const signalsHtml = (view.signals || []).length
        ? view.signals.map(renderSignalCard).join("")
        : `<div class="ai-empty">No active signals.</div>`;

      const anomaliesHtml = (view.anomalies || []).length
        ? view.anomalies.map(renderAnomalyCard).join("")
        : `<div class="ai-empty">No anomalies detected.</div>`;

      const actionsHtml = (view.recommended_actions || []).length
        ? view.recommended_actions.map(renderActionCard).join("")
        : `<div class="ai-empty">No recommended actions.</div>`;

      const fin = view.financial_view || {};
      const sus = view.sustainability_view || {};
      const decision = view.optimization_decision || {};
      const alts = Array.isArray(decision.alternatives) ? decision.alternatives : [];

      return `
        <div class="ai-v2-wrap">
          <div class="ai-hero-status">
            <div class="ai-hero-top">
              <strong>AI Brain V2</strong>
              ${renderSeverityPill(view.overall_status)}
            </div>
            <div class="ai-hero-headline">${esc(view.summary_headline)}</div>
            <div class="ai-hero-text">${esc(view.summary_text)}</div>
          </div>

          ${renderV2Section("Executive Views", `
            <div class="ai-meta-grid">
              ${renderKV("Cost Risk (TRY)", fin.cost_risk_try != null ? fin.cost_risk_try : "-")}
              ${renderKV("Margin Pressure", fin.margin_pressure || "-")}
              ${renderKV("CO₂ Risk (kg)", sus.co2_risk_kg != null ? sus.co2_risk_kg : "-")}
              ${renderKV("Water Risk (m3)", sus.water_risk_m3 != null ? sus.water_risk_m3 : "-")}
              ${renderKV("ESG Flag", sus.esg_flag || "-")}
              ${renderKV("Confidence", view.confidence != null ? view.confidence : "-")}
            </div>
          `)}

          ${renderV2Section("Signals", `<div class="ai-card-stack">${signalsHtml}</div>`)}
          ${renderV2Section("Anomalies", `<div class="ai-card-stack">${anomaliesHtml}</div>`)}
          ${renderV2Section("Recommended Actions", `<div class="ai-card-stack">${actionsHtml}</div>`)}

          ${renderV2Section("Optimization Decision", `
            <div class="ai-card ai-card-decision">
              <div class="ai-card-body">
                <div class="ai-card-message">${esc(decision.decision_note || "No decision note available.")}</div>
                <div class="ai-table-wrap">
                  <table class="ai-table">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Score</th>
                        <th>Load %</th>
                        <th>Energy</th>
                        <th>Water</th>
                        <th>CO₂</th>
                        <th>Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${alts.map(renderAltRow).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          `)}
        </div>
      `;
    }

    const blocks = [
      card("Brain Status", pill(view.status)),
      card("Mode", escapeHtml(safe(view.mode))),
      card("Summary", escapeHtml(safe(view.summary))),
      card("Recommended Action", escapeHtml(safe(view.recommendation))),
      card("Reasons / Signals", asList(view.reasons))
    ];

    if (view.financeNote) {
      blocks.push(card("Financial View", escapeHtml(safe(view.financeNote))));
    }

    if (view.sustainabilityNote) {
      blocks.push(card("Sustainability View", escapeHtml(safe(view.sustainabilityNote))));
    }

    blocks.push(card("Last Updated", escapeHtml(safe(view.lastUpdated))));
    return blocks.join("");
  }

  function openModalWithHtml(title, subtitle, html) {
    const backdrop = byId("execModalBackdrop");
    const modalTitle = byId("execModalTitle");
    const modalSub = byId("execModalSub");
    const modalBody = byId("execModalBody");

    if (!backdrop || !modalTitle || !modalSub || !modalBody) {
      console.error("[AI Insights] executive modal elements not found");
      return false;
    }

    modalTitle.textContent = title;
    modalSub.textContent = subtitle;
    modalBody.innerHTML = html;
    backdrop.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    return true;
  }

  function updateModalBody(html) {
    const modalBody = byId("execModalBody");
    if (modalBody) modalBody.innerHTML = html;
  }

  async function fetchBrainData() {
    const facility = "ekoten";
    const strategy = "balanced";
    const V2_URL = `http://127.0.0.1:8010/api/brain/status/v2?facility=${encodeURIComponent(facility)}&strategy=${encodeURIComponent(strategy)}`;
    const V1_URL = API_URL;

    try {
      const resV2 = await fetch(V2_URL, { cache: "no-store" });
      if (!resV2.ok) {
        throw new Error(`HTTP ${resV2.status} on ${V2_URL}`);
      }
      return await resV2.json();
    } catch (errV2) {
      console.warn("[AI Insights] V2 failed, fallback to V1:", errV2?.message || errV2);
    }

    const resV1 = await fetch(V1_URL, { cache: "no-store" });
    if (!resV1.ok) {
      throw new Error(`HTTP ${resV1.status} on ${V1_URL}`);
    }
    return await resV1.json();
  }

  async function openAiInsights() {
    openModalWithHtml(
      "AI Insights",
      "Executive Summary / Brain Status",
      renderLoading()
    );

    try {
      const data = await fetchBrainData();
      const view = normalizeBrainPayload(data.brain || data);
      updateModalBody(renderSuccess(view));
    } catch (err) {
      updateModalBody(renderError(err?.message || "Unknown error"));
    }
  }

  function boot() {
    const btn = byId("openAiInsightsBtn");
    if (!btn) {
      console.warn("[AI Insights] button not found");
      return;
    }

    btn.addEventListener("click", openAiInsights);
    console.log("[AI Insights] bound to #openAiInsightsBtn");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
