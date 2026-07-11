$content = Get-Content 'src/lib/i18n-fallbacks.ts' -Raw
$pattern = '^\s+(\w+):'
$allMatches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
$keys = @{}
$dupes = @()
foreach ($m in $allMatches) {
    $key = $m.Groups[1].Value
    if ($keys.ContainsKey($key)) {
        $dupes += $key
    } else {
        $keys[$key] = 1
    }
}
Write-Host "=== Duplicates in i18n-fallbacks.ts ==="
$dupes | Sort-Object -Unique

$content2 = Get-Content 'src/lib/i18n-fallbacks-bn.ts' -Raw
$allMatches2 = [regex]::Matches($content2, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
$keys2 = @{}
$dupes2 = @()
foreach ($m in $allMatches2) {
    $key = $m.Groups[1].Value
    if ($keys2.ContainsKey($key)) {
        $dupes2 += $key
    } else {
        $keys2[$key] = 1
    }
}
Write-Host "=== Duplicates in i18n-fallbacks-bn.ts ==="
$dupes2 | Sort-Object -Unique
