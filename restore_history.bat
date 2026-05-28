@echo off
:: Restores Antigravity chat history to the current IDE
echo ===================================================
echo Restoring Antigravity Chat History to current IDE
echo ===================================================
echo.
echo CRITICAL: Please make sure that your Antigravity IDE is completely closed!
echo If the IDE is open, some history files may be locked and cannot be copied.
echo.
pause

set "SRC_DIR=C:\Users\vedik\.gemini\antigravity"
set "DST_DIR=C:\Users\vedik\.gemini\antigravity-ide"

echo.
echo Copying brain directory (conversation logs, walkthroughs, artifacts)...
if exist "%SRC_DIR%\brain" (
    robocopy "%SRC_DIR%\brain" "%DST_DIR%\brain" /E /R:3 /W:5
)

echo.
echo Copying conversations directory (conversation .pb files)...
if exist "%SRC_DIR%\conversations" (
    robocopy "%SRC_DIR%\conversations" "%DST_DIR%\conversations" /E /R:3 /W:5
)

echo.
echo Copying annotations directory...
if exist "%SRC_DIR%\annotations" (
    robocopy "%SRC_DIR%\annotations" "%DST_DIR%\annotations" /E /R:3 /W:5
)

echo.
echo Copying root history state files...
if exist "%SRC_DIR%\antigravity_state.pbtxt" (
    copy /Y "%SRC_DIR%\antigravity_state.pbtxt" "%DST_DIR%\antigravity_state.pbtxt"
)
if exist "%SRC_DIR%\agyhub_summaries_proto.pb" (
    copy /Y "%SRC_DIR%\agyhub_summaries_proto.pb" "%DST_DIR%\agyhub_summaries_proto.pb"
)

echo.
echo ===================================================
echo Restore Complete! You can now reopen the IDE.
echo ===================================================
pause
