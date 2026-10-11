// api/zip.js - Package all manifests, Lua & key.vdf into a single zip download
const JSZip = require('jszip');
const { validateLicenseKey, getQuota, consumeQuota } = require('./auth');
const { sanitizeLua } = require('./file');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-license-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-license-key'] || req.query.key;
  const hwid = req.headers['x-hwid'] || req.query.hwid;

  if (!key) {
    return res.status(401).send("Yêu cầu License Key!");
  }

  const auth = await validateLicenseKey(key, hwid);
  if (!auth.valid) {
    return res.status(403).send(auth.message);
  }

  const appId = req.query.appId;
  if (!appId || !/^\d+$/.test(appId)) {
    return res.status(400).send("Thiếu AppID!");
  }

  // 1. Quota check
  if (!consumeQuota(key)) {
    return res.status(429).send("Đã hết giới hạn 20 lượt tải trong ngày của bạn! Vui lòng quay lại vào ngày mai.");
  }

  try {
    const zip = new JSZip();

    // 2. Fetch files list from WhoziaoHub
    const branchUrl = `https://api.github.com/repos/DrxmReal/WhoziaoHub/contents/?ref=${appId}`;
    const ghResp = await fetch(branchUrl, {
      headers: {
        "User-Agent": "WhoziaoHub-Web",
        "Authorization": `Bearer ${GITHUB_TOKEN}`
      }
    });

    let filesAdded = 0;

    if (ghResp.ok) {
      const files = await ghResp.json();
      if (Array.isArray(files)) {
        for (const file of files) {
          if (!file.download_url) continue;
          try {
            const fResp = await fetch(file.download_url, {
              headers: { "Authorization": `Bearer ${GITHUB_TOKEN}` }
            });
            if (fResp.ok) {
              if (file.name.endsWith('.lua')) {
                let text = await fResp.text();
                text = sanitizeLua(text);
                zip.file(file.name, text);
              } else {
                const buf = await fResp.arrayBuffer();
                zip.file(file.name, buf);
              }
              filesAdded++;
            }
          } catch (e) {
            console.warn(`Failed to package ${file.name}:`, e);
          }
        }
      }
    }

    // 3. Fallback: If WhoziaoHub has no files, try to package from ManiLuaHub Lua & Key
    if (filesAdded === 0) {
      try {
        const mlResp = await fetch(`https://maniluahub.com/api/files/${appId}/zip`);
        if (mlResp.ok) {
          const mlBuf = Buffer.from(await mlResp.arrayBuffer());
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${appId}_WhoziaoHub_Package.zip"`);
          return res.status(200).send(mlBuf);
        }
      } catch (e) {
        console.warn("ManiLuaHub zip fallback error:", e);
      }
    }

    if (filesAdded === 0) {
      return res.status(404).send(`Không tìm thấy file nào của AppID ${appId} trên WhoziaoHub!`);
    }

    // Add Hu Tao signature README
    zip.file("README_WHOZIAOHUB.txt", 
      `============================================================\n` +
      `   WHOZIAOHUB — THE ULTIMATE STEAM MANIFEST ARCHIVE\n` +
      `   Make by Dr4m • Theme: Hu Tao (Genshin Impact)\n` +
      `   AppID: ${appId}\n` +
      `============================================================\n\n` +
      `Hướng dẫn cài đặt:\n` +
      `1. Copy toàn bộ file .manifest vào: Steam\\depotcache\\\n` +
      `2. Copy file .lua vào: Steam\\config\\stplug-in\\ (hoặc load qua SteamTools / SLK)\n` +
      `3. Merge key.vdf vào: Steam\\config\\key.vdf\n` +
      `4. Khởi động lại Steam và tận hưởng!\n\n` +
      `Chúc bạn chơi game vui vẻ cùng WhoziaoHub!\n`
    );

    const zipContent = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${appId}_WhoziaoHub_Package.zip"`);
    return res.status(200).send(zipContent);
  } catch (err) {
    console.error("Zip packaging error:", err);
    return res.status(500).send(`Lỗi tạo gói zip: ${err.message}`);
  }
};
