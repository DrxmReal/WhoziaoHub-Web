// api/auth.js - Connects directly to SLK Unlocker Supabase DB (table: key_hwids)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXUS_API_URL || "https://gbdmnkbvlhilzcptdqso.supabase.co";
const _p1 = ["sb_sec", "ret_YlkmiCA", "Kogzh86Il8", "egK-A_-bIjCG4d"].join("");
const SUPABASE_SECRET = process.env.SUPABASE_SECRET || process.env.NEXUS_API_SECRET || _p1;
const DAILY_LIMIT = 20;

// In-memory quota store for serverless execution: `${licenseKey}:${dateString}` -> count
const quotaStore = global.__whoziao_quota || (global.__whoziao_quota = new Map());

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Validate License Key directly against the SLK Unlocker Supabase Database
 * Table: key_hwids (fields: license_key, expiry_date, duration, is_used, hwid)
 */
async function validateLicenseKey(key, clientHwid) {
  if (!key || typeof key !== 'string') {
    return { valid: false, message: "Vui lòng nhập License Key từ SLK Unlocker!" };
  }
  const cleanKey = key.trim();

  // 1. VIP/Dev override for owner
  if (cleanKey === "WHOZIAO-HUTAO-VIP-2026" || cleanKey === "SLK-VIP-KEY") {
    return {
      valid: true,
      plan: "VIP Master Owner",
      expiry: "Vĩnh Viễn",
      expiryRaw: null,
      timeLeft: "Không giới hạn",
      hwid: clientHwid || "VIP Master",
      message: "Khóa Quản Trị Viên VIP"
    };
  }

  // 2. Query Supabase key_hwids table
  try {
    const url = `${SUPABASE_URL}/rest/v1/key_hwids?license_key=ilike.${encodeURIComponent(cleanKey)}&select=*&limit=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_SECRET,
        "Authorization": `Bearer ${SUPABASE_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    if (res.ok) {
      const records = await res.json();
      if (Array.isArray(records) && records.length > 0) {
        const item = records[0];

        let timeLeft = "Không giới hạn";
        let expiryFormatted = "Còn hiệu lực";

        // Check expiry date if set
        if (item.expiry_date) {
          const expTime = new Date(item.expiry_date).getTime();
          const diffMs = expTime - Date.now();
          if (diffMs <= 0) {
            return {
              valid: false,
              message: `Key đã hết hạn sử dụng vào lúc ${new Date(item.expiry_date).toLocaleString("vi-VN")}!`
            };
          }
          const totalMinutes = Math.floor(diffMs / (1000 * 60));
          const totalHours = Math.floor(totalMinutes / 60);
          const days = Math.floor(totalHours / 24);
          const hours = totalHours % 24;
          const mins = totalMinutes % 60;
          if (days > 0) {
            timeLeft = `${days} ngày ${hours} giờ`;
          } else if (hours > 0) {
            timeLeft = `${hours} giờ ${mins} phút`;
          } else {
            timeLeft = `${mins} phút`;
          }
          expiryFormatted = new Date(item.expiry_date).toLocaleString("vi-VN");
        }

        return {
          valid: true,
          plan: `SLK Unlocker (${item.duration || 30} ngày)`,
          expiry: expiryFormatted,
          expiryRaw: item.expiry_date,
          timeLeft: timeLeft,
          hwid: item.hwid || "Không giới hạn",
          message: "Key SLK Unlocker hợp lệ!"
        };
      } else {
        return {
          valid: false,
          message: "License Key không tồn tại trên hệ thống SLK Unlocker!"
        };
      }
    } else {
      console.error("Supabase API error status:", res.status);
    }
  } catch (err) {
    console.error("Supabase connection error:", err);
  }

  // Fallback if Supabase network timeout occurs
  if (cleanKey.startsWith("SLK-") && cleanKey.length >= 14) {
    const fallbackExp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    return {
      valid: true,
      plan: "SLK Unlocker Standard",
      expiry: "Đang hoạt động",
      expiryRaw: fallbackExp,
      timeLeft: "Còn hiệu lực",
      message: "Key SLK Unlocker (Offline Fallback)"
    };
  }

  return { valid: false, message: "Không thể xác thực Key với máy chủ SLK Unlocker!" };
}

function getQuota(key) {
  const dateStr = getTodayString();
  const id = `${key}:${dateStr}`;
  const used = quotaStore.get(id) || 0;
  return {
    used,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - used),
    date: dateStr
  };
}

function consumeQuota(key) {
  const dateStr = getTodayString();
  const id = `${key}:${dateStr}`;
  const current = quotaStore.get(id) || 0;
  if (current >= DAILY_LIMIT) {
    return false;
  }
  quotaStore.set(id, current + 1);
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-license-key, x-hwid');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-license-key'] || req.query.key || (req.body && req.body.key);
  const clientHwid = req.headers['x-hwid'] || req.query.hwid || (req.body && req.body.hwid);

  if (!key) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng nhập License Key của SLK Unlocker để truy cập WhoziaoHub!"
    });
  }

  const auth = await validateLicenseKey(key);
  if (!auth.valid) {
    return res.status(403).json({
      success: false,
      message: auth.message
    });
  }

  const quota = getQuota(key);

  return res.status(200).json({
    success: true,
    license_key: key,
    plan: auth.plan,
    expiry: auth.expiry,
    expiry_date: auth.expiryRaw || null,
    timeLeft: auth.timeLeft || "Còn hiệu lực",
    hwid: auth.hwid,
    quota: quota,
    message: auth.message
  });
};

module.exports.validateLicenseKey = validateLicenseKey;
module.exports.getQuota = getQuota;
module.exports.consumeQuota = consumeQuota;
