$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "F:\Nhom3_CNPM\Bao_cao_Chuong_3_Da_Chinh_Sua.docx"
$pdfPath = "F:\Nhom3_CNPM\Bao_cao_Chuong_3_Da_Chinh_Sua.pdf"

try {
    Write-Output "Opening Chapter 3 Edited document in Word COM automation: $docPath ..."
    $doc = $word.Documents.Open($docPath)
    
    Write-Output "Updating all document fields and Tables of Contents..."
    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
    }
    $doc.Fields.Update()
    $doc.Save()
    
    Write-Output "Exporting to PDF format: $pdfPath ..."
    $doc.SaveAs([ref]$pdfPath, [ref]17) # 17 = wdExportFormatPDF
    
    $pageCount = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    $wordCount = $doc.ComputeStatistics(0) # 0 = wdStatisticWords
    $charCount = $doc.ComputeStatistics(3) # 3 = wdStatisticCharacters
    $tableCount = $doc.Tables.Count
    $shapeCount = $doc.InlineShapes.Count
    
    Write-Output "=================================================="
    Write-Output "WORD AUTOMATION REPORT FOR CHAPTER 3 EDITED:"
    Write-Output "PDF Export Succeeded: $pdfPath"
    Write-Output "PAGE_COUNT: $pageCount"
    Write-Output "WORD_COUNT: $wordCount"
    Write-Output "CHAR_COUNT: $charCount"
    Write-Output "TABLE_COUNT: $tableCount"
    Write-Output "FIGURE_COUNT: $shapeCount"
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
