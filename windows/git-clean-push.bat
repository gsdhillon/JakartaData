@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0.."

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo This script must be run from inside a Git working tree.
    exit /b 1
)

for /f "delims=" %%b in ('git branch --show-current') do set "BRANCH=%%b"
if not defined BRANCH (
    echo Cannot push because the repository is in detached HEAD state.
    exit /b 1
)

echo.
echo WARNING: This will stage ALL changes, including deletes and untracked files.
echo It will commit them and push branch "%BRANCH%" to origin.
echo.
echo Current status:
git status --short
echo.

set /p CONFIRM=Type Y to clean-commit-push this working tree: 
if /i not "%CONFIRM%"=="Y" (
    echo Cancelled.
    exit /b 1
)

git add -A
if errorlevel 1 exit /b 1

git diff --cached --quiet
if errorlevel 1 (
    set "COMMIT_MESSAGE=%*"
    if not defined COMMIT_MESSAGE set "COMMIT_MESSAGE=fresh working tree from %COMPUTERNAME%"

    git commit -m "!COMMIT_MESSAGE!"
    if errorlevel 1 exit /b 1
) else (
    echo No local changes to commit.
)

git push origin "%BRANCH%"
if errorlevel 1 exit /b 1

echo.
echo Done. Branch "%BRANCH%" is pushed to origin.
