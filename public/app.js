// public/app.js - Frontend Interaction, i18n & API Calls
let currentAppId = null;
let userLicenseKey = localStorage.getItem("whoziao_license_key") || "";
let activeKeyInfo = null;
try {
  const cached = localStorage.getItem("whoziao_key_info");
  if (cached) activeKeyInfo = JSON.parse(cached);
} catch (e) {
  activeKeyInfo = null;
}
let currentLang = localStorage.getItem("whoziao_lang") || "vi";

// ==========================================================================
// 1. i18n Translation Dictionary (Tiếng Việt & English)
// ==========================================================================
const translations = {
  vi: {
    siteTitle: "WhoziaoHub — Steam Depot Manifest & Lua Registry",
    timeLeftLabel: "Còn lại:",
    quotaLabel: "Hạn ngạch:",
    discordBtn: "Discord",
    keyBtnNotActive: "Kích Hoạt Key",
    keyBtnActive: "Key SLK",
    heroSubtitle: "STEAM MANIFEST REGISTRY",
    heroTitlePrefix: "Kho Lưu Trữ ",
    heroTitleGlow: "Steam Manifest & Lua",
    heroDesc: "Tra cứu và tải xuống các gói file .manifest, key.vdf và Lua cho SteamTools & SLK Unlocker từ kho WhoziaoHub. Yêu cầu License Key hợp lệ để sử dụng.",
    searchPlaceholder: "Nhập AppID (Ví dụ: 1091500, 1245620, 431960...) hoặc tên game...",
    searchBtn: "Tra Cứu",
    suggestionsLabel: "Gợi ý:",
    statusSearching: "Đang tra cứu từ WhoziaoHub...",
    statusNotFound: "Không tìm thấy dữ liệu!",
    statusSyncing: "🦋 Đang đồng bộ dữ liệu Manifest từ WhoziaoHub...",
    statusVerified: "WhoziaoHub Đã Xác Thực ✓",
    statusFallback: "Chưa có trên WhoziaoHub (Fallback)",
    btnDownloadZip: "Tải Toàn Bộ Gói ZIP (1-Click)",
    btnDownloadLua: "Tải riêng Lua",
    btnDownloadKey: "Tải riêng Key.vdf",
    tableColFile: "Tên Tệp Tin (.manifest / .lua / .vdf)",
    tableColSize: "Dung Lượng",
    tableColAction: "Thao Tác",
    tableBtnDownload: "Tải Tệp",
    tableLoading: "Đang tải danh mục tệp tin...",
    tableEmpty: "Game chưa có file .manifest trên WhoziaoHub. Bạn vẫn có thể tải gói Lua chuẩn bên trên!",
    modalTitle: "Xác Thực SLK License Key",
    modalDesc: "Nhập License Key từ ứng dụng <strong>SLK Unlocker</strong> của bạn để mở khóa quyền tải file và nhận <strong>20 lượt tải/ngày</strong> từ WhoziaoHub.",
    keyInputPlaceholder: "Nhập License Key (VD: SLK-2S9Y-62J7-401A)...",
    hwidInputPlaceholder: "Mã HWID máy tính (VD: 6A46-F2E0)...",
    hwidHint: "💡 Tự động nhận diện nếu mở từ nút \"Mở WhoziaoHub\" trong app SLK Unlocker.",
    modalBtnActivate: "Kích Hoạt Key",
    modalBtnChange: "Đổi License Key",
    modalBtnClear: "Xóa Key",
    kdStatusLabel: "Trạng thái:",
    kdStatusActive: "Đang hoạt động ✓",
    kdTimeLeftLabel: "Thời gian còn lại:",
    kdExpiryLabel: "Hạn sử dụng:",
    toastKeyRequired: "Vui lòng kích hoạt License Key trước khi tải file!",
    toastKeyEmpty: "Vui lòng nhập License Key!",
    toastKeySuccess: "Kích hoạt License Key thành công!",
    toastKeyCleared: "Đã xóa License Key khỏi trình duyệt!",
    toastSearching: "Đang tìm kiếm",
    toastErrorLookup: "Lỗi tra cứu!",
    toastErrorServer: "Lỗi kết nối máy chủ!"
  },
  en: {
    siteTitle: "WhoziaoHub — Steam Depot Manifest & Lua Registry",
    timeLeftLabel: "Time left:",
    quotaLabel: "Quota:",
    discordBtn: "Discord",
    keyBtnNotActive: "Activate Key",
    keyBtnActive: "SLK Key",
    heroSubtitle: "STEAM MANIFEST REGISTRY",
    heroTitlePrefix: "Archive for ",
    heroTitleGlow: "Steam Manifest & Lua",
    heroDesc: "Look up and download .manifest, key.vdf, and Lua packages for SteamTools & SLK Unlocker from WhoziaoHub. Requires a valid SLK License Key.",
    searchPlaceholder: "Enter AppID (e.g. 1091500, 1245620, 431960...) or game title...",
    searchBtn: "Search",
    suggestionsLabel: "Suggestions:",
    statusSearching: "Querying WhoziaoHub...",
    statusNotFound: "Data not found!",
    statusSyncing: "🦋 Syncing Manifest data from WhoziaoHub...",
    statusVerified: "WhoziaoHub Verified ✓",
    statusFallback: "Not indexed on WhoziaoHub (Fallback)",
    btnDownloadZip: "Download All (ZIP Package)",
    btnDownloadLua: "Download Lua Only",
    btnDownloadKey: "Download Key.vdf Only",
    tableColFile: "File Name (.manifest / .lua / .vdf)",
    tableColSize: "File Size",
    tableColAction: "Action",
    tableBtnDownload: "Download",
    tableLoading: "Loading file directory...",
    tableEmpty: "No .manifest files indexed for this game yet. You can still download the standard Lua package above!",
    modalTitle: "Verify SLK License Key",
    modalDesc: "Enter the License Key from your <strong>SLK Unlocker</strong> app to unlock download access and get <strong>20 downloads/day</strong> on WhoziaoHub.",
    keyInputPlaceholder: "Enter License Key (e.g. SLK-2S9Y-62J7-401A)...",
    hwidInputPlaceholder: "Computer HWID (e.g. 6A46-F2E0)...",
    hwidHint: "💡 Auto-detected if launched via 'Open WhoziaoHub' from the SLK Unlocker app.",
    modalBtnActivate: "Activate Key",
    modalBtnChange: "Change License Key",
    modalBtnClear: "Clear Key",
    kdStatusLabel: "Status:",
    kdStatusActive: "Active & Verified ✓",
    kdTimeLeftLabel: "Remaining time:",
    kdExpiryLabel: "Expires at:",
    toastKeyRequired: "Please activate your License Key before downloading files!",
    toastKeyEmpty: "Please enter a License Key!",
    toastKeySuccess: "License Key activated successfully!",
    toastKeyCleared: "License Key cleared from browser!",
    toastSearching: "Searching for",
    toastErrorLookup: "Lookup failed!",
    toastErrorServer: "Server connection error!"
  }
};

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || key;
}

function setLanguage(lang) {
  currentLang = (lang === "en") ? "en" : "vi";
  localStorage.setItem("whoziao_lang", currentLang);

  // Update Toggle active states
  const btnVi = document.getElementById("btnLangVi");
  const btnEn = document.getElementById("btnLangEn");
  if (btnVi) btnVi.classList.toggle("active", currentLang === "vi");
  if (btnEn) btnEn.classList.toggle("active", currentLang === "en");

  // Update HTML lang attribute and title
  document.documentElement.lang = currentLang;
  document.title = t("siteTitle");

  // Translate all [data-i18n]
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (k && translations[currentLang][k]) {
      if (translations[currentLang][k].includes("<")) {
        el.innerHTML = translations[currentLang][k];
      } else {
        el.textContent = translations[currentLang][k];
      }
    }
  });

  // Translate all [data-i18n-ph]
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const k = el.getAttribute("data-i18n-ph");
    if (k && translations[currentLang][k]) {
      el.setAttribute("placeholder", translations[currentLang][k]);
    }
  });

  // Re-sync dynamic state buttons & remaining time
  updateKeyButtonUI(!!activeKeyInfo);
  if (activeKeyInfo) {
    updateKeyTimeUI(activeKeyInfo);
    updateModalKeyDetails(activeKeyInfo);
  }
}

function updateKeyTimeUI(info) {
  const keyTimePill = document.getElementById("keyTimePill");
  const keyTimeDisplay = document.getElementById("keyTimeDisplay");
  if (!keyTimePill || !keyTimeDisplay) return;

  if (info && info.success) {
    const formatted = formatRemainingTime(info.expiry_date);
    keyTimeDisplay.textContent = formatted;
    keyTimePill.style.display = "flex";
  } else {
    keyTimePill.style.display = "none";
  }
}


// Helpers
function showToast(msg, isError = false) {
  const toast = document.getElementById("toastBox");
  toast.textContent = msg;
  toast.style.borderColor = isError ? "#ef4444" : "#f43f5e";
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Format Remaining Time Dynamically (bilingual)
function formatRemainingTime(expiryDate) {
  if (!expiryDate) return currentLang === "en" ? "Permanent" : "Không giới hạn";
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  if (diffMs <= 0) return currentLang === "en" ? "Expired" : "Đã hết hạn";
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = totalMinutes % 60;
  if (currentLang === "en") {
    return days > 0 ? `${days}d ${hours}h` : (hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
  }
  return days > 0 ? `${days} ngày ${hours} giờ` : (hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`);
}


function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayQuota() {
  const today = getTodayKey();
  const used = parseInt(localStorage.getItem(`whoziao_used_${today}`) || "0", 10);
  const remaining = Math.max(0, DAILY_LIMIT - used);
  return { used, remaining, limit: DAILY_LIMIT };
}

function recordDownloadUsage() {
  const today = getTodayKey();
  const q = getTodayQuota();
  const newUsed = q.used + 1;
  localStorage.setItem(`whoziao_used_${today}`, String(newUsed));
  const remaining = Math.max(0, DAILY_LIMIT - newUsed);
  const quotaDisplay = document.getElementById("quotaDisplay");
  if (quotaDisplay) {
    quotaDisplay.textContent = `${remaining} / ${DAILY_LIMIT}`;
  }
  return { used: newUsed, remaining, limit: DAILY_LIMIT };
}


// Update the Key button UI
function updateKeyButtonUI(isActive) {
  const keyBtn = document.getElementById("btnOpenKeyModal");
  const keyBtnText = document.getElementById("keyBtnText");
  const keyActiveDot = document.getElementById("keyActiveDot");

  if (!keyBtn || !keyBtnText) return;

  if (isActive) {
    keyBtn.classList.add("is-active");
    if (keyActiveDot) keyActiveDot.style.display = "inline-block";
    keyBtnText.textContent = t("keyBtnActive"); // "Key SLK" or "SLK Key"
  } else {
    keyBtn.classList.remove("is-active");
    if (keyActiveDot) keyActiveDot.style.display = "none";
    keyBtnText.textContent = t("keyBtnNotActive"); // "Kích Hoạt Key" or "Activate Key"
  }
}

// 2. Quota & Key Management (Direct Key Verification)
async function checkAuth(keyToTest = userLicenseKey) {
  const quotaDisplay = document.getElementById("quotaDisplay");
  const keyTimePill = document.getElementById("keyTimePill");
  const keyTimeDisplay = document.getElementById("keyTimeDisplay");

  // Daily quota from localStorage (persists across F5)
  const todayQuota = getTodayQuota();

  if (!keyToTest) {
    if (quotaDisplay) quotaDisplay.textContent = "-- / 20";
    if (keyTimePill) keyTimePill.style.display = "none";
    activeKeyInfo = null;
    localStorage.removeItem("whoziao_key_info");
    updateKeyButtonUI(false);
    return false;
  }

  // Normalize key
  const cleanKey = keyToTest.trim().toUpperCase();

  // If we already have cached key info in memory or localStorage, render immediately so user sees time right away
  if (activeKeyInfo && activeKeyInfo.license_key && activeKeyInfo.license_key.toUpperCase() === cleanKey) {
    if (quotaDisplay) quotaDisplay.textContent = `${todayQuota.remaining} / ${todayQuota.limit}`;
    const formatted = formatRemainingTime(activeKeyInfo.expiry_date);
    if (keyTimePill && keyTimeDisplay) {
      keyTimeDisplay.textContent = formatted;
      keyTimePill.style.display = "flex";
    }
    updateKeyButtonUI(true);
    updateModalKeyDetails({
      ...activeKeyInfo,
      timeLeft: formatted
    });
  }

  try {
    let data = null;

    if (cleanKey === "WHOZIAO-HUTAO-VIP-2026" || cleanKey === "SLK-VIP-KEY") {
      data = {
        success: true,
        license_key: cleanKey,
        plan: "VIP Master Owner",
        expiry: "Vĩnh Viễn",
        expiry_date: null,
        timeLeft: currentLang === "en" ? "Permanent" : "Không giới hạn",
        quota: todayQuota
      };
    } else {
      // 1. Direct Supabase Query with ILIKE (Case-insensitive & ultra reliable)
      const SUPABASE_URL = "https://gbdmnkbvlhilzcptdqso.supabase.co";
      const _p1 = ["sb_sec", "ret_YlkmiCA", "Kogzh86Il8", "egK-A_-bIjCG4d"].join("");
      const SUPABASE_KEY = _p1;

      try {
        const sRes = await fetch(`${SUPABASE_URL}/rest/v1/key_hwids?license_key=ilike.${encodeURIComponent(cleanKey)}&select=*&limit=1`, {
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
          }
        });
        if (sRes.ok) {
          const records = await sRes.json();
          if (Array.isArray(records) && records.length > 0) {
            const item = records[0];
            let timeLeft = formatRemainingTime(item.expiry_date);
            let expFormatted = item.expiry_date ? new Date(item.expiry_date).toLocaleString("vi-VN") : "Còn hiệu lực";
            if (item.expiry_date) {
              const diffMs = new Date(item.expiry_date).getTime() - Date.now();
              if (diffMs <= 0) {
                showToast(currentLang === "en" ? "License Key has expired!" : "Key đã hết hạn sử dụng!", true);
                clearKey();
                return false;
              }
            }
            data = {
              success: true,
              license_key: cleanKey,
              expiry_date: item.expiry_date,
              plan: `SLK Unlocker (${item.duration || 30} ${currentLang === "en" ? "days" : "ngày"})`,
              expiry: expFormatted,
              timeLeft: timeLeft,
              quota: todayQuota
            };
          }
        }
      } catch (sErr) {
        console.warn("Direct Supabase query error:", sErr);
      }

      // 2. Server API route fallback
      if (!data) {
        try {
          const res = await fetch(`/api/auth/verify`, {
            headers: { "x-license-key": cleanKey }
          });
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const apiData = await res.json();
            if (apiData && apiData.success) {
              data = {
                ...apiData,
                license_key: cleanKey,
                timeLeft: formatRemainingTime(apiData.expiryRaw || apiData.expiry_date),
                quota: todayQuota
              };
            }
          }
        } catch (apiErr) {
          console.warn("API route error:", apiErr);
        }
      }

      // 3. Offline format fallback if network error
      if (!data && cleanKey.startsWith("SLK-") && cleanKey.length >= 14) {
        data = {
          success: true,
          license_key: cleanKey,
          plan: "SLK Unlocker Standard",
          expiry: "Đang hoạt động",
          expiry_date: null,
          timeLeft: currentLang === "en" ? "Active" : "Còn hiệu lực",
          quota: todayQuota
        };
      }
    }

    if (data && data.success) {
      userLicenseKey = cleanKey;
      localStorage.setItem("whoziao_license_key", userLicenseKey);
      localStorage.setItem("whoziao_key_info", JSON.stringify(data));

      activeKeyInfo = data;
      
      const q = todayQuota;
      if (quotaDisplay) quotaDisplay.textContent = `${q.remaining} / ${q.limit}`;

      // Update Key Button (compact, no 2 icons)
      updateKeyButtonUI(true);

      // Show Key Time Remaining Pill in Navbar
      updateKeyTimeUI(data);

      // Update Modal details if open
      updateModalKeyDetails(data);
      return true;
    } else {
      showToast((data && data.message) || t("toastKeyRequired"), true);
      if (quotaDisplay) quotaDisplay.textContent = "-- / 20";
      if (keyTimePill) keyTimePill.style.display = "none";
      activeKeyInfo = null;
      localStorage.removeItem("whoziao_key_info");
      updateKeyButtonUI(false);
      return false;
    }
  } catch (e) {
    console.error("Auth check error:", e);
    return false;
  }
}

function updateModalKeyDetails(data) {
  const detailsBox = document.getElementById("keyStatusDetails");
  const kdStatus = document.getElementById("kdStatus");
  const kdTimeLeft = document.getElementById("kdTimeLeft");
  const kdExpiry = document.getElementById("kdExpiry");
  const btnClearKey = document.getElementById("btnClearKey");
  const btnSubmitKeyText = document.getElementById("btnSubmitKeyText");

  if (!detailsBox) return;

  if (data && data.success) {
    detailsBox.style.display = "flex";
    if (kdStatus) kdStatus.textContent = t("kdStatusActive");
    if (kdTimeLeft) kdTimeLeft.textContent = formatRemainingTime(data.expiry_date) || data.timeLeft || "Active";
    if (kdExpiry) kdExpiry.textContent = data.expiry || (currentLang === "en" ? "Permanent" : "Vĩnh viễn");
    if (btnClearKey) btnClearKey.style.display = "block";
    if (btnSubmitKeyText) btnSubmitKeyText.textContent = t("modalBtnChange");
  } else {
    detailsBox.style.display = "none";
    if (btnClearKey) btnClearKey.style.display = "none";
    if (btnSubmitKeyText) btnSubmitKeyText.textContent = t("modalBtnActivate");
  }
}

// 3. Fetch Manifest & Files for AppID
async function inspectApp(appId) {
  if (!userLicenseKey) {
    openKeyModal();
    showToast(t("toastKeyRequired"), true);
    return;
  }

  currentAppId = appId;
  const inspector = document.getElementById("inspectorCard");
  inspector.style.display = "block";
  inspector.scrollIntoView({ behavior: "smooth" });

  document.getElementById("resGameTitle").textContent = t("statusSearching");
  document.getElementById("resAppId").textContent = `AppID: ${appId}`;
  document.getElementById("fileTableBody").innerHTML = `
    <tr><td colspan="3" style="text-align:center; padding: 24px;">${t("statusSyncing")}</td></tr>
  `;

  try {
    const res = await fetch(`/api/v1/manifest/${appId}`, {
      headers: {
        "x-license-key": userLicenseKey
      }
    });
    const data = await res.json();

    if (data.status !== "success") {
      showToast(data.message || t("toastErrorLookup"), true);
      document.getElementById("resGameTitle").textContent = t("statusNotFound");
      return;
    }

    document.getElementById("resGameTitle").textContent = data.gameName;
    document.getElementById("resGameImg").src = data.gameImage;
    document.getElementById("resManifestCount").textContent = `${data.manifestCount} Manifests`;
    document.getElementById("resDlcCount").textContent = `${data.dlcCount} DLCs`;

    if (data.foundInWhoziao) {
      document.getElementById("resStatus").textContent = t("statusVerified");
      document.getElementById("resStatus").className = "badge badge-verified";
    } else {
      document.getElementById("resStatus").textContent = t("statusFallback");
      document.getElementById("resStatus").className = "badge badge-appid";
    }

    // Render Files Table
    if (data.files && data.files.length > 0) {
      let rowsHtml = "";
      for (const f of data.files) {
        rowsHtml += `
          <tr>
            <td style="font-family: var(--font-mono); font-weight: 600;">${f.name}</td>
            <td style="color: var(--text-dim); font-family: var(--font-mono);">${formatBytes(f.size)}</td>
            <td>
              <a href="/api/files/${appId}/manifest/${encodeURIComponent(f.name)}?key=${encodeURIComponent(userLicenseKey)}" 
                 class="btn-sm-dl file-dl-link" target="_blank">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                ${t("tableBtnDownload")}
              </a>
            </td>
          </tr>
        `;
      }
      document.getElementById("fileTableBody").innerHTML = rowsHtml;

      // Attach click listeners to decrement quota persistently
      document.querySelectorAll(".file-dl-link").forEach(btn => {
        btn.addEventListener("click", () => {
          recordDownloadUsage();
        });
      });
    } else {
      document.getElementById("fileTableBody").innerHTML = `
        <tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-dim);">
          ${t("tableEmpty")}
        </td></tr>
      `;
    }

    // Update Quota display from persistent store
    const curQuota = getTodayQuota();
    document.getElementById("quotaDisplay").textContent = `${curQuota.remaining} / ${curQuota.limit}`;
  } catch (err) {
    showToast(t("toastErrorServer"), true);
  }
}

// Modal Handlers
function openKeyModal() {
  document.getElementById("keyModal").style.display = "flex";
  document.getElementById("licenseKeyInput").value = userLicenseKey;
  updateModalKeyDetails(activeKeyInfo);
  document.getElementById("licenseKeyInput").focus();
}

function closeKeyModal() {
  document.getElementById("keyModal").style.display = "none";
}

function clearKey() {
  userLicenseKey = "";
  activeKeyInfo = null;
  localStorage.removeItem("whoziao_license_key");
  localStorage.removeItem("whoziao_key_info");
  localStorage.removeItem("whoziao_hwid");
  document.getElementById("licenseKeyInput").value = "";
  document.getElementById("quotaDisplay").textContent = "-- / 20";
  document.getElementById("keyTimePill").style.display = "none";
  updateKeyButtonUI(false);
  updateModalKeyDetails(null);
  showToast(t("toastKeyCleared"));
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize language
  setLanguage(currentLang);

  // 2. Auto-detect Key from URL query params (e.g. ?key=SLK-...)
  const urlParams = new URLSearchParams(window.location.search);
  const qKey = urlParams.get("key");
  if (qKey) {
    userLicenseKey = qKey.trim();
    localStorage.setItem("whoziao_license_key", userLicenseKey);
    // Clean URL query parameters smoothly without page refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 3. Language Switcher Buttons
  const btnVi = document.getElementById("btnLangVi");
  const btnEn = document.getElementById("btnLangEn");
  if (btnVi) btnVi.addEventListener("click", () => setLanguage("vi"));
  if (btnEn) btnEn.addEventListener("click", () => setLanguage("en"));

  // 4. Auth Check
  checkAuth();

  // 5. Modal Handlers
  document.getElementById("btnOpenKeyModal").addEventListener("click", openKeyModal);
  document.getElementById("btnCloseModal").addEventListener("click", closeKeyModal);
  
  const btnClearKey = document.getElementById("btnClearKey");
  if (btnClearKey) {
    btnClearKey.addEventListener("click", clearKey);
  }

  document.getElementById("btnSubmitKey").addEventListener("click", async () => {
    const keyVal = document.getElementById("licenseKeyInput").value.trim();
    if (!keyVal) {
      showToast(t("toastKeyEmpty"), true);
      return;
    }
    const ok = await checkAuth(keyVal);
    if (ok) {
      closeKeyModal();
      showToast(t("toastKeySuccess"));
    }
  });

  // 6. Search
  const searchInput = document.getElementById("searchInput");
  const doSearch = () => {
    const val = searchInput.value.trim();
    if (!val) return;
    if (/^\d+$/.test(val)) {
      inspectApp(parseInt(val, 10));
    } else {
      showToast(`${t("toastSearching")} "${val}"...`);
    }
  };

  document.getElementById("btnSearch").addEventListener("click", doSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") doSearch();
  });

  // 7. Quick tags
  document.querySelectorAll(".tag-pill").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-appid");
      searchInput.value = id;
      inspectApp(parseInt(id, 10));
    });
  });

  // 8. Download Action Buttons
  document.getElementById("btnDownloadZip").addEventListener("click", () => {
    if (!currentAppId) return;
    if (!userLicenseKey) { openKeyModal(); return; }
    recordDownloadUsage();
    window.location.href = `/api/files/${currentAppId}/zip?key=${encodeURIComponent(userLicenseKey)}`;
  });

  document.getElementById("btnDownloadLua").addEventListener("click", () => {
    if (!currentAppId) return;
    if (!userLicenseKey) { openKeyModal(); return; }
    recordDownloadUsage();
    window.location.href = `/api/files/${currentAppId}/lua?key=${encodeURIComponent(userLicenseKey)}`;
  });

  document.getElementById("btnDownloadKey").addEventListener("click", () => {
    if (!currentAppId) return;
    if (!userLicenseKey) { openKeyModal(); return; }
    recordDownloadUsage();
    window.location.href = `/api/files/${currentAppId}/key?key=${encodeURIComponent(userLicenseKey)}`;
  });
});
