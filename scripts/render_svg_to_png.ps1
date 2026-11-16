param([Parameter(Mandatory=$true)][string]$SvgPath,[Parameter(Mandatory=$true)][string]$PngPath,[int]$Scale=1)
Add-Type -AssemblyName System.Drawing
[xml]$svg = Get-Content -LiteralPath $SvgPath -Raw -Encoding UTF8
$root = $svg.DocumentElement
$w = [int]$root.GetAttribute('width') * $Scale
$h = [int]$root.GetAttribute('height') * $Scale
$bmp = [System.Drawing.Bitmap]::new($w,$h,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)
$scaleTransform = [System.Drawing.Drawing2D.Matrix]::new()
$scaleTransform.Scale($Scale,$Scale)
$g.Transform = $scaleTransform
$blue = [System.Drawing.Color]::FromArgb(38,55,74)
$ovalColor = [System.Drawing.Color]::FromArgb(54,83,110)
$linkColor = [System.Drawing.Color]::FromArgb(82,101,122)
$bandColor = [System.Drawing.Color]::FromArgb(246,248,250)
$borderColor = [System.Drawing.Color]::FromArgb(154,169,184)
$fontFamily = [System.Drawing.FontFamily]::new('Arial')
$fontFor = { param($node)
  $sz = 22.0; $style = [System.Drawing.FontStyle]::Regular
  $cls = $node.GetAttribute('class')
  if ($cls -eq 'title') { $sz=38; $style=[System.Drawing.FontStyle]::Bold }
  elseif ($cls -eq 'band-title') { $sz=25; $style=[System.Drawing.FontStyle]::Bold }
  elseif ($cls -eq 'small') { $sz=20 }
  elseif ($cls -eq 'note') { $sz=19; $style=[System.Drawing.FontStyle]::Italic }
  if ($node.HasAttribute('font-size')) { $sz=[double]$node.GetAttribute('font-size') }
  if ($node.GetAttribute('font-weight') -eq '700' -or $node.GetAttribute('font-weight') -eq 'bold') { $style=[System.Drawing.FontStyle]::Bold }
  if ($node.GetAttribute('font-style') -eq 'italic') { $style=[System.Drawing.FontStyle]::Italic }
  return [System.Drawing.Font]::new($fontFamily,$sz,$style,[System.Drawing.GraphicsUnit]::Pixel)
}
$drawPath = { param($data,$dashed,$color)
  $tokens = [regex]::Matches($data,'[MLHVmlhv]|-?\d+(?:\.\d+)?') | ForEach-Object Value
  $i=0; $cmd=''; $x=0.0; $y=0.0; $prev=$null
  $pen=[System.Drawing.Pen]::new($color,2.5)
  if($dashed){$pen.DashStyle=[System.Drawing.Drawing2D.DashStyle]::Dash}
  while($i -lt $tokens.Count){
    if($tokens[$i] -match '^[MLHVmlhv]$'){ $cmd=$tokens[$i]; $i++; continue }
    switch -Regex ($cmd) {
      '^[Mm]$' { $a=[double]$tokens[$i++]; $b=[double]$tokens[$i++]; if($cmd -eq 'm'){$x+=$a;$y+=$b}else{$x=$a;$y=$b}; $prev=[System.Drawing.PointF]::new([single]$x,[single]$y); $cmd=if($cmd -eq 'm'){'l'}else{'L'}; break }
      '^[Ll]$' { $a=[double]$tokens[$i++]; $b=[double]$tokens[$i++]; if($cmd -eq 'l'){$nx=$x+$a;$ny=$y+$b}else{$nx=$a;$ny=$b}; $next=[System.Drawing.PointF]::new([single]$nx,[single]$ny); if($prev){$g.DrawLine($pen,$prev,$next)}; $x=$nx;$y=$ny;$prev=$next; break }
      '^[Hh]$' { $a=[double]$tokens[$i++]; $nx=if($cmd -eq 'h'){$x+$a}else{$a}; $next=[System.Drawing.PointF]::new([single]$nx,[single]$y); if($prev){$g.DrawLine($pen,$prev,$next)}; $x=$nx;$prev=$next; break }
      '^[Vv]$' { $a=[double]$tokens[$i++]; $ny=if($cmd -eq 'v'){$y+$a}else{$a}; $next=[System.Drawing.PointF]::new([single]$x,[single]$ny); if($prev){$g.DrawLine($pen,$prev,$next)}; $y=$ny;$prev=$next; break }
    }
  }
  $pen.Dispose()
}
$elements = @($root.ChildNodes | Where-Object { $_.NodeType -eq [System.Xml.XmlNodeType]::Element })
# Draw associations first so they stay behind the UML shapes.
foreach($node in $root.SelectNodes('.//*[local-name()="path"]')){
  $cls=$node.GetAttribute('class')
  if($cls -match 'actor'){continue}
  $color=$linkColor
  & $drawPath $node.GetAttribute('d') ($cls -match 'dashed') $color
}
# Draw boundary, packages, use-case ellipses and actor heads.
foreach($node in $root.SelectNodes('.//*[local-name()="rect" or local-name()="ellipse" or local-name()="circle"]')){
  $tag=$node.LocalName; $x=[single]([double]$node.GetAttribute('x')); $y=[single]([double]$node.GetAttribute('y'))
  if($tag -eq 'rect'){
    $rw=[single]([double]$node.GetAttribute('width')); $rh=[single]([double]$node.GetAttribute('height')); $cls=$node.GetAttribute('class')
    $fill=[System.Drawing.Color]::White; $stroke=$blue; $sw=3.0
    if($cls -eq 'band'){$fill=$bandColor;$stroke=$borderColor;$sw=2.0}
    $brush=[System.Drawing.SolidBrush]::new($fill); $pen=[System.Drawing.Pen]::new($stroke,$sw)
    $g.FillRectangle($brush,$x,$y,$rw,$rh);$g.DrawRectangle($pen,$x,$y,$rw,$rh);$brush.Dispose();$pen.Dispose()
  } else {
    if($tag -eq 'circle'){
      $rx=[single]([double]$node.GetAttribute('r')); $ew=2*$rx; $eh=2*$rx
      $x=[single]([double]$node.GetAttribute('cx')-$rx); $y=[single]([double]$node.GetAttribute('cy')-$rx)
    } else {
      $ew=[single]([double]$node.GetAttribute('rx')*2); $eh=[single]([double]$node.GetAttribute('ry')*2)
      $x=[single]([double]$node.GetAttribute('cx')-[double]$node.GetAttribute('rx')); $y=[single]([double]$node.GetAttribute('cy')-[double]$node.GetAttribute('ry'))
    }
    $fill=[System.Drawing.Color]::White;$stroke=$ovalColor;$sw=3.0
    if($tag -eq 'circle'){$stroke=$blue}
    $brush=[System.Drawing.SolidBrush]::new($fill);$pen=[System.Drawing.Pen]::new($stroke,$sw)
    $g.FillEllipse($brush,$x,$y,$ew,$eh);$g.DrawEllipse($pen,$x,$y,$ew,$eh);$brush.Dispose();$pen.Dispose()
  }
}
# Draw standard UML stick-figure limbs from each actor's head position.
$actorPen=[System.Drawing.Pen]::new($blue,3.0)
foreach($group in $root.SelectNodes('.//*[local-name()="g" and @class="actor"]')){
  $head=$group.SelectSingleNode('./*[local-name()="circle"]'); if(-not $head){continue}
  $cx=[single]([double]$head.GetAttribute('cx')); $hy=[single]([double]$head.GetAttribute('cy')); $mid=$hy+48
  $g.DrawLine($actorPen,$cx,$hy+18,$cx,$mid+25)
  $g.DrawLine($actorPen,$cx-29,$mid-8,$cx+29,$mid-8)
  $g.DrawLine($actorPen,$cx,$mid+25,$cx-27,$mid+63)
  $g.DrawLine($actorPen,$cx,$mid+25,$cx+27,$mid+63)
}
$actorPen.Dispose()
# Draw all labels with matching SVG anchors and font weights.
foreach($node in $root.SelectNodes('.//*[local-name()="text"]')){
  $value=$node.InnerText; if([string]::IsNullOrWhiteSpace($value)){continue}
  $font=& $fontFor $node; $brush=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(23,37,54))
  $x=[single]([double]$node.GetAttribute('x'));$y=[single]([double]$node.GetAttribute('y'))
  $size=$g.MeasureString($value,$font);$anchor=$node.GetAttribute('text-anchor')
  if($anchor -eq 'middle'){$x-=$size.Width/2}elseif($anchor -eq 'end'){$x-=$size.Width}
  $g.DrawString($value,$font,$brush,$x,$y-$size.Height*0.78)
  $font.Dispose();$brush.Dispose()
}
$bmp.Save($PngPath,[System.Drawing.Imaging.ImageFormat]::Png)
$fontFamily.Dispose();$g.Dispose();$bmp.Dispose()
