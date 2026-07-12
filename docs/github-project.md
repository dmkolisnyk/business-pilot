# GitHub Repository and Project Setup

## Repository

Business Pilot uses the public repository:

```text
https://github.com/dmkolisnyk/business-pilot
```

The expected Git remote is:

```text
origin https://github.com/dmkolisnyk/business-pilot.git
```

## GitHub Project

The project board is named `Business Pilot MVP`. GitHub Projects are account-level resources and are not stored inside the Git repository.

Use the repository script from PowerShell after installing and authenticating the official GitHub CLI:

```powershell
./scripts/github/setup-project.ps1
```

The script is idempotent and performs only these operations:

1. Initializes Git when `.git` is missing.
2. Adds the expected `origin` remote when it is missing.
3. Refuses to overwrite an unexpected existing remote.
4. Verifies access to `dmkolisnyk/business-pilot`.
5. Finds or creates the `Business Pilot MVP` GitHub Project.
6. Links the project to `dmkolisnyk/business-pilot`.
7. Creates missing project fields used by the agent workflow:
   - `Agent Status`: Backlog, Ready, In progress, In review, Blocked, Done, Cancelled
   - `Task ID`: text
   - `Priority`: P0, P1, P2, P3

Install GitHub CLI only from the official GitHub CLI distribution or through the official Windows package source:

```powershell
winget install --id GitHub.cli
```

Authenticate and run the setup:

```powershell
gh auth login
./scripts/github/setup-project.ps1
```

GitHub Projects require an authenticated token with the `project` scope. The setup script requests that scope through `gh auth refresh -s project`.

## Verification

```powershell
git remote -v
gh repo view dmkolisnyk/business-pilot
gh project list --owner dmkolisnyk
gh project field-list <PROJECT_NUMBER> --owner dmkolisnyk
```
