<?php
// Test font rendering
$fontSize = 16;
$text = "Nike Store";
$font = __DIR__ . '/fonts/Arial.ttf';

if (file_exists($font)) {
    $bbox = imagettfbbox($fontSize, 0, $font, $text);
    $width = abs($bbox[4] - $bbox[0]);
    echo "TTF Font test:\n";
    echo "Text: '$text'\n";
    echo "Font size: $fontSize\n";
    echo "Calculated width: $width\n";
    echo "Bbox: " . json_encode($bbox) . "\n";
} else {
    echo "Font not found: $font\n";
}

// Canvas would measure approximately: strlen * (fontSize * 0.55) for Arial
$canvasEstimate = strlen($text) * ($fontSize * 0.55);
echo "\nCanvas estimate: $canvasEstimate\n";
echo "Ratio: " . ($width / $canvasEstimate) . "\n";
