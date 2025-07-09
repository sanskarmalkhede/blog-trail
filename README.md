# Blog Trail

A full-stack blog web application.

## 🛠️ Tech Stack

- **Frontend:** Vite, React, TypeScript, Tailwind CSS, shadcn/ui, React Query, React Router
- **Backend:** Node.js, Express.js, `pg` (Postgres client)
- **Database:** PostgreSQL (local via Docker Compose, or Supabase)
- **Auth:** JWT (custom) or Supabase Auth
- **Deployment:** Docker, Docker Compose, GitHub Actions, Vercel/Heroku

---

## 📁 Repository Structure

```
blog-trail/
├── client/   # Vite + React + TypeScript frontend
│   ├── public/
│   ├── src/
│   ├── .env.local
│   └── package.json
├── backend/  # Express.js backend
│   ├── db.js         # Postgres pool config
│   ├── server.js     # App entrypoint, DDL & routes
│   ├── .env          # env vars (gitignored)
│   └── package.json
├── docker-compose.yml # Spins up Postgres for local dev
├── schema.sql        # (optional) raw SQL DDL
└── README.md
```

---

## 🎯 Features

- User signup (email & password hash)
- Create, read, update, delete blog posts
- Commenting on posts
- Liking & unliking posts
- Pagination & ordering by creation date
- Lazy-loaded React routes & code-splitting
- Tailwind CSS JIT purging
- Dockerized local Postgres with persistent volume
- Beekeeper Studio / psql CLI support for schema introspection

---

## 📦 Prerequisites

- [Node.js ≥ 16.x](https://nodejs.org/)
- [Docker & Docker Compose](https://docs.docker.com/compose/)
- (Optional) [Beekeeper Studio](https://www.beekeeperstudio.io/) or `psql` CLI

---

## 🔧 Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/<your-username>/blog-trail.git
   cd blog-trail
   ```
2. **Start Postgres**
   ```bash
   docker-compose up -d
   ```
3. **Configure backend**
   - Copy `backend/.env.example` → `backend/.env`
   - Fill in:
     ```env
     DATABASE_URL=postgres://bloguser:blogpass@localhost:5432/blogdb
     PORT=4000
     # (If using Supabase Auth: add SUPABASE_URL & SUPABASE_ANON_KEY)
     ```
4. **Install & run backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
5. **Install & run frontend**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
6. **Browse the app**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:4000](http://localhost:4000)

7. **Open database GUI**
   - In Beekeeper Studio, connect to `localhost:5432/blogdb`
   - Or use psql:
     ```bash
     docker exec -it blog-trail-postgres psql -U bloguser -d blogdb
     ```

8. **(Optional) Run raw SQL schema**
   ```bash
   docker cp schema.sql blog-trail-postgres:/schema.sql
   docker exec -it blog-trail-postgres psql -U bloguser -d blogdb -f /schema.sql
   ```

---

## 💼 Production Deployment

- Use a managed DB (e.g. Supabase, AWS RDS) or `docker-compose.prod.yml`
- Set environment variables in your host/CI (DO NOT commit secrets)
- Build & deploy backend and frontend to your chosen platform
- Run migrations or ensure tables on startup

---

## 📝 Contributing

1. Fork & clone
2. Create a feature branch (`git checkout -b feature/xyz`)
3. Commit changes with Conventional Commits
4. Open a Pull Request against `main`
5. Ensure tests & linting pass

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

Happy coding! 🚀
