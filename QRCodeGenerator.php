<?php
/**
 * Simple QR Code Generator
 * Generates QR codes using GD library
 */

class QRCodeGenerator {
    private $size = 200;
    private $margin = 10;
    
    /**
     * Generate QR Code image
     * @param string $data Data to encode
     * @param int $size Size of QR code (default 200px)
     * @return resource GD image resource
     */
    public function generate($data, $size = 200) {
        $this->size = $size;
        
        // For MVP, we'll use Google Charts API as fallback
        // In production, use a proper QR library like phpqrcode or endroid/qr-code
        return $this->generateViaAPI($data);
    }
    
    /**
     * Generate QR code using external API (for MVP)
     * Returns file path to saved QR code image instead of GD resource
     */
    private function generateViaAPI($data) {
        $url = 'https://api.qrserver.com/v1/create-qr-code/?size=' . $this->size . 'x' . $this->size . '&data=' . urlencode($data);
        
        // Download QR code image
        $imageData = @file_get_contents($url);
        
        if ($imageData === false || empty($imageData)) {
            // Return placeholder instead
            return $this->createPlaceholder();
        }
        
        // Save to temp directory
        $tempDir = defined('TEMP_DIR') ? TEMP_DIR : sys_get_temp_dir() . '/';
        $filename = 'qr_api_' . uniqid() . '.png';
        $filepath = $tempDir . $filename;
        
        if (@file_put_contents($filepath, $imageData)) {
            // Return GD image resource from saved file
            if (function_exists('imagecreatefrompng')) {
                $image = @imagecreatefrompng($filepath);
                if ($image) {
                    return $image;
                }
            }
        }
        
        // Fallback to placeholder
        return $this->createPlaceholder();
    }
    
    /**
     * Create a placeholder QR code image
     */
    private function createPlaceholder() {
        // Check if GD functions are available
        if (!function_exists('imagecreatetruecolor')) {
            // Return null if GD not available - caller should handle
            throw new Exception('GD library not available');
        }
        
        $img = imagecreatetruecolor($this->size, $this->size);
        
        // White background
        $white = imagecolorallocate($img, 255, 255, 255);
        $black = imagecolorallocate($img, 0, 0, 0);
        
        imagefill($img, 0, 0, $white);
        
        // Draw border
        imagerectangle($img, 5, 5, $this->size - 6, $this->size - 6, $black);
        
        // Draw "QR" text
        $text = "QR";
        $fontSize = 5;
        $textWidth = imagefontwidth($fontSize) * strlen($text);
        $textHeight = imagefontheight($fontSize);
        $x = ($this->size - $textWidth) / 2;
        $y = ($this->size - $textHeight) / 2;
        
        imagestring($img, $fontSize, $x, $y, $text, $black);
        
        return $img;
    }
}
