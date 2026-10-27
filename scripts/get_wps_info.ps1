Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'wps.exe' -or $_.Name -eq 'wpspdf.exe' } | Select-Object ProcessId, Name, CommandLine | Format-List
