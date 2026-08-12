@echo off
REM Doppelklick startet das Fenster zum Aktualisieren des Katalogs.
REM -NoProfile, damit ein eigenes PowerShell-Profil nichts dazwischenfunkt.
REM -ExecutionPolicy Bypass, damit es ohne Signatur laeuft — gilt nur fuer
REM diesen einen Aufruf, die Einstellung des Rechners bleibt unangetastet.
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File "%~dp0tools\AGP-Aktualisieren.ps1"
