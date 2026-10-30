# TaskFlow

TaskFlow is a shared work hub for teams and individuals. It brings task planning, project collaboration, deadlines, working notes, and progress reporting into one responsive workspace.

## What it includes

- **Overview:** task health, upcoming deadlines, recent changes, and weekly progress.
- **Tasks:** searchable, filterable, sortable, paginated tasks with due dates, status, priority, effort estimates, project-member assignment, and same-workspace prerequisites.
- **Bulk task triage:** select up to 100 accessible tasks across pages and update status and/or priority in one validated request.
- **Team workspaces:** shared projects with owner-managed membership and project-specific tasks. Each project currently acts as a team workspace; there is no separate company/organization entity.
- **Calendar:** monthly deadline view with inline task status updates.
- **Notes:** personal notes and notes shared with a project team.
- **Reports:** live task and project metrics, priority breakdowns, and full-workspace CSV export.
- **Delivery control tower:** project risk signals, estimate-based finish forecasts, team workload visibility, and a non-destructive workload rebalance simulation.
- **Change impact simulator:** preview added task scope, deadline shifts, and effort-estimate changes against remaining work, critical dependency chains, blockers, risk signals, and delivery outlook without changing saved tasks.
- **Phone notifications:** opt-in web push alerts for task assignments and team workspace additions, with per-device controls and private lock-screen previews.
- **Accounts:** HTTP-only JWT session cookies, session restoration, and registration/login/logout flows.
- **Guest tour:** browse a realistic sample workspace before registering, with a timed focus sprint and interactive navigation.
- **Quick actions:** authenticated users can open the command palette with `Ctrl+K` (`Cmd+K` on macOS) to search workspace pages, tasks, and common actions.

Project owners can add people by email after those people have registered. Project members can work with shared project tasks and notes, and project tasks can be assigned to a member. Only the owner can manage membership or delete the project. Removing a member clears their task assignments; deleting a project keeps its tasks and notes, making them private to their original creators. New accounts require passwords of at least eight characters.

The delivery outlook uses explicit task effort estimates (2 hours by default) and recent completion history. Choose all work, personal work, or an individual team workspace from the sidebar or Control Tower scope selector. To set up team data, create a team workspace under Team workspaces, invite people who already have TaskFlow accounts, add tasks to that workspace, and assign those tasks to members. Forecasts are not shown when the workspace has no recent completion pace. Risk scores are explainable triage signals—not probabilities of failure—and the workload simulator does not change assignments.

Tasks can depend on up to 20 other tasks in the same personal or team workspace. The API rejects self-dependencies, cross-workspace references, and dependency cycles; tasks with incomplete prerequisites cannot be marked complete. Deleting a prerequisite removes its links, and moving a linked task to another workspace requires clearing its dependency links first.

The Change Impact Simulator works from an authenticated snapshot of up to 2,000 tasks in the selected scope. Its scenarios are client-side previews only; apply a decision separately through normal task editing after reviewing the assumptions.

Phone notifications use browser push, not SMS or native-app notifications. Configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` on the server to enable subscriptions. Generate a VAPID key pair with `npx web-push generate-vapid-keys`; keep the private key secret and use a `mailto:` subject for your service contact. Users enable alerts per device from **Phone notifications**. Push requires HTTPS in production; iPhone users need iOS 16.4 or newer and must add the site to their Home Screen before enabling push. Alerts are sent for task assignment and team workspace membership events; current notification previews do not include task or workspace names.

## Development setup

Requirements: Node.js 20.19+ (or 22.12+) and MongoDB.

1. Configure the backend environment in `server/.env`:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/taskflow
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
   CLIENT_ORIGIN=http://localhost:5173
   ```

   Generate a unique secret for each environment. Do not commit `.env` files.

2. Start the API:

   ```powershell
   cd server
   npm install
   npm run dev
   ```

3. Start the frontend in another terminal:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   The Vite development server proxies `/api` requests to `http://localhost:5000`. Set `VITE_API_PROXY_TARGET` if the local API runs elsewhere.

## Configuration

| Variable | Application | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Server | MongoDB connection string; required. |
| `JWT_SECRET` | Server | Signing secret, minimum 32 characters; required. |
| `PORT` | Server | API port; defaults to `5000`. |
| `NODE_ENV` | Server | Set to `production` to enable secure session cookies. |
| `CLIENT_ORIGIN` | Server | Comma-separated allowed frontend origins; defaults to `http://localhost:5173`. |
| `VITE_API_URL` | Client | API base URL including `/api`; defaults to same-origin `/api`. |
| `VITE_API_PROXY_TARGET` | Client dev server | Vite proxy target; defaults to `http://localhost:5000`. |

For production, serve the frontend and API over HTTPS, configure the exact frontend origin, use a managed MongoDB deployment with backups, and keep the JWT secret outside source control. When the client and API use different origins, set `VITE_API_URL` to the API's `/api` URL and `CLIENT_ORIGIN` to the frontend origin.

## API areas

- **Authentication and users:** `/api/auth/*`, `/api/users/user`
- **Tasks and workspace metrics:** `/api/tasks`, `/api/tasks/summary`, `/api/tasks/delivery-control-tower`
- **Projects and membership:** `/api/projects`
- **Personal and project notes:** `/api/notes`

All task, project, and note data endpoints require an authenticated session. Project access is checked on the server for reads and writes; clients cannot access a project merely by knowing its ID.

## Scripts

Run these from `client/`:

- `npm run dev` — start Vite.
- `npm run build` — create the production frontend bundle.
- `npm run preview` — preview the production bundle locally.
- `npm run lint` — run ESLint.

Run these from `server/`:

- `npm run dev` — start the API with Nodemon.
- `npm start` — start the API.
