require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const requireAuth = require('./middleware/auth.middleware');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize tables
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT     NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT     NOT NULL,
        content TEXT   NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id   INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content   TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        post_id   INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (post_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
    `);
    console.log('Tables already exists');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

// ---- AUTH ROUTES ----
const authRouter = require('./auth');
app.use('/auth', authRouter);

// ---- ROUTES ----

// Users (signup)
app.post('/users', async (req, res) => {
  const { name, email, password_hash } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO users(name, email, password_hash) VALUES($1,$2,$3) RETURNING *',
      [name, email, password_hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get current user info
app.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Posts with author info
app.get('/posts', async (_, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, u.name as author_name, u.email as author_email,
           (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
  `);
  res.json(rows);
});

app.post('/posts', requireAuth, async (req, res) => {
  const { title, content, image_url } = req.body;
  const author_id = req.user.id;
  try {
    if (author_id === undefined) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    else{
      const { rows } = await pool.query(
        `INSERT INTO posts(author_id,title,content,image_url)
         VALUES($1,$2,$3,$4) RETURNING *`,
        [author_id, title, content, image_url]
      );
      res.status(201).json(rows[0]);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/posts/:id', requireAuth, async (req, res) => {
  const postId = req.params.id;

  // 1) Fetch the post's author
  const { rows } = await pool.query(
    'SELECT author_id FROM posts WHERE id = $1',
    [postId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Post not found' });

  // 2) Check ownership
  if (rows[0].author_id !== req.user.id) {
    return res.status(403).json({ error: 'You may only edit your own posts' });
  }

  // 3) Perform update
  const updates = req.body;
  const setClause = Object.keys(updates)
    .map((k, i) => `${k} = $${i + 1}`)
    .join(', ');
  const values = [...Object.values(updates), postId];
  try {
    const { rows } = await pool.query(
      `UPDATE posts SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/posts/:id', requireAuth, async (req, res) => {
  const postId = req.params.id; 

  // 1) Fetch the post's author
  const { rows } = await pool.query(
    'SELECT author_id FROM posts WHERE id = $1',
    [postId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Post not found' });

  // 2) Check ownership
  if (rows[0].author_id !== req.user.id) {
    return res.status(403).json({ error: 'You may only delete your own posts' });
  }

  // 3) Perform delete
  await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
  res.status(204).send();
});

// Comments
app.post('/posts/:id/comments', requireAuth, async (req, res) => {
  const post_id = req.params.id;
  const { content } = req.body;
  const author_id = req.user.id;
  const { rows } = await pool.query(
    'INSERT INTO comments(post_id,author_id,content) VALUES($1,$2,$3) RETURNING *',
    [post_id, author_id, content]
  );
  res.status(201).json(rows[0]);
});

app.delete('/comments/:id', requireAuth, async (req, res) => {
  const commentId = req.params.id;
  
  // Check if user owns the comment
  const { rows } = await pool.query(
    'SELECT author_id FROM comments WHERE id = $1',
    [commentId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
  
  if (rows[0].author_id !== req.user.id) {
    return res.status(403).json({ error: 'You may only delete your own comments' });
  }
  
  await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
  res.status(204).send();
});

// Likes
app.post('/posts/:id/like', requireAuth, async (req, res) => {
  const post_id = req.params.id;
  const user_id = req.user.id;
  try {
    const { rows } = await pool.query(
      'INSERT INTO likes(post_id,user_id) VALUES($1,$2) RETURNING *',
      [post_id, user_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/posts/:id/unlike', requireAuth, async (req, res) => {
  const post_id = req.params.id;
  const user_id = req.user.id;
  await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [
    post_id,
    user_id,
  ]);
  res.status(204).send();
});

// Start server
const PORT = process.env.PORT;
initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`Server started at http://localhost:${PORT}`)
  );
});
