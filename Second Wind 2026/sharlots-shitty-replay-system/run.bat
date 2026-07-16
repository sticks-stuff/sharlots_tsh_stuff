@echo off
setlocal

python "%~dp0replay.py" --json %*
exit /b %ERRORLEVEL%
