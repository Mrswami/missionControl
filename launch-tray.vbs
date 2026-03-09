Set WshShell = CreateObject("WScript.Shell")
' 0 hides the window
WshShell.Run "npm run tray", 0, False
