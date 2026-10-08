# Monta la hoja de vistas (frontal, trasera, laterales y cara) sobre fondo blanco
# a partir de los renders con fondo transparente de ../renders.
param(
    [string]$Dir = (Join-Path $PSScriptRoot "..\renders"),
    [string]$Out = (Join-Path $PSScriptRoot "..\minifigura_xesco_vistas.png")
)
Add-Type -AssemblyName System.Drawing

$views = @(
    @{ File = "frontal.png";        Label = "Frontal" },
    @{ File = "trasera.png";        Label = "Trasera" },
    @{ File = "lado_izquierdo.png"; Label = "Lado izquierdo" },
    @{ File = "lado_derecho.png";   Label = "Lado derecho" }
)

$margin = 40; $panelW = 420; $imgW = 400; $imgH = 600; $top = 30
$W = $margin * 2 + $panelW * $views.Count
$faceW = 600; $faceH = 450
$faceTop = $top + $imgH + 80
$H = $faceTop + $faceH + 70

$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)

$guide = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(212, 212, 212)), 1
$guide.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$frame = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(150, 150, 150)), 1
$font = New-Object System.Drawing.Font "Segoe UI Semibold", 15
$ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(68, 68, 68))
$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center

# Guías horizontales: parte alta del pelo, línea de hombros y suelo (proyección de la cámara)
foreach ($f in 0.055, 0.392, 0.935) {
    $y = [int]($top + $imgH * $f)
    $g.DrawLine($guide, $margin - 15, $y, $W - $margin + 15, $y)
}

for ($i = 0; $i -lt $views.Count; $i++) {
    $x0 = $margin + $i * $panelW
    if ($i -gt 0) { $g.DrawLine($guide, $x0, $top - 10, $x0, $top + $imgH + 20) }
    $img = [System.Drawing.Image]::FromFile((Join-Path $Dir $views[$i].File))
    $g.DrawImage($img, [int]($x0 + ($panelW - $imgW) / 2), $top, $imgW, $imgH)
    $img.Dispose()
    $g.DrawString($views[$i].Label, $font, $ink, [single]($x0 + $panelW / 2), [single]($top + $imgH + 22), $center)
}

$fx = [int](($W - $faceW) / 2)
$img = [System.Drawing.Image]::FromFile((Join-Path $Dir "cara.png"))
$g.DrawImage($img, $fx, $faceTop, $faceW, $faceH)
$img.Dispose()
$g.DrawRectangle($frame, $fx, $faceTop, $faceW, $faceH)
$g.DrawString("Cara", $font, $ink, [single]($W / 2), [single]($faceTop + $faceH + 14), $center)

$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "Hoja guardada en $Out ($W x $H)"
