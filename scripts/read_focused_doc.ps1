$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "F:\Nhom3_CNPM\docs\FocusedUseCases.doc"
$txtOut = "F:\Nhom3_CNPM\scratch\focused_doc_text.txt"

try {
    Write-Output "Opening docs\FocusedUseCases.doc in Word COM..."
    # Open read-only
    $doc = $word.Documents.Open($docPath, $false, $true)
    Write-Output "Opened successfully! Paragraphs count: $($doc.Paragraphs.Count)"
    Write-Output "Tables count: $($doc.Tables.Count)"
    Write-Output "InlineShapes (Images) count: $($doc.InlineShapes.Count)"
    
    $text = $doc.Content.Text
    [System.IO.File]::WriteAllText($txtOut, $text, [System.Text.Encoding]::UTF8)
    Write-Output "Extracted text saved to $txtOut ($($text.Length) chars)"
    
    $doc.Close($false)
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
