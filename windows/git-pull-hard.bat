@echo off
setlocal

cd /d "%~dp0.."

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo This script must be run from inside a Git working tree.
    exit /b 1
)

for /f "delims=" %%b in ('git branch --show-current') do set "BRANCH=%%b"
if not defined BRANCH (
    echo Cannot hard-pull because the repository is in detached HEAD state.
    exit /b 1
)

echo.
echo DANGER: This will overwrite local branch "%BRANCH%" with origin/%BRANCH%.
echo It will permanently remove local tracked changes, untracked files, and ignored files.
echo.
echo Current status:
git status --short
echo.
echo Files/directories that git clean would remove:
git clean -ndx
echo.

set /p CONFIRM=Type Y to fetch, hard reset, and clean this working tree: 
if /i not "%CONFIRM%"=="Y" (
    echo Cancelled.
    exit /b 1
)

git fetch origin
if errorlevel 1 exit /b 1

git reset --hard "origin/%BRANCH%"
if errorlevel 1 exit /b 1

git clean -fdx
if errorlevel 1 exit /b 1

echo.
echo Done. Local branch "%BRANCH%" now matches origin/%BRANCH% and local extras were removed.
