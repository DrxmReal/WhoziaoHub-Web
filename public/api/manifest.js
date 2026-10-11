// api/manifest.js - Fetch metadata for AppID from WhoziaoHub, Steam & ManiLuaHub
const { validateLicenseKey, getQuota } = require('./auth');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-license-key, x-hwid');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-license-key'] || req.query.key;
  const hwid = req.headers['x-hwid'] || req.query.hwid;

  if (!key) {
    return res.status(401).json({ status: "error", message: "Yêu cầu License Key để tra cứu metadata!" });
  }

  const auth = await validateLicenseKey(key, hwid);
  if (!auth.valid) {
    return res.status(403).json({ status: "error", message: auth.message });
  }

  const appId = req.query.appId || req.url.split('/').pop().split('?')[0];
  if (!appId || !/^\d+$/.test(appId)) {
    return res.status(400).json({ status: "error", message: "AppID không hợp lệ!" });
  }

  try {
    // 1. Fetch game details with robust multi-tier fallback
    let gameName = `App_${appId}`;
    let gameImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
    let dlcs = [];

    // Fallback 1: ManiLuaHub API (Fast and has verified manifest names)
    try {
      const maniResp = await fetch(`https://maniluahub.com/api/v1/manifest/${appId}`, {
        signal: AbortSignal.timeout(3500)
      });
      if (maniResp.ok) {
        const maniData = await maniResp.json();
        if (maniData && maniData.gameName && !maniData.gameName.startsWith('App_')) {
          gameName = maniData.gameName;
          if (maniData.gameImage) gameImage = maniData.gameImage;
        }
      }
    } catch (e) {
      // ManiLuaHub fallback failed or timed out
    }

    // Fallback 2: SteamSpy API (Reliable public API)
    if (gameName === `App_${appId}`) {
      try {
        const spyResp = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appId}`, {
          signal: AbortSignal.timeout(3500)
        });
        if (spyResp.ok) {
          const spyData = await spyResp.json();
          if (spyData && spyData.name && spyData.name.trim().length > 0) {
            gameName = spyData.name.trim();
          }
        }
      } catch (e) {
        // SteamSpy fallback failed
      }
    }

    // Fallback 3: Steam Store API (if accessible)
    if (gameName === `App_${appId}`) {
      try {
        const steamResp = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`, {
          signal: AbortSignal.timeout(3000),
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (steamResp.ok) {
          const steamData = await steamResp.json();
          if (steamData[appId] && steamData[appId].success && steamData[appId].data) {
            gameName = steamData[appId].data.name || gameName;
            dlcs = steamData[appId].data.dlc || [];
          }
        }
      } catch (e) {
        // Steam store can be blocked by hosts file or network
      }
    }

    // 2. Fetch branch file listing from WhoziaoHub GitHub repo
    const branchUrl = `https://api.github.com/repos/DrxmReal/WhoziaoHub/contents/?ref=${appId}`;
    const ghResp = await fetch(branchUrl, {
      headers: {
        "User-Agent": "WhoziaoHub-Web",
        "Authorization": `Bearer ${GITHUB_TOKEN}`
      }
    });

    let files = [];
    let manifests = [];
    let hasLua = false;
    let hasKeyVdf = false;
    let foundInWhoziao = false;

    if (ghResp.ok) {
      foundInWhoziao = true;
      const ghData = await ghResp.json();
      if (Array.isArray(ghData)) {
        files = ghData.map(f => ({
          name: f.name,
          size: f.size,
          download_url: f.download_url
        }));

        manifests = files.filter(f => f.name.endsWith('.manifest'));
        hasLua = files.some(f => f.name.endsWith('.lua'));
        hasKeyVdf = files.some(f => f.name.toLowerCase() === 'key.vdf');

        // Fallback 4: Extract Game Name from .lua header comments if needed
        if (gameName === `App_${appId}` && hasLua) {
          const luaFile = files.find(f => f.name.endsWith('.lua'));
          if (luaFile && luaFile.download_url) {
            try {
              const lResp = await fetch(luaFile.download_url, { signal: AbortSignal.timeout(3000) });
              if (lResp.ok) {
                const text = await lResp.text();
                const lines = text.split('\n').map(l => l.trim());
                for (const line of lines.slice(0, 6)) {
                  if (line.startsWith('--') && !line.includes('Created') && !line.includes('Website') && !line.includes('Depots') && !line.includes('DLCs') && !line.includes('Lua and Manifest')) {
                    const candidate = line.replace(/^--\s*/, '').trim();
                    if (candidate.length > 1 && !candidate.startsWith('MAIN')) {
                      gameName = candidate;
                      break;
                    }
                  }
                }
              }
            } catch (e) {
              // Ignore lua header extraction error
            }
          }
        }
      }
    }

    const quota = getQuota(key);

    return res.status(200).json({
      status: "success",
      appId: appId,
      gameName: gameName,
      gameImage: gameImage,
      foundInWhoziao: foundInWhoziao,
      manifestCount: manifests.length,
      manifests: manifests,
      hasLua: hasLua,
      hasKeyVdf: hasKeyVdf,
      dlcCount: dlcs.length,
      dlcs: dlcs,
      files: files,
      quota: quota,
      endpoints: {
        rawLua: `/api/files/${appId}/lua`,
        rawKeyVdf: `/api/files/${appId}/key`,
        zipPackage: `/api/files/${appId}/zip`,
      }
    });
  } catch (err) {
    console.error("Manifest lookup error:", err);
    return res.status(500).json({ status: "error", message: `Lỗi xử lý: ${err.message}` });
  }
};
