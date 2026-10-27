param([string]$OutDir)
Add-Type -AssemblyName System.Drawing

# Same geometry as icons/logo.svg (viewBox 128), scaled to each size.
function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $s = $size / 128.0
  $g.ScaleTransform($s, $s)

  # Rounded background with gradient
  $r = 28; $x = 4; $y = 4; $w = 120; $h = 120
  $bg = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bg.AddArc($x, $y, 2*$r, 2*$r, 180, 90)
  $bg.AddArc($x + $w - 2*$r, $y, 2*$r, 2*$r, 270, 90)
  $bg.AddArc($x + $w - 2*$r, $y + $h - 2*$r, 2*$r, 2*$r, 0, 90)
  $bg.AddArc($x, $y + $h - 2*$r, 2*$r, 2*$r, 90, 90)
  $bg.CloseFigure()
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.PointF 4, 124), (New-Object System.Drawing.PointF 124, 4),
    [System.Drawing.ColorTranslator]::FromHtml('#1E4FD6'), [System.Drawing.ColorTranslator]::FromHtml('#12B5C9'))
  $g.FillPath($brush, $bg)

  $white = [System.Drawing.Color]::White
  # Target (translucent ring); skipped at 16 px to keep it clean
  if ($size -ge 32) {
    $ring = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(153, 255, 255, 255)), 6
    $g.DrawEllipse($ring, 87, 87, 26, 26)
  }
  # Arc (quadratic M28 92 Q64 14 90 74 converted to cubic Bezier)
  $pen = New-Object System.Drawing.Pen $white, 12
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $p0 = New-Object System.Drawing.PointF 28, 92
  $c1 = New-Object System.Drawing.PointF (28 + 2/3*(64-28)), (92 + 2/3*(14-92))
  $c2 = New-Object System.Drawing.PointF (90 + 2/3*(64-90)), (74 + 2/3*(14-74))
  $p3 = New-Object System.Drawing.PointF 90, 74
  $g.DrawBezier($pen, $p0, $c1, $c2, $p3)

  # Arrowhead landing on the target
  $tri = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF 98, 92),
    (New-Object System.Drawing.PointF 102, 67),
    (New-Object System.Drawing.PointF 76, 78))
  $g.FillPolygon((New-Object System.Drawing.SolidBrush $white), $tri)
  $edge = New-Object System.Drawing.Pen $white, 4
  $edge.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $g.DrawPolygon($edge, $tri)

  # Starting point
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $white), 18, 82, 20, 20)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

foreach ($size in 16, 32, 48, 128) {
  New-Icon $size (Join-Path $OutDir "icon$size.png")
}
