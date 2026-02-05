<?php
/**
 * Image Stamp & QR Generator - API Endpoints
 * Handles: ID generation, image processing, QR code generation
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load QR Code library
require_once 'QRCodeGenerator.php';

// Configuration
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('TEMP_DIR', __DIR__ . '/temp/');
define('FONT_DIR', __DIR__ . '/fonts/');
define('DEFAULT_FONT', FONT_DIR . 'arial.ttf');

// Create necessary directories
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0777, true);
if (!is_dir(TEMP_DIR)) mkdir(TEMP_DIR, 0777, true);
if (!is_dir(FONT_DIR)) mkdir(FONT_DIR, 0777, true);

// Clean up old files (older than 1 hour)
cleanupOldFiles(TEMP_DIR, 3600);
cleanupOldFiles(UPLOAD_DIR, 3600);

// Route handler
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'generateId':
        generateUniqueId();
        break;
    
    case 'generateQR':
        generateQRCode();
        break;
    
    case 'stampImage':
        stampImage();
        break;
    
    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}

/**
 * Generate Unique ID
 * Format: <PREFIX>-<BASE36_TIMESTAMP>-<RANDOM>
 */
function generateUniqueId() {
    $prefix = $_POST['prefix'] ?? 'PRD';
    $prefix = strtoupper(preg_replace('/[^A-Z0-9]/', '', $prefix));
    
    // Base36 timestamp (more compact)
    $timestamp = base_convert(time(), 10, 36);
    
    // Random string (4 chars, alphanumeric)
    $random = substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 4);
    
    $uniqueId = "{$prefix}-{$timestamp}-{$random}";
    
    jsonResponse([
        'success' => true,
        'unique_id' => $uniqueId
    ]);
}

/**
 * Generate QR Code
 */
function generateQRCode() {
    try {
        error_log("=== Generate QR Code Request ===");
        
        $type = $_POST['type'] ?? 'whatsapp';
        $data = $_POST['data'] ?? '';
        $uniqueId = $_POST['uniqueId'] ?? '';
        
        error_log("QR Type: {$type}, Data: {$data}, UniqueID: {$uniqueId}");
        
        if (empty($data)) {
            error_log("No data provided for QR generation");
            jsonResponse(['error' => 'No data provided'], 400);
        }
        
        // Replace placeholder
        $data = str_replace('{{UNIQUE_ID}}', $uniqueId, $data);
        error_log("QR Data after replacement: {$data}");
        
        // Use QR code API directly - download and save
        $qrSize = intval($_POST['qrSize'] ?? 200);
        $url = 'https://api.qrserver.com/v1/create-qr-code/?size=' . $qrSize . 'x' . $qrSize . '&data=' . urlencode($data);
        
        error_log("Fetching QR from: {$url}");
        
        // Download QR code
        $imageData = @file_get_contents($url);
        
        if ($imageData === false || empty($imageData)) {
            error_log("Failed to fetch QR code from API");
            jsonResponse(['error' => 'Failed to generate QR code'], 500);
        }
        
        // Save directly to temp file
        $filename = 'qr_' . uniqid() . '.png';
        $filepath = TEMP_DIR . $filename;
        
        if (!@file_put_contents($filepath, $imageData)) {
            error_log("Failed to save QR image to: {$filepath}");
            jsonResponse(['error' => 'Failed to save QR code'], 500);
        }
        
        error_log("QR code saved successfully: {$filepath}");
        
        jsonResponse([
            'success' => true,
            'qr_url' => 'temp/' . $filename
        ]);
        
    } catch (Exception $e) {
        error_log("Exception in generateQRCode: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        jsonResponse(['error' => $e->getMessage()], 500);
    } catch (Error $e) {
        error_log("Error in generateQRCode: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        jsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
}

/**
 * Stamp Image
 */
function stampImage() {
    try {
        // Log request
        error_log("=== Stamp Image Request received ===");
        
        // Get form data
        $configJson = $_POST['config'] ?? '{}';
        error_log("Config JSON: " . $configJson);
        
        $config = json_decode($configJson, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON decode error: " . json_last_error_msg());
            jsonResponse(['error' => 'Invalid config JSON: ' . json_last_error_msg()], 400);
        }
        
        error_log("Config parsed successfully");
        error_log("Files: " . print_r($_FILES, true));
        
        if (!isset($_FILES['image'])) {
            error_log("No image uploaded in request");
            jsonResponse(['error' => 'No image uploaded'], 400);
        }
        
        $file = $_FILES['image'];
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log("Upload error: " . $file['error']);
            jsonResponse(['error' => 'Image upload failed: ' . $file['error']], 400);
        }
        
        // Validate image
        $imageInfo = getimagesize($file['tmp_name']);
        if (!$imageInfo) {
            error_log("Invalid image file");
            jsonResponse(['error' => 'Invalid image file'], 400);
        }
        
        error_log("Processing image: " . $file['name'] . " (" . $imageInfo[0] . "x" . $imageInfo[1] . ")");
        
        // Load image
        $sourceImage = loadImage($file['tmp_name'], $imageInfo['mime']);
        if (!$sourceImage) {
            error_log("Unable to load image");
            jsonResponse(['error' => 'Unable to load image'], 500);
        }
        
        // Get image dimensions
        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);
        
        error_log("Image dimensions: {$width}x{$height}");
        error_log("Creating stamp with config...");
        
        // Create stamp
        $stampImage = createStamp($config, $width, $height);
        
        if (!$stampImage) {
            error_log("Failed to create stamp image");
            jsonResponse(['error' => 'Failed to create stamp'], 500);
        }
        
        error_log("Stamp created successfully");
        
        // Calculate position (use custom position if provided)
        if (isset($config['customPosition']) && $config['customPosition'] && isset($config['stampPosition'])) {
            $position = [
                'x' => max(0, min($config['stampPosition']['x'], $width - imagesx($stampImage))),
                'y' => max(0, min($config['stampPosition']['y'], $height - imagesy($stampImage)))
            ];
        } else {
            $position = calculatePosition($config['alignment'] ?? 'bottom-right', $width, $height, imagesx($stampImage), imagesy($stampImage));
        }
        
        // Merge stamp onto source image
        imagecopy($sourceImage, $stampImage, $position['x'], $position['y'], 0, 0, imagesx($stampImage), imagesy($stampImage));
        imagedestroy($stampImage);
        
        // Save stamped image
        $uniqueId = $config['uniqueId'] ?? 'STAMPED';
        $filename = $uniqueId . '.png';
        $filepath = TEMP_DIR . $filename;
        
        imagepng($sourceImage, $filepath, 9);
        imagedestroy($sourceImage);
        
        error_log("Image saved successfully: " . $filepath);
        
        jsonResponse([
            'success' => true,
            'image_url' => 'temp/' . $filename,
            'filename' => $filename
        ]);
        
    } catch (Exception $e) {
        error_log("Exception in stampImage: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        jsonResponse(['error' => $e->getMessage()], 500);
    }
}

/**
 * Create stamp image based on configuration
 */
function createStamp($config, $maxWidth, $maxHeight) {
    try {
        error_log("createStamp called with config: " . print_r($config, true));
        
        $fontSize = intval($config['fontSize'] ?? 16);
        $textColor = $config['textColor'] ?? '#ffffff';
        $bgColor = $config['bgColor'] ?? '#000000';
        $opacity = intval($config['opacity'] ?? 80);
        $padding = intval($config['padding'] ?? 20);
        $rotation = intval($config['rotation'] ?? 0);
        $qrSize = intval($config['qrSize'] ?? 120);
        
        $brandName = $config['brandName'] ?? '';
        $uniqueId = $config['uniqueId'] ?? '';
        $price = $config['price'] ?? '';
        $offerText = $config['offerText'] ?? '';
        $showQr = $config['showQr'] ?? false;
        $qrData = $config['qrData'] ?? '';
        
        error_log("Stamp parameters: fontSize={$fontSize}, qrSize={$qrSize}, showQr=" . ($showQr ? 'true' : 'false'));
    
    // Font file
    $font = DEFAULT_FONT;
    if (!file_exists($font)) {
        // Use built-in font if TTF not available
        $font = null;
    }
    
    // Build text lines
    $lines = [];
    if ($brandName) $lines[] = $brandName;
    if ($uniqueId) $lines[] = "ID: $uniqueId";
    if ($price) $lines[] = "Price: $price";
    if ($offerText) $lines[] = $offerText;
    
    // Calculate dimensions
    $lineHeight = $fontSize + 8;
    $textWidth = 0;
    
    foreach ($lines as $line) {
        if ($font) {
            $bbox = imagettfbbox($fontSize, 0, $font, $line);
            $lineWidth = abs($bbox[4] - $bbox[0]);
        } else {
            $lineWidth = strlen($line) * ($fontSize * 0.6);
        }
        $textWidth = max($textWidth, $lineWidth);
    }
    
    $stampWidth = $textWidth + $padding * 2 + ($showQr ? $qrSize + $padding : 0);
    $textHeight = count($lines) * $lineHeight;
    $stampHeight = max($textHeight + $padding * 2, $showQr ? $qrSize + $padding * 2 : 0);
    
    // Create stamp image
    $stamp = imagecreatetruecolor($stampWidth, $stampHeight);
    imagesavealpha($stamp, true);
    
    // Background color with opacity
    list($r, $g, $b) = hexToRgb($bgColor);
    $alpha = intval((100 - $opacity) * 1.27);
    $bgColorAlpha = imagecolorallocatealpha($stamp, $r, $g, $b, $alpha);
    imagefill($stamp, 0, 0, $bgColorAlpha);
    
    // Text color
    list($r, $g, $b) = hexToRgb($textColor);
    $textColorRgb = imagecolorallocate($stamp, $r, $g, $b);
    
    // Draw text
    $y = $padding + $fontSize;
    foreach ($lines as $line) {
        if ($font) {
            imagettftext($stamp, $fontSize, 0, $padding, $y, $textColorRgb, $font, $line);
        } else {
            imagestring($stamp, 5, $padding, $y - $fontSize, $line, $textColorRgb);
        }
        $y += $lineHeight;
    }
    
    // Add QR code if enabled
    if ($showQr && $qrData) {
        error_log("Attempting to add QR code: " . substr($qrData, 0, 50) . "...");
        try {
            // Generate or fetch QR code
            $qrSize = intval($config['qrSize'] ?? 120);
            $qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=' . $qrSize . 'x' . $qrSize . '&data=' . urlencode($qrData);
            
            $qrImageData = @file_get_contents($qrUrl);
            
            if ($qrImageData) {
                // Save to temp file and load
                $tempFile = TEMP_DIR . 'qr_temp_' . uniqid() . '.png';
                file_put_contents($tempFile, $qrImageData);
                $qrImage = @imagecreatefrompng($tempFile);
                @unlink($tempFile);
                
                if ($qrImage) {
                    error_log("QR image created, adding to stamp");
                    // Position QR on the right side
                    $qrX = $stampWidth - $qrSize - $padding;
                    $qrY = $padding;
                    
                    // Draw white background for QR
                    $white = imagecolorallocate($stamp, 255, 255, 255);
                    imagefilledrectangle($stamp, $qrX, $qrY, $qrX + $qrSize, $qrY + $qrSize, $white);
                    
                    // Copy QR code
                    imagecopyresampled($stamp, $qrImage, $qrX, $qrY, 0, 0, $qrSize, $qrSize, imagesx($qrImage), imagesy($qrImage));
                    imagedestroy($qrImage);
                    error_log("QR code successfully added to stamp");
                } else {
                    error_log("Failed to create QR image from PNG");
                }
            } else {
                error_log("Failed to fetch QR code from API");
            }
        } catch (Exception $e) {
            error_log("QR generation exception: " . $e->getMessage());
            // QR generation failed, continue without it
        }
    }
    
    // Apply rotation if needed
    if ($rotation != 0) {
        $transparent = imagecolorallocatealpha($stamp, 0, 0, 0, 127);
        $stamp = imagerotate($stamp, -$rotation, $transparent);
        imagesavealpha($stamp, true);
    }
    
    error_log("Stamp created successfully, returning");
    return $stamp;
    
    } catch (Exception $e) {
        error_log("Error in createStamp: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        throw $e;
    }
}

/**
 * Calculate stamp position based on alignment
 */
function calculatePosition($alignment, $imgWidth, $imgHeight, $stampWidth, $stampHeight) {
    $margin = 20;
    
    switch ($alignment) {
        case 'top-left':
            return ['x' => $margin, 'y' => $margin];
        
        case 'top-right':
            return ['x' => $imgWidth - $stampWidth - $margin, 'y' => $margin];
        
        case 'bottom-left':
            return ['x' => $margin, 'y' => $imgHeight - $stampHeight - $margin];
        
        case 'bottom-right':
            return ['x' => $imgWidth - $stampWidth - $margin, 'y' => $imgHeight - $stampHeight - $margin];
        
        case 'center':
            return [
                'x' => ($imgWidth - $stampWidth) / 2,
                'y' => ($imgHeight - $stampHeight) / 2
            ];
        
        default:
            return ['x' => $margin, 'y' => $margin];
    }
}

/**
 * Load image from file
 */
function loadImage($filepath, $mime) {
    switch ($mime) {
        case 'image/jpeg':
        case 'image/jpg':
            return imagecreatefromjpeg($filepath);
        
        case 'image/png':
            return imagecreatefrompng($filepath);
        
        case 'image/gif':
            return imagecreatefromgif($filepath);
        
        default:
            return false;
    }
}

/**
 * Convert hex color to RGB
 */
function hexToRgb($hex) {
    $hex = ltrim($hex, '#');
    return [
        hexdec(substr($hex, 0, 2)),
        hexdec(substr($hex, 2, 2)),
        hexdec(substr($hex, 4, 2))
    ];
}

/**
 * Clean up old files
 */
function cleanupOldFiles($dir, $maxAge) {
    if (!is_dir($dir)) return;
    
    $files = glob($dir . '*');
    $now = time();
    
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file)) > $maxAge) {
            @unlink($file);
        }
    }
}

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}
