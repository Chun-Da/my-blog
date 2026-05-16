const INIT_SQL = 'CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id TEXT NOT NULL, author TEXT NOT NULL, content TEXT NOT NULL, location TEXT, created_at TEXT NOT NULL)';
const ADD_LOCATION_COL = 'ALTER TABLE comments ADD COLUMN location TEXT';

// 国内城市：英文拼音 → 中文
const CN_CITIES = {
  // 直辖市
  'Beijing': '北京', 'Shanghai': '上海', 'Tianjin': '天津', 'Chongqing': '重庆',
  // 广东
  'Guangzhou': '广州', 'Shenzhen': '深圳', 'Dongguan': '东莞', 'Foshan': '佛山',
  'Zhuhai': '珠海', 'Huizhou': '惠州', 'Zhongshan': '中山', 'Jiangmen': '江门',
  'Shantou': '汕头', 'Zhanjiang': '湛江', 'Maoming': '茂名', 'Zhaoqing': '肇庆',
  'Jieyang': '揭阳', 'Chaozhou': '潮州', 'Qingyuan': '清远', 'Shaoguan': '韶关',
  'Shanwei': '汕尾', 'Heyuan': '河源', 'Yangjiang': '阳江', 'Yunfu': '云浮',
  // 浙江
  'Hangzhou': '杭州', 'Ningbo': '宁波', 'Wenzhou': '温州', 'Jiaxing': '嘉兴',
  'Huzhou': '湖州', 'Shaoxing': '绍兴', 'Jinhua': '金华', 'Quzhou': '衢州',
  'Zhoushan': '舟山', 'Lishui': '丽水',
  // 江苏
  'Nanjing': '南京', 'Suzhou': '苏州', 'Wuxi': '无锡', 'Changzhou': '常州',
  'Nantong': '南通', 'Yangzhou': '扬州', 'Zhenjiang': '镇江', 'Xuzhou': '徐州',
  'Lianyungang': '连云港', 'Huaian': '淮安', 'Yancheng': '盐城', 'Suqian': '宿迁',
  // 山东
  'Jinan': '济南', 'Qingdao': '青岛', 'Yantai': '烟台', 'Weifang': '潍坊',
  'Zibo': '淄博', 'Linyi': '临沂', 'Jining': '济宁', 'Weihai': '威海',
  'Rizhao': '日照', 'Zaozhuang': '枣庄', 'Dongying': '东营', 'Dezhou': '德州',
  'Liaocheng': '聊城', 'Binzhou': '滨州', 'Heze': '菏泽',
  // 四川
  'Chengdu': '成都', 'Mianyang': '绵阳', 'Deyang': '德阳', 'Leshan': '乐山',
  'Zigong': '自贡', 'Nanchong': '南充', 'Luzhou': '泸州', 'Yibin': '宜宾',
  'Dazhou': '达州', 'Panzhihua': '攀枝花', 'Guangyuan': '广元', 'Suining': '遂宁',
  'Neijiang': '内江', 'Meishan': '眉山', 'Ziyang': '资阳',
  // 湖北
  'Wuhan': '武汉', 'Yichang': '宜昌', 'Xiangyang': '襄阳', 'Jingzhou': '荆州',
  'Huangshi': '黄石', 'Huanggang': '黄冈', 'Xiaogan': '孝感', 'Shiyan': '十堰',
  'Ezhou': '鄂州', 'Jingmen': '荆门', 'Suizhou': '随州', 'Xianning': '咸宁',
  // 湖南
  'Changsha': '长沙', 'Zhuzhou': '株洲', 'Xiangtan': '湘潭', 'Hengyang': '衡阳',
  'Shaoyang': '邵阳', 'Yueyang': '岳阳', 'Changde': '常德', 'Zhangjiajie': '张家界',
  'Yiyang': '益阳', 'Chenzhou': '郴州', 'Loudi': '娄底', 'Huaihua': '怀化',
  // 河南
  'Zhengzhou': '郑州', 'Luoyang': '洛阳', 'Kaifeng': '开封', 'Nanyang': '南阳',
  'Xinyang': '信阳', 'Anyang': '安阳', 'Jiaozuo': '焦作', 'Xinxiang': '新乡',
  'Pingdingshan': '平顶山', 'Zhoukou': '周口', 'Zhumadian': '驻马店',
  'Shangqiu': '商丘', 'Xuchang': '许昌', 'Sanmenxia': '三门峡',
  // 河北
  'Shijiazhuang': '石家庄', 'Tangshan': '唐山', 'Baoding': '保定',
  'Handan': '邯郸', 'Langfang': '廊坊', 'Cangzhou': '沧州', 'Zhangjiakou': '张家口',
  'Chengde': '承德', 'Qinhuangdao': '秦皇岛', 'Hengshui': '衡水',
  // 辽宁
  'Shenyang': '沈阳', 'Dalian': '大连', 'Anshan': '鞍山', 'Fushun': '抚顺',
  'Dandong': '丹东', 'Jinzhou': '锦州', 'Yingkou': '营口', 'Liaoyang': '辽阳',
  'Benxi': '本溪', 'Fuxin': '阜新', 'Panjin': '盘锦', 'Tieling': '铁岭',
  'Chaoyang': '朝阳', 'Huludao': '葫芦岛',
  // 陕西
  "Xi'an": '西安', 'Xian': '西安', 'Baoji': '宝鸡', 'Xianyang': '咸阳',
  'Weinan': '渭南', "Yan'an": '延安', 'Yanan': '延安', 'Hanzhong': '汉中',
  'Yulin': '榆林', 'Tongchuan': '铜川', 'Ankang': '安康',
  // 安徽
  'Hefei': '合肥', 'Wuhu': '芜湖', 'Bengbu': '蚌埠', 'Huainan': '淮南',
  'Maanshan': '马鞍山', 'Huaibei': '淮北', 'Anqing': '安庆', 'Huangshan': '黄山',
  'Chuzhou': '滁州', 'Fuyang': '阜阳', 'Xuancheng': '宣城', 'Chizhou': '池州',
  // 福建
  'Fuzhou': '福州', 'Xiamen': '厦门', 'Quanzhou': '泉州', 'Zhangzhou': '漳州',
  'Sanming': '三明', 'Nanping': '南平', 'Longyan': '龙岩', 'Ningde': '宁德',
  'Putian': '莆田',
  // 江西
  'Nanchang': '南昌', 'Jiujiang': '九江', 'Ganzhou': '赣州', 'Shangrao': '上饶',
  'Jingdezhen': '景德镇', 'Pingxiang': '萍乡',
  // 黑龙江
  'Harbin': '哈尔滨', 'Qiqihar': '齐齐哈尔', 'Mudanjiang': '牡丹江',
  'Jiamusi': '佳木斯', 'Daqing': '大庆', 'Heihe': '黑河',
  // 吉林
  'Changchun': '长春', 'Jilin': '吉林市', 'Siping': '四平', 'Tonghua': '通化',
  // 内蒙古
  'Hohhot': '呼和浩特', 'Baotou': '包头', 'Ordos': '鄂尔多斯',
  'Hulunbuir': '呼伦贝尔', 'Chifeng': '赤峰', 'Tongliao': '通辽',
  // 新疆
  'Urumqi': '乌鲁木齐', 'Kashgar': '喀什', 'Aksu': '阿克苏',
  // 云南
  'Kunming': '昆明', 'Dali': '大理', 'Lijiang': '丽江', 'Yuxi': '玉溪',
  'Qujing': '曲靖', 'Zhaotong': '昭通',
  // 贵州
  'Guiyang': '贵阳', 'Zunyi': '遵义', 'Liupanshui': '六盘水', 'Anshun': '安顺',
  // 甘肃
  'Lanzhou': '兰州', 'Tianshui': '天水', 'Jiayuguan': '嘉峪关', 'Zhangye': '张掖',
  // 山西
  'Taiyuan': '太原', 'Datong': '大同', 'Linfen': '临汾', 'Changzhi': '长治',
  'Yangquan': '阳泉', 'Jincheng': '晋城',
  // 广西
  'Nanning': '南宁', 'Guilin': '桂林', 'Liuzhou': '柳州', 'Beihai': '北海',
  'Wuzhou': '梧州', 'Qinzhou': '钦州',
  // 海南
  'Haikou': '海口', 'Sanya': '三亚',
  // 宁夏
  'Yinchuan': '银川',
  // 青海
  'Xining': '西宁',
  // 西藏
  'Lhasa': '拉萨',
  // 港澳台
  'Hong Kong': '香港', 'Macau': '澳门', 'Taipei': '台北',
  'Kaohsiung': '高雄', 'Taichung': '台中', 'Tainan': '台南',
};

// 省份回退：英文 → 中文
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

// 国家代码 → 中文
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
  const city    = cf.city    || '';

  if (country === 'CN' || country === 'HK' || country === 'MO' || country === 'TW') {
    if (city && CN_CITIES[city]) return CN_CITIES[city];
    return CN_PROVINCES[region] || CN_PROVINCES[city] || '中国';
  }

  const countryName = COUNTRIES[country] || country;
  return city ? countryName + ' · ' + city : countryName;
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

async function handleDelete(request, env) {
  await initDb(env.DB);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);

  const result = await env.DB.prepare(
    'DELETE FROM comments WHERE id = ?'
  ).bind(id).run();

  if (result.meta.changes === 0) return json({ error: '评论不存在' }, 404);
  return json({ success: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/comments') {
      try {
        if (request.method === 'GET')    return await handleGet(request, env);
        if (request.method === 'POST')   return await handlePost(request, env);
        if (request.method === 'DELETE') return await handleDelete(request, env);
        return new Response('Method Not Allowed', { status: 405 });
      } catch (err) {
        return json({ error: err.message || 'Internal server error' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
