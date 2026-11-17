# TaskFlow

TaskFlow is a shared work hub for individuals and teams. Plan tasks, collaborate in team workspaces, track deadlines, and understand delivery risks in one place.

New visitors can explore a sample workspace before creating an account.

## What you can do

- **Plan tasks:** organize work by status, priority, due date, and estimated effort. Search and filter tasks, or update many tasks at once.
- **Work with a team:** create shared workspaces, invite registered TaskFlow users, assign tasks, discuss individual tasks, chat in the workspace, and keep team notes together.
- **Stay in the loop:** get in-app alerts for team discussion messages, mention teammates by name or picker, and open the related conversation from the notification bell.
- **Keep personal work private:** personal tasks stay in your personal workspace. Team members can access a shared workspace, but cannot see your personal workspace.
- **Plan dependencies:** link prerequisite tasks, prevent completion while prerequisites are unfinished, and see how blocked work affects a plan.
- **Track delivery:** review project health, team workload, and delivery forecasts in the Control Tower.
- **Preview changes safely:** use the Impact Simulator to explore the effect of added work or changed estimates and deadlines without editing saved tasks.
- **Stay organized:** use the calendar, shared and personal notes, reports, and CSV export.
- **Get phone alerts:** optionally enable browser push notifications for task assignments and team workspace additions.

Each team workspace is a shared project. TaskFlow does not currently have a separate company or organization layer.

## Technology

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT in an HTTP-only cookie
- **Mobile alerts:** browser push using VAPID and a service worker

## Run locally

### Requirements

- Node.js 20.19+ or 22.12+
- MongoDB, local or hosted
- npm

### 1. Configure the backend

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
CLIENT_ORIGIN=http://localhost:5173
```

Use a unique, random JWT secret of at least 32 characters. Never commit `.env` files or production secrets.

### 2. Start the API

```powershell
cd server
npm install
npm run dev
```

The API starts on `http://localhost:5000`.

### 3. Start the web app

In another terminal:

```powershell
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:5000`.

## Production configuration

The frontend and API are separate applications. A straightforward deployment is Vercel for the React frontend, Render for the Express API, and MongoDB Atlas for the database. On Vercel, set the project root to `client`. On Render, create a Web Service from this repository with the root directory `server`, build command `npm ci`, and start command `npm start`. Create an Atlas database and use its connection string for `MONGO_URI`.

Configure these environment variables for production:

| Variable | Where | Purpose |
| --- | --- | --- |
| `MONGO_URI` | API | MongoDB connection string. |
| `JWT_SECRET` | API | Private signing secret, at least 32 characters. |
| `CLIENT_ORIGIN` | API | Exact frontend origin allowed by CORS, such as `https://your-app.example`. |
| `VITE_API_URL` | Frontend build | Full API URL ending in `/api` when the API is on another origin. |
| `VAPID_PUBLIC_KEY` | API | Public key for browser push. |
| `VAPID_PRIVATE_KEY` | API | Private browser-push key. Keep it secret. |
| `VAPID_SUBJECT` | API | Service contact, for example `mailto:admin@example.com`. |

With Vercel and Render's default domains, configure a Vercel rewrite so browser requests to `/api/*` are proxied to the Render API. After Render gives you the service URL, add `client/vercel.json` with the following content, replacing the example hostname with that URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-taskflow-api.onrender.com/api/:path*"
    }
  ]
}
```

Leave `VITE_API_URL` unset on Vercel so the client uses the same-origin `/api` path. Set `CLIENT_ORIGIN` on Render to the exact production Vercel origin, such as `https://your-taskflow.vercel.app`. Set `NODE_ENV=production`, `MONGO_URI`, and a unique `JWT_SECRET` of at least 32 characters on Render; Render supplies `PORT`. Add VAPID variables only if enabling push notifications.

The authentication cookie is `HttpOnly`, `Secure` in production, and `SameSite=Lax`. Do not point the browser directly at the default Render API domain from the default Vercel frontend domain: those are cross-site and the browser will not send this cookie. A Vercel `/api` rewrite keeps browser requests same-origin. Do not change the cookie to `SameSite=None` as a workaround without also designing and implementing CSRF protection.

Before public launch, verify against the deployed URLs over HTTPS:

1. Register an account, log in, reload the page, and confirm the session is restored.
2. Create and update a task, create a team workspace, and verify authenticated API requests continue to work.
3. Log out, reload, and confirm the session is cleared.
4. If push notifications are enabled, subscribe and test a notification on a supported browser.

Use a managed MongoDB service with backups and restrict database network access.

### Optional: enable phone push notifications

Generate a VAPID key pair in the `server` directory:

```powershell
npx web-push generate-vapid-keys
```

Store both generated keys and a `mailto:` subject in the API environment. Users then enable notifications on each device from **Phone notifications** in TaskFlow.

Push requires HTTPS in production and browser permission. On iPhone, use iOS 16.4 or newer, add TaskFlow to the Home Screen, and open it from there before enabling push. Notifications are currently sent for task assignments and team workspace additions.

## Checks

Run the frontend lint and production build:

```powershell
cd client
npm run lint
npm run build
```

Check backend JavaScript syntax from the `server` directory with:

```powershell
node --check src/server.js
```

## Project layout

```text
client/   React web application
server/   Express API and MongoDB models
```

## Current limitations

- A team workspace is a shared project; there is no organization, role-management, or billing layer yet.
- Phone alerts use browser push, not SMS or native mobile applications.
- Delivery forecasts use estimates and recent completion history. They are planning signals, not guarantees.
- The Impact Simulator only previews changes; apply approved changes separately through normal task editing.
