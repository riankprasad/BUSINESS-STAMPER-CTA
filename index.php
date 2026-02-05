<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Stamp & QR Generator</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📸 Image Stamp & QR Generator</h1>
            <p class="subtitle">Professional product stamping tool for businesses</p>
        </header>

        <div class="main-content">
            <!-- LEFT PANEL: Controls -->
            <div class="left-panel">
                <div class="panel-section">
                    <h3>📁 Image Upload</h3>
                    <label>
                        <input type="checkbox" id="batchMode"> Batch Mode (Multiple Images)
                    </label>
                    <input type="file" id="imageUpload" accept="image/jpeg,image/png,image/jpg">
                    <div id="uploadPreview" class="upload-preview"></div>
                    <div id="batchQueue" class="batch-queue" style="display:none;">
                        <h4>Batch Queue (<span id="batchCount">0</span> images)</h4>
                        <div id="batchList" class="batch-list"></div>
                        <button id="clearBatch" class="btn-secondary" style="width: 100%; margin-top: 10px;">Clear All</button>
                    </div>
                </div>

                <div class="panel-section">
                    <h3>🏢 Brand Information</h3>
                    <label>Brand/Business Name:</label>
                    <input type="text" id="brandName" placeholder="e.g., Nike Store">
                    
                    <label>Brand Prefix (for ID):</label>
                    <input type="text" id="brandPrefix" placeholder="e.g., NTK" maxlength="10">
                    
                    <label>Unique ID:</label>
                    <div class="input-group">
                        <input type="text" id="uniqueId" readonly placeholder="Auto-generated">
                        <button id="generateId" class="btn-small">Generate</button>
                    </div>
                </div>

                <div class="panel-section">
                    <h3>💰 Product Details</h3>
                    <label>Price:</label>
                    <input type="text" id="price" placeholder="e.g., $99.99">
                    
                    <label>Offer/Promo Text:</label>
                    <textarea id="offerText" rows="2" placeholder="e.g., 20% OFF - Limited Time!"></textarea>
                </div>

                <div class="panel-section">
                    <h3>📱 QR Code Settings</h3>
                    <label>
                        <input type="checkbox" id="showQr" checked> Show QR Code
                    </label>
                    
                    <label>QR Code Size:</label>
                    <div class="slider-control">
                        <input type="range" id="qrSizeSlider" min="50" max="300" value="120">
                        <input type="number" id="qrSize" value="120" min="50" max="300" class="slider-input">
                        <span class="unit">px</span>
                    </div>
                    
                    <label>QR Action Type:</label>
                    <select id="qrType">
                        <option value="whatsapp">WhatsApp Chat</option>
                        <option value="phone">Phone Call</option>
                        <option value="url">External URL</option>
                    </select>
                    
                    <label>Phone Number (for WhatsApp):</label>
                    <input type="text" id="phoneNumber" placeholder="e.g., 1234567890">
                    
                    <label>WhatsApp Message Template:</label>
                    <textarea id="whatsappMessage" rows="2" placeholder="Hi! I'm interested in product {{UNIQUE_ID}}"></textarea>
                    
                    <label>URL (for External Link):</label>
                    <input type="text" id="qrUrl" placeholder="https://yoursite.com">
                </div>

                <div class="panel-section">
                    <h3>🎨 Stamp Styling</h3>
                    <label>
                        <input type="checkbox" id="enableDrag" checked> Enable Drag to Reposition
                    </label>
                    
                    <label>Font Size:</label>
                    <div class="slider-control">
                        <input type="range" id="fontSizeSlider" min="8" max="72" value="16">
                        <input type="number" id="fontSize" value="16" min="8" max="72" class="slider-input">
                        <span class="unit">px</span>
                    </div>
                    
                    <label>Text Color:</label>
                    <input type="color" id="textColor" value="#ffffff">
                    
                    <label>Background Color:</label>
                    <input type="color" id="bgColor" value="#000000">
                    
                    <label>Opacity:</label>
                    <input type="range" id="opacity" min="0" max="100" value="80">
                    <span id="opacityValue">80%</span>
                    
                    <label>Padding:</label>
                    <input type="number" id="padding" value="20" min="0" max="100">
                    
                    <label>Rotation (degrees):</label>
                    <input type="number" id="rotation" value="0" min="-180" max="180">
                    
                    <label>Alignment:</label>
                    <select id="alignment">
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right" selected>Bottom Right</option>
                        <option value="center">Center</option>
                    </select>
                </div>

                <div class="panel-section">
                    <h3>💾 Preset Management</h3>
                    <button id="savePreset" class="btn-primary">💾 Save Preset</button>
                    <label class="file-input-label">
                        📂 Load Preset
                        <input type="file" id="loadPreset" accept=".json" style="display:none;">
                    </label>
                </div>
            </div>

            <!-- RIGHT PANEL: Preview -->
            <div class="right-panel">
                <div class="preview-section">
                    <h3>👁️ Live Preview</h3>
                    <div class="canvas-container">
                        <canvas id="previewCanvas"></canvas>
                    </div>
                    <div class="preview-controls">
                        <button id="downloadImage" class="btn-success">⬇️ Download Stamped Image</button>
                        <button id="downloadBatch" class="btn-success" style="display:none;">⬇️ Download All Images (ZIP)</button>
                        <button id="refreshPreview" class="btn-secondary">🔄 Refresh Preview</button>
                        <button id="resetPosition" class="btn-secondary">📍 Reset Position</button>
                    </div>
                    <div id="batchProgress" class="batch-progress" style="display:none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <p id="progressText">Processing: 0/0</p>
                    </div>
                    <div id="statusMessage" class="status-message"></div>
                    <div class="drag-hint">💡 Tip: Click and drag the stamp to reposition it</div>
                </div>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
