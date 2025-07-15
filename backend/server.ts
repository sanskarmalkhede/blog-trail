import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import pool from "./db";
import { requireAuth, optionalAuth } from "./middleware/auth.middleware";

dotenv.config();

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface PostWithAuthor extends Post {
  author_name: string;
  author_email: string;
  likes_count: number;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

const NULL_UUID = '00000000-0000-0000-0000-000000000000';

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());


// Initialize tables
async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT     NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT     NOT NULL,
        content TEXT   NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content   TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (post_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
      CREATE TABLE IF NOT EXISTS comment_likes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (comment_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
    `);
    console.log("Tables already exists");
  } catch (err) {
    console.error("Error initializing database:", err);
  } finally {
    client.release();
  }
}

// ---- AUTH ROUTES ----
import authRouter from "./auth";
app.use("/auth", authRouter);

// ---- ROUTES ----

// Users (signup)
app.post("/users", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password_hash } = req.body;
  try {
    const { rows } = await pool.query<User>(
      "INSERT INTO users(name, email, password_hash) VALUES($1,$2,$3) RETURNING *",
      [name, email, password_hash]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Get current user info
app.get(
  "/auth/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { rows } = await pool.query<User>(
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
        [req.user!.id]
      );
      if (!rows.length) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Posts with author info
app.get("/posts", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id ?? NULL_UUID;
  try {
    const { rows } = await pool.query<PostWithAuthor & {is_liked: boolean}>(
      `
      SELECT p.*, u.name as author_name, u.email as author_email,
             (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
             CASE WHEN $1 = '${NULL_UUID}' THEN false
                  ELSE EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1::uuid)
             END as is_liked
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      `,
      [userId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post(
  "/posts",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { title, content, image_url } = req.body;
    const author_id = req.user!.id;
    try {
      if (author_id === undefined) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { rows } = await pool.query<Post>(
        `INSERT INTO posts(author_id,title,content,image_url)
       VALUES($1,$2,$3,$4) RETURNING *`,
        [author_id, title, content, image_url]
      );
      res.status(201).json(rows[0]);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

app.put(
  "/posts/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const postId = req.params.id;

    try {
      // 1) Fetch the post's author
      const { rows } = await pool.query<{ author_id: string }>(
        "SELECT author_id FROM posts WHERE id = $1",
        [postId]
      );
      if (!rows.length) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      // 2) Check ownership
      if (rows[0].author_id !== req.user!.id) {
        res.status(403).json({ error: "You may only edit your own posts" });
        return;
      }

      // 3) Perform update
      const updates = req.body;
      const setClause = Object.keys(updates)
        .map((k, i) => `${k} = $${i + 1}`)
        .join(", ");
      const values = [...Object.values(updates), postId];

      const { rows: updatedRows } = await pool.query<Post>(
        `UPDATE posts SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      );
      res.json(updatedRows[0]);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

app.delete(
  "/posts/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const postId = req.params.id;

    try {
      // 1) Fetch the post's author
      const { rows } = await pool.query<{ author_id: string }>(
        "SELECT author_id FROM posts WHERE id = $1",
        [postId]
      );
      if (!rows.length) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      // 2) Check ownership
      if (rows[0].author_id !== req.user!.id) {
        res.status(403).json({ error: "You may only delete your own posts" });
        return;
      }

      // 3) Perform delete
      await pool.query("DELETE FROM posts WHERE id = $1", [postId]);
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Comments
app.post(
  "/posts/:id/comments",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const post_id = req.params.id;
    const { content } = req.body;
    const author_id = req.user!.id;
    try {
      const { rows } = await pool.query<Comment>(
        "INSERT INTO comments(post_id,author_id,content) VALUES($1,$2,$3) RETURNING *",
        [post_id, author_id, content]
      );
      res.status(201).json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

app.get(
  "/posts/:id/comments",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    const post_id = req.params.id;
    const userId = req.user?.id ?? NULL_UUID;
    try {
      const { rows } = await pool.query<Comment & {author_name: string, author_email: string, likes_count: number, is_liked: boolean}>(
        `
        SELECT c.*, u.name as author_name, u.email as author_email,
               (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
               CASE WHEN $2 = '${NULL_UUID}' THEN false
                    ELSE EXISTS (SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2::uuid)
               END as is_liked
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
        `,
        [post_id, userId]
      );
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

app.delete(
  "/comments/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const commentId = req.params.id;

    try {
      // Check ownership
      const { rows } = await pool.query<{ comment_author: string, post_author: string }>(
        `
        SELECT c.author_id as comment_author, p.author_id as post_author
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.id = $1
        `,
        [commentId]
      );
      if (!rows.length) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }

      if (rows[0].comment_author !== req.user!.id && rows[0].post_author !== req.user!.id) {
        res.status(403).json({ error: "You may only delete your own comments or comments on your own posts" });
        return;
      }

      await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Likes
app.post(
  "/posts/:id/like",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const post_id = req.params.id;
    const user_id = req.user!.id;
    try {
      const { rows } = await pool.query<Like>(
        "INSERT INTO likes(post_id,user_id) VALUES($1,$2) RETURNING *",
        [post_id, user_id]
      );
      res.status(201).json(rows[0]);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

app.post(
  "/posts/:id/unlike",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const post_id = req.params.id;
    const user_id = req.user!.id;
    try {
      await pool.query(
        "DELETE FROM likes WHERE post_id = $1 AND user_id = $2",
        [post_id, user_id]
      );
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Comment Likes
app.post(
  "/comments/:id/like",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const comment_id = req.params.id;
    const user_id = req.user!.id;
    try {
      const { rows } = await pool.query<CommentLike>(
        "INSERT INTO comment_likes(comment_id, user_id) VALUES($1, $2) RETURNING *",
        [comment_id, user_id]
      );
      res.status(201).json(rows[0]);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

app.post(
  "/comments/:id/unlike",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const comment_id = req.params.id;
    const user_id = req.user!.id;
    try {
      await pool.query(
        "DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
        [comment_id, user_id]
      );
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Start server
const PORT = process.env.PORT;
initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`Server started at http://localhost:${PORT}`)
  );
});
