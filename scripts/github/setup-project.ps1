[CmdletBinding()]
param(
    [string]$Owner = "dmkolisnyk",
    [string]$Repository = "business-pilot",
    [string]$ProjectTitle = "Business Pilot MVP"
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found. Install it from its official source before continuing."
    }
}

function Require-Success {
    param([Parameter(Mandatory = $true)][string]$Operation)

    if ($LASTEXITCODE -ne 0) {
        throw "$Operation failed with exit code $LASTEXITCODE."
    }
}

Require-Command -Name git
Require-Command -Name gh

$repoFullName = "$Owner/$Repository"
$remoteUrl = "https://github.com/$repoFullName.git"

if (-not (Test-Path .git)) {
    git init
    Require-Success -Operation "git init"
}

$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin $remoteUrl
    Require-Success -Operation "git remote add origin"
} elseif ($origin -ne $remoteUrl -and $origin -ne "git@github.com:$repoFullName.git") {
    throw "The existing origin remote points to '$origin', expected '$remoteUrl'. Refusing to overwrite it automatically."
}

gh auth status
Require-Success -Operation "GitHub CLI authentication check"

# Confirm that the authenticated account can access the expected repository.
gh repo view $repoFullName --json nameWithOwner,defaultBranchRef,url | Out-Null
Require-Success -Operation "GitHub repository access check"

# Account-level GitHub Projects require the project OAuth scope.
gh auth refresh -s project
Require-Success -Operation "GitHub CLI project-scope authorization"

$projectNumber = gh project list --owner $Owner --limit 100 --format json --jq ".projects[] | select(.title == `"$ProjectTitle`") | .number"
Require-Success -Operation "GitHub Project lookup"

if (-not $projectNumber) {
    Write-Host "Creating GitHub Project '$ProjectTitle'..."
    $projectNumber = gh project create --owner $Owner --title $ProjectTitle --format json --jq ".number"
    Require-Success -Operation "GitHub Project creation"
}

if (-not $projectNumber) {
    throw "Unable to resolve the GitHub Project number."
}

gh project link $projectNumber --owner $Owner --repo $Repository
Require-Success -Operation "GitHub Project repository link"

# Add fields used by the repository-local agent workflow. The script is idempotent:
# existing fields are kept and only missing fields are created.
$fields = gh project field-list $projectNumber --owner $Owner --format json | ConvertFrom-Json
Require-Success -Operation "GitHub Project field lookup"

$fieldNames = @($fields.fields | ForEach-Object { $_.name })

if ('Agent Status' -notin $fieldNames) {
    gh project field-create $projectNumber `
        --owner $Owner `
        --name 'Agent Status' `
        --data-type 'SINGLE_SELECT' `
        --single-select-options 'Backlog,Ready,In progress,In review,Blocked,Done,Cancelled' | Out-Null
    Require-Success -Operation "Agent Status field creation"
}

if ('Task ID' -notin $fieldNames) {
    gh project field-create $projectNumber `
        --owner $Owner `
        --name 'Task ID' `
        --data-type 'TEXT' | Out-Null
    Require-Success -Operation "Task ID field creation"
}

if ('Priority' -notin $fieldNames) {
    gh project field-create $projectNumber `
        --owner $Owner `
        --name 'Priority' `
        --data-type 'SINGLE_SELECT' `
        --single-select-options 'P0,P1,P2,P3' | Out-Null
    Require-Success -Operation "Priority field creation"
}

Write-Host "Repository remote: $remoteUrl"
Write-Host "GitHub Project: https://github.com/users/$Owner/projects/$projectNumber"
Write-Host "Project '$ProjectTitle' is linked to $repoFullName."
Write-Host "Agent fields are present: Agent Status, Task ID, Priority."
