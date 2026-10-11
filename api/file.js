// api/file.js - Stream raw file content with quota decrement
const { validateLicenseKey, getQuota, consumeQuota } = require('./auth');

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

  const { appId, type, file } = req.query;
  if (!appId) return res.status(400).send("Thiếu AppID!");

  // Enforce 20 downloads/day limit
  if (!consumeQuota(key)) {
    return res.status(429).send("Đã hết giới hạn 20 lượt tải trong ngày của bạn! Vui lòng quay lại vào ngày mai.");
  }

  try {
    let targetFileName = file;
    if (type === 'lua') targetFileName = `${appId}.lua`;
    if (type === 'key') targetFileName = 'key.vdf';

    const rawUrl = `https://raw.githubusercontent.com/DrxmReal/WhoziaoHub/${appId}/${targetFileName}`;
    const fileResp = await fetch(rawUrl, {
      headers: {
        "User-Agent": "WhoziaoHub-Web",
        "Authorization": `Bearer ${GITHUB_TOKEN}`
      }
    });

    if (!fileResp.ok) {
      // Fallback: If not found in DrxmReal/WhoziaoHub, try ManiLuaHub for lua/key
      if (type === 'lua') {
        const mlResp = await fetch(`https://maniluahub.com/api/files/${appId}/lua`);
        if (mlResp.ok) {
          const text = await mlResp.text();
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${appId}.lua"`);
          return res.status(200).send(text);
        }
      }
      return res.status(404).send(`Không tìm thấy file ${targetFileName} cho AppID ${appId} trên WhoziaoHub!`);
    }

    const buffer = Buffer.from(await fileResp.arrayBuffer());

    if (targetFileName.endsWith('.lua') || targetFileName.endsWith('.vdf') || targetFileName.endsWith('.txt')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${targetFileName}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("Download file error:", err);
    return res.status(500).send(`Lỗi tải file: ${err.message}`);
  }
};
