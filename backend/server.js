require('dotenv').config();
const express = require('express');
const pool = require('./db');

const app = express();
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

// Posts
app.get('/posts', async (_, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM posts ORDER BY created_at DESC'
  );
  res.json(rows);
});
app.post('/posts', async (req, res) => {
  const { author_id, title, content, image_url } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO posts(author_id,title,content,image_url)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [author_id, title, content, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.put('/posts/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const setClause = Object.keys(updates)
    .map((k, i) => `${k} = $${i + 1}`)
    .join(', ');
  const values = [...Object.values(updates), id];
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
app.delete('/posts/:id', async (req, res) => {
  await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

// Comments
app.post('/posts/:id/comments', async (req, res) => {
  const post_id = req.params.id;
  const { author_id, content } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO comments(post_id,author_id,content) VALUES($1,$2,$3) RETURNING *',
    [post_id, author_id, content]
  );
  res.status(201).json(rows[0]);
});
app.delete('/comments/:id', async (req, res) => {
  await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

// Likes
app.post('/posts/:id/like', async (req, res) => {
  const post_id = req.params.id;
  const { user_id } = req.body;
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
app.post('/posts/:id/unlike', async (req, res) => {
  const post_id = req.params.id;
  const { user_id } = req.body;
  await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [
    post_id,
    user_id,
  ]);
  res.status(204).send();
});

const authRouter = require('./auth/sign-up');
app.use('/sign-up', authRouter);

// Start server
const PORT = process.env.PORT;
initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`Server started at http://localhost:${PORT}`)
  );
});
