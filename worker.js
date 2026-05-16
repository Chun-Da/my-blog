const INIT_SQL = 'CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id TEXT NOT NULL, author TEXT NOT NULL, content TEXT NOT NULL, location TEXT, created_at TEXT NOT NULL)';
const ADD_LOCATION_COL = 'ALTER TABLE comments ADD COLUMN location TEXT';

const CN_PROVINCES = {
  'Beijing': '北京', 'Shanghai': '上海', 'Tianjin': '天津', 'Chongqing': '重庆',
  'Guangdong': '广东', 'Zhejiang': '浙江', 'Jiangsu': '江苏', 'Shandong': '山东',
  'Sichuan': '四川', 'Hubei': '湖北', 'Hunan': '湖南', 'Henan': '河南',
  'Hebei': '河北', 'Liaoning': '辽宁', 'Shaanxi': '陕西', 'Shanxi': '山西',
  'Jilin': '吉林', 'Heilongjiang': '黑龙江', 'Anhui': '安徽', 'Fujian': '福建',
  'Jiangxi': '江西', 'Yunnan': '云南', 'Guizhou': '贵州', 'Hainan': '海南',
  'Gansu': '甘肃', 'Qinghai': '青海', 'Xinjiang': '新疆', 'Xizang': '西藏',
  'Tibet': '西藏', 'Inner Mongolia': '内蒙古', 'Guangxi': '广西', 'Ningxia': '宁夏',
  'Hong Kong': '香港', 'Macau': '澳门', 'Taiwan': '台湾',
};

const COUNTRIES = {
  'US': '美国', 'JP': '日本', 'KR': '韩国', 'GB': '英国', 'DE': '德国',
  'FR': '法国', 'CA': '加拿大', 'AU': '澳大利亚', 'SG': '新加坡', 'MY': '马来西亚',
  'TH': '泰国', 'IN': '印度', 'RU': '俄罗斯', 'BR': '巴西', 'NL': '荷兰',
  'IT': '意大利', 'ES': '西班牙', 'SE': '瑞典', 'CH': '瑞士', 'NO': '挪威',
  'DK': '丹麦', 'FI': '芬兰', 'PL': '波兰', 'NZ': '新西兰', 'VN': '越南',
  'ID': '印度尼西亚', 'PH': '菲律宾', 'AE': '阿联酋', 'SA': '沙特阿拉伯',
  'TR': '土耳其', 'MX': '墨西哥', 'AR': '阿根廷', 'ZA': '南非', 'EG': '埃及',
  'PK': '巴基斯坦', 'UA': '乌克兰', 'CZ': '捷克', 'AT': '奥地利',
  'BE': '比利时', 'PT': '葡萄牙', 'GR': '希腊', 'HU': '匈牙利', 'RO': '罗马尼亚',
  'IL': '以色列', 'HK': '香港', 'TW': '台湾', 'MO': '澳门',
};

function getLocation(cf) {
  if (!cf) return '';
  const country = cf.country || '';
  const region  = cf.region  || '';
  if (country === 'CN') return CN_PROVINCES[region] || region || '中国';
  return COUNTRIES[country] || country;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function initDb(db) {
  await db.prepare(INIT_SQL).run();
  await db.prepare(ADD_LOCATION_COL).run().catch(() => {});
}

async function handleGet(request, env) {
  await initDb(env.DB);
  const articleId = new URL(request.url).searchParams.get('article');
  if (!articleId) return json({ error: 'Missing article' }, 400);

  const { results } = await env.DB.prepare(
    'SELECT id, author, content, location, created_at FROM comments WHERE article_id = ? ORDER BY created_at ASC'
  ).bind(articleId).all();

  return json(results);
}

async function handlePost(request, env) {
  await initDb(env.DB);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const articleId = (body.article_id || '').trim();
  const author    = (body.author    || '').trim();
  const content   = (body.content   || '').trim();

  if (!articleId || !author || !content) return json({ error: '请填写昵称和评论内容' }, 400);
  if (author.length  > 50)   return json({ error: '昵称不超过 50 字' }, 400);
  if (content.length > 1000) return json({ error: '评论不超过 1000 字' }, 400);

  const safeAuthor  = escapeHtml(author);
  const safeContent = escapeHtml(content);
  const location    = getLocation(request.cf);
  const createdAt   = new Date().toISOString();

  await env.DB.prepare(
    'INSERT INTO comments (article_id, author, content, location, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(articleId, safeAuthor, safeContent, location, createdAt).run();

  return json({ success: true, author: safeAuthor, content: safeContent, location, created_at: createdAt }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/comments') {
      try {
        if (request.method === 'GET')  return await handleGet(request, env);
        if (request.method === 'POST') return await handlePost(request, env);
        return new Response('Method Not Allowed', { status: 405 });
      } catch (err) {
        return json({ error: err.message || 'Internal server error' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
