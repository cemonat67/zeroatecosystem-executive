(function () {
  function $(sel) {
    return document.querySelector(sel);
  }

  function findFileInput() {
    return document.querySelector('input[type="file"]');
  }

  function findPrepareButton() {
    return Array.from(document.querySelectorAll('button')).find(
      btn => /prepare upload/i.test(btn.textContent || "")
    );
  }

  function ensureStatusBox() {
    let box = document.getElementById("uploadStatusBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "uploadStatusBox";
      box.style.marginTop = "12px";
      box.style.fontSize = "14px";
      box.style.color = "#cfd8ea";
      const wrap =
        findPrepareButton()?.parentElement ||
        document.querySelector(".card") ||
        document.body;
      wrap.appendChild(box);
    }
    return box;
  }

  function setStatus(msg, isError) {
    const box = ensureStatusBox();
    box.textContent = msg;
    box.style.color = isError ? "#ff8a8a" : "#cfd8ea";
    console.log("[upload-binding]", msg);
  }

  async function handlePrepareUpload() {
    const input = findFileInput();
    if (!input) {
      setStatus("File input bulunamadı.", true);
      return;
    }

    if (!input.files || !input.files.length) {
      setStatus("Önce bir CSV dosyası seç.", true);
      return;
    }

    const file = input.files[0];
    setStatus(`Seçilen dosya hazır: ${file.name}`);

    // Endpoint henüz yoksa graceful davran
    if (!window.ZeroIntakeConfig || !window.ZeroIntakeConfig.uploadUrl) {
      setStatus("Upload config bulunamadı.", true);
      return;
    }

    const url = window.ZeroIntakeConfig.uploadUrl();

    // Şimdilik gerçek POST denemesi
    // Eğer backend endpoint hazır değilse hata yakalayıp anlaşılır mesaj veriyoruz.
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "csv_upload_ui");
    formData.append("facility", "Ekoten");

    try {
      setStatus(`Upload gönderiliyor: ${file.name}`);

      const res = await fetch(url, {
        method: "POST",
        body: formData
      });

      const text = await res.text();

      if (!res.ok) {
        setStatus(`Upload endpoint henüz hazır değil veya hata döndü (${res.status}).`, true);
        console.warn("[upload-binding] non-200 response:", text);
        return;
      }

      setStatus(`Upload başarılı: ${file.name}`);

      if (typeof window.loadOpsFromApi === "function") {
        try {
          await window.loadOpsFromApi();
          setStatus(`Upload başarılı ve dashboard yenilendi: ${file.name}`);
        } catch (e) {
          console.warn("[upload-binding] loadOpsFromApi rerun failed", e);
        }
      }
    } catch (err) {
      setStatus("Upload binding aktif, ama backend upload endpoint henüz bağlı değil.", true);
      console.warn("[upload-binding] fetch failed", err);
    }
  }

  function init() {
    const btn = findPrepareButton();
    if (!btn) {
      console.warn("[upload-binding] Prepare Upload button not found");
      return;
    }

    btn.addEventListener("click", handlePrepareUpload);
    console.log("[upload-binding] active");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
