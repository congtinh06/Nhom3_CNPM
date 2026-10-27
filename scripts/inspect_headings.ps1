$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.docx')
$results = @()

foreach ($p in $doc.Paragraphs) {
    $txt = $p.Range.Text.Trim()
    if ($txt -match "^CHƯƠNG" -or $txt -match "^[12]\.[0-9]+" -or $txt -match "^MỤC LỤC" -or $txt -match "^DANH MỤC") {
        $page = $p.Range.Information(3) # 3 = wdActiveEndPageNumber
        $results += [PSCustomObject]@{
            Page = $page
            Title = $txt
        }
    }
}
$doc.Close([ref]$false)
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
$results | Format-Table -AutoSize
