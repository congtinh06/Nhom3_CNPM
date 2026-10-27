$filePath = "F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.docx"
$matched = @()
Get-Process | ForEach-Object {
    try {
        $p = $_
        $handles = $p.Modules
        foreach ($m in $handles) {
            if ($m.FileName -eq $filePath) {
                $matched += $p
            }
        }
    } catch {}
}
if ($matched.Count -gt 0) {
    Write-Output "Matched processes: $($matched | Select-Object -Property Id, ProcessName)"
} else {
    Write-Output "No module handles found. Checking open files..."
}
