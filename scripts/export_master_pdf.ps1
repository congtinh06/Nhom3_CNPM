$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$docPath = "F:\Nhom3_CNPM\Bao_cao_Tong_Hop_Chuong_1_2_3_4.docx"
$pdfPath = "F:\Nhom3_CNPM\Bao_cao_Tong_Hop_Chuong_1_2_3_4.pdf"

Write-Output "Opening Master Document in Word COM automation: $docPath ..."
try {
    $doc = $word.Documents.Open($docPath)
    Write-Output "Document opened. Total paragraphs: $($doc.Paragraphs.Count)"
    
    Write-Output "Updating all Tables of Contents..."
    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
    }
    
    Write-Output "Exporting to PDF format: $pdfPath ..."
    $doc.SaveAs([ref]$pdfPath, [ref]17) # 17 = wdExportFormatPDF
    
    $pageCount = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    $wordCount = $doc.ComputeStatistics(0) # 0 = wdStatisticWords
    
    Write-Output "=================================================="
    Write-Output "MASTER REPORT PDF EXPORT SUCCEEDED!"
    Write-Output "PDF Path: $pdfPath"
    Write-Output "PAGE_COUNT: $pageCount"
    Write-Output "WORD_COUNT: $wordCount"
    Write-Output "=================================================="
    
    $doc.Close([ref]$false)
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
