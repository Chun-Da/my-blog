const INIT_SQL = `CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  author     TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL
)`;

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

async function handleGet(request, env) {
  await env.DB.exec(INIT_SQL);
  const articleId = new URL(request.url).searchParams.get('article');
  if (!articleId) return json({ error: 'Missing article' }, 400);

  const { results } = await env.DB.prepare(
    'SELECT id, author, content, created_at FROM comments WHERE article_id = ? ORDER BY created_at ASC'
  ).bind(articleId).all();

  return json(results);
}

async function handlePost(request, env) {
  await env.DB.exec(INIT_SQL);

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
  const createdAt   = new Date().toISOString();

  await env.DB.prepare(
    'INSERT INTO comments (article_id, author, content, created_at) VALUES (?, ?, ?, ?)'
  ).bind(articleId, safeAuthor, safeContent, createdAt).run();

  return json({ success: true, author: safeAuthor, content: safeContent, created_at: createdAt }, 201);
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
        return json({ error: 'Internal server error' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
