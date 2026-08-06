# GitLab Repository Setup

Git is not currently on your system PATH. Follow these steps once to create the remote repo and push this project.

## 1. Install Prerequisites

| Tool | Link |
|------|------|
| Git | https://git-scm.com/download/win |
| Node.js 20+ | https://nodejs.org/ |
| GitLab CLI | https://gitlab.com/gitlab-org/cli#installation |

After installing Git, restart your terminal so `git` is on PATH.

## 2. Authenticate with GitLab

```powershell
glab auth login
```

Choose GitLab.com (or your self-hosted instance) and follow the browser flow.

## 3. Initialize & Push

From the project directory:

```powershell
cd C:\Users\an80s\Projects\canasta-mobile

# If git wasn't initialized by create_project:
git init
git add .
git commit -m "Initial commit: Canasta mobile game scaffold with rules engine and AI"

# Create the GitLab repo (private by default; add --public if desired)
glab repo create canasta-mobile --private --source=. --remote=origin --push
```

### Alternative: Create repo in GitLab UI first

1. Go to https://gitlab.com/projects/new
2. Name: **canasta-mobile**
3. Visibility: Private
4. Uncheck "Initialize with README" (we already have one)
5. Then:

```powershell
cd C:\Users\an80s\Projects\canasta-mobile
git init
git add .
git commit -m "Initial commit: Canasta mobile game scaffold with rules engine and AI"
git remote add origin https://gitlab.com/YOUR_USERNAME/canasta-mobile.git
git branch -M main
git push -u origin main
```

## 4. Enable CI/CD

The included `.gitlab-ci.yml` runs on GitLab shared runners:

- **typecheck** — `npm run typecheck`
- **test** — `npm test`

Push to `main` or open a merge request to trigger the pipeline.

## 5. Recommended GitLab Settings

- **Protected branch**: `main`
- **Merge requests**: require pipeline to pass
- **Variables** (Settings → CI/CD → Variables): add secrets here when backend keys are needed — never commit `.env` files
