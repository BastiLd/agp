@echo off
setlocal

set "PROJECT=%~dp0"
set "DEVTOOLS=%PROJECT%..\DevTools"

set "NODE_HOME=%DEVTOOLS%\node"
set "GIT_HOME=%DEVTOOLS%\git"
set "GH_HOME=%DEVTOOLS%\gh"

set "PATH=%NODE_HOME%;%GIT_HOME%\cmd;%GIT_HOME%\bin;%GIT_HOME%\usr\bin;%GH_HOME%\bin;%PATH%"

echo.
echo ObbyMM portable dev environment loaded.
echo DEVTOOLS=%DEVTOOLS%
echo.

echo Checking Node...
node -v
if errorlevel 1 goto error

echo Checking npm...
call npm -v
if errorlevel 1 goto error

echo Checking npx...
call npx -v
if errorlevel 1 goto error

echo Checking Git...
git --version
if errorlevel 1 goto error

echo Checking GitHub CLI...
gh --version
if errorlevel 1 goto error

echo.
echo SUCCESS: Portable dev environment is ready.
echo.
echo Next commands you may run:
echo   gh auth login
echo   gh auth status
echo.
cmd /k
exit /b 0

:error
echo.
echo ERROR: One of the tools could not be found or failed.
echo Check these paths:
echo NODE_HOME=%NODE_HOME%
echo GIT_HOME=%GIT_HOME%
echo GH_HOME=%GH_HOME%
echo.
pause
exit /b 1
