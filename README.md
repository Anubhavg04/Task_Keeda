# TaskFlow

TaskFlow is a shared work hub for individuals and teams. Plan tasks, collaborate in team workspaces, track deadlines, and understand delivery risks in one place.

New visitors can explore a sample workspace before creating an account.

## What you can do

- **Plan tasks:** organize work by status, priority, due date, and estimated effort. Search and filter tasks, or update many tasks at once.
- **Work with a team:** create shared workspaces, invite registered TaskFlow users, assign tasks, and keep team notes together.
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

The frontend and API are separate applications. Deploy the React frontend to a static hosting service such as Vercel, and deploy the Express API to a Node.js host or configure it for a serverless platform. The repository does not include a Vercel deployment configuration for the Express API.

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

Use HTTPS for both the frontend and API. If they use different sites, confirm that browser cookie rules allow the authentication cookie to reach the API; same-site hosting or an API proxy is preferable. Use a managed MongoDB service with backups and restrict database network access.

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
