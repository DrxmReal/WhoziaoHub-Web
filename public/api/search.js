// api/search.js - Search featured games and AppIDs
const { validateLicenseKey } = require('./auth');

const FEATURED_GAMES = [
  { id: 1091500, title: "Cyberpunk 2077", tags: ["RPG", "Open World", "Sci-Fi"] },
  { id: 1245620, title: "ELDEN RING", tags: ["Souls-like", "Dark Fantasy", "RPG"] },
  { id: 2050650, title: "Resident Evil 4", tags: ["Horror", "Action", "Zombies"] },
  { id: 431960, title: "Wallpaper Engine", tags: ["Utility", "Software", "Animation"] },
  { id: 730, title: "Counter-Strike 2", tags: ["FPS", "Multiplayer", "Competitive"] },
  { id: 570, title: "Dota 2", tags: ["MOBA", "Strategy", "Free to Play"] },
  { id: 1172470, title: "Apex Legends", tags: ["Battle Royale", "FPS", "Hero Shooter"] },
  { id: 892970, title: "Valheim", tags: ["Survival", "Co-op", "Open World"] },
  { id: 1086940, title: "Baldur's Gate 3", tags: ["Story Rich", "Turn-Based", "RPG"] },
  { id: 1938090, title: "Call of Duty", tags: ["Action", "FPS", "Shooter"] }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-license-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-license-key'] || req.query.key;
  if (!key) {
    return res.status(401).json({ status: "error", message: "Yêu cầu License Key!" });
  }

  const auth = await validateLicenseKey(key);
  if (!auth.valid) {
    return res.status(403).json({ status: "error", message: auth.message });
  }

  const q = (req.query.q || '').trim().toLowerCase();

  // If query is pure number, direct search on Steam
  if (/^\d+$/.test(q)) {
    const appId = parseInt(q, 10);
    try {
      const sResp = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`);
      if (sResp.ok) {
        const sData = await sResp.json();
        if (sData[appId] && sData[appId].success) {
          return res.status(200).json({
            results: [{
              id: appId,
              title: sData[appId].data.name || `App ${appId}`,
              image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
              tags: ["AppID Direct Match"]
            }]
          });
        }
      }
    } catch (e) {
      console.warn("Direct AppID search error:", e);
    }
  }

  // Filter featured games
  let results = FEATURED_GAMES;
  if (q) {
    results = FEATURED_GAMES.filter(g => 
      g.title.toLowerCase().includes(q) || g.id.toString().includes(q)
    );
  }

  const enriched = results.map(g => ({
    ...g,
    image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.id}/header.jpg`
  }));

  return res.status(200).json({ results: enriched });
};
