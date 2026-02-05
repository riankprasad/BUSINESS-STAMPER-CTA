/**
 * Image Stamp & QR Generator - Frontend JavaScript
 */

// Global state
let state = {
    uploadedImage: null,
    imageFile: null,
    uniqueId: '',
    stampPosition: null, // null means use alignment
    customPosition: false, // whether user has manually positioned
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    stampBounds: null,
    qrImage: null,
    animationFrameId: null, // For smooth drag updates
    pendingUpdate: false, // Flag to prevent multiple simultaneous updates
    batchMode: false,
    batchImages: [], // Array of {file, image, processed}
    currentBatchIndex: 0
};

// DOM Elements
const elements = {
    imageUpload: document.getElementById('imageUpload'),
    uploadPreview: document.getElementById('uploadPreview'),
    batchMode: document.getElementById('batchMode'),
    batchQueue: document.getElementById('batchQueue'),
    batchList: document.getElementById('batchList'),
    batchCount: document.getElementById('batchCount'),
    clearBatch: document.getElementById('clearBatch'),
    downloadBatch: document.getElementById('downloadBatch'),
    batchProgress: document.getElementById('batchProgress'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    brandName: document.getElementById('brandName'),
    brandPrefix: document.getElementById('brandPrefix'),
    uniqueId: document.getElementById('uniqueId'),
    generateId: document.getElementById('generateId'),
    price: document.getElementById('price'),
    offerText: document.getElementById('offerText'),
    showQr: document.getElementById('showQr'),
    qrSize: document.getElementById('qrSize'),
    qrSizeSlider: document.getElementById('qrSizeSlider'),
    qrType: document.getElementById('qrType'),
    phoneNumber: document.getElementById('phoneNumber'),
    whatsappMessage: document.getElementById('whatsappMessage'),
    qrUrl: document.getElementById('qrUrl'),
    fontSize: document.getElementById('fontSize'),
    fontSizeSlider: document.getElementById('fontSizeSlider'),
    textColor: document.getElementById('textColor'),
    bgColor: document.getElementById('bgColor'),
    opacity: document.getElementById('opacity'),
    opacityValue: document.getElementById('opacityValue'),
    padding: document.getElementById('padding'),
    rotation: document.getElementById('rotation'),
    alignment: document.getElementById('alignment'),
    enableDrag: document.getElementById('enableDrag'),
    previewCanvas: document.getElementById('previewCanvas'),
    downloadImage: document.getElementById('downloadImage'),
    refreshPreview: document.getElementById('refreshPreview'),
    resetPosition: document.getElementById('resetPosition'),
    savePreset: document.getElementById('savePreset'),
    loadPreset: document.getElementById('loadPreset'),
    statusMessage: document.getElementById('statusMessage')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Event listeners
    elements.imageUpload.addEventListener('change', handleImageUpload);
    elements.batchMode.addEventListener('change', handleBatchModeToggle);
    elements.clearBatch.addEventListener('click', clearBatchQueue);
    elements.downloadBatch.addEventListener('click', downloadBatchImages);
    elements.generateId.addEventListener('click', generateUniqueId);
    elements.downloadImage.addEventListener('click', downloadStampedImage);
    elements.refreshPreview.addEventListener('click', updatePreview);
    elements.resetPosition.addEventListener('click', resetStampPosition);
    elements.savePreset.addEventListener('click', savePreset);
    elements.loadPreset.addEventListener('change', loadPreset);
    
    // Canvas drag events
    elements.previewCanvas.addEventListener('mousedown', handleMouseDown);
    elements.previewCanvas.addEventListener('mousemove', handleMouseMove);
    elements.previewCanvas.addEventListener('mouseup', handleMouseUp);
    elements.previewCanvas.addEventListener('mouseleave', handleMouseUp);
    
    // Touch events for mobile
    elements.previewCanvas.addEventListener('touchstart', handleTouchStart);
    elements.previewCanvas.addEventListener('touchmove', handleTouchMove);
    elements.previewCanvas.addEventListener('touchend', handleMouseUp);
    
    // Real-time preview updates
    const inputElements = [
        elements.brandName, elements.price, elements.offerText,
        elements.fontSize, elements.textColor, elements.bgColor,
        elements.opacity, elements.padding, elements.rotation,
        elements.alignment, elements.showQr, elements.qrSize,
        elements.qrType, elements.phoneNumber, elements.whatsappMessage, elements.qrUrl
    ];
    
    inputElements.forEach(el => {
        if (el) {
            el.addEventListener('input', debounce(handleInputChange, 300));
            el.addEventListener('change', handleInputChange);
        }
    });
    
    // Alignment change resets custom position
    elements.alignment.addEventListener('change', () => {
        state.customPosition = false;
        state.stampPosition = null;
        updatePreview();
    });
    
    // Opacity slider display
    elements.opacity.addEventListener('input', (e) => {
        elements.opacityValue.textContent = e.target.value + '%';
    });
    
    // Font Size slider sync
    elements.fontSizeSlider.addEventListener('input', (e) => {
        elements.fontSize.value = e.target.value;
        updatePreview();
    });
    
    elements.fontSize.addEventListener('input', (e) => {
        elements.fontSizeSlider.value = e.target.value;
    });
    
    // QR Code Size slider sync
    elements.qrSizeSlider.addEventListener('input', (e) => {
        elements.qrSize.value = e.target.value;
        state.qrImage = null; // Clear cached QR to force regeneration
        updatePreview();
    });
    
    elements.qrSize.addEventListener('input', (e) => {
        elements.qrSizeSlider.value = e.target.value;
    });
    
    // Auto-generate ID on page load
    generateUniqueId();
    
    showStatus('Ready! Upload an image to start stamping.', 'info');
}

/**
 * Handle input changes
 */
function handleInputChange() {
    // If QR settings change, regenerate QR
    if (['qrType', 'phoneNumber', 'whatsappMessage', 'qrUrl'].includes(event.target.id)) {
        state.qrImage = null; // Clear cached QR
    }
    updatePreview();
}

/**
 * Reset stamp position to alignment-based
 */
function resetStampPosition() {
    state.customPosition = false;
    state.stampPosition = null;
    updatePreview();
    showStatus('Position reset to alignment setting', 'success');
}

/**
 * Handle mouse down on canvas
 */
function handleMouseDown(e) {
    if (!elements.enableDrag.checked || !state.stampBounds) return;
    
    const rect = elements.previewCanvas.getBoundingClientRect();
    const scaleX = elements.previewCanvas.width / rect.width;
    const scaleY = elements.previewCanvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    // Check if click is inside stamp bounds
    if (mouseX >= state.stampBounds.x && mouseX <= state.stampBounds.x + state.stampBounds.width &&
        mouseY >= state.stampBounds.y && mouseY <= state.stampBounds.y + state.stampBounds.height) {
        state.isDragging = true;
        state.dragStart = {
            x: mouseX - state.stampBounds.x,
            y: mouseY - state.stampBounds.y
        };
        elements.previewCanvas.style.cursor = 'grabbing';
    }
}

/**
 * Handle mouse move on canvas
 */
function handleMouseMove(e) {
    if (!elements.enableDrag.checked) return;
    
    const rect = elements.previewCanvas.getBoundingClientRect();
    const scaleX = elements.previewCanvas.width / rect.width;
    const scaleY = elements.previewCanvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    if (state.isDragging) {
        // Update stamp position
        const newPosition = {
            x: mouseX - state.dragStart.x,
            y: mouseY - state.dragStart.y
        };
        
        // Use requestAnimationFrame for smooth updates
        if (!state.pendingUpdate) {
            state.pendingUpdate = true;
            state.stampPosition = newPosition;
            state.customPosition = true;
            
            if (state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId);
            }
            
            state.animationFrameId = requestAnimationFrame(() => {
                updatePreview();
                state.pendingUpdate = false;
            });
        } else {
            // Just update position without triggering render
            state.stampPosition = newPosition;
        }
    } else if (state.stampBounds) {
        // Change cursor if hovering over stamp
        if (mouseX >= state.stampBounds.x && mouseX <= state.stampBounds.x + state.stampBounds.width &&
            mouseY >= state.stampBounds.y && mouseY <= state.stampBounds.y + state.stampBounds.height) {
            elements.previewCanvas.style.cursor = 'grab';
        } else {
            elements.previewCanvas.style.cursor = 'default';
        }
    }
}

/**
 * Handle mouse up on canvas
 */
function handleMouseUp() {
    if (state.isDragging) {
        state.isDragging = false;
        elements.previewCanvas.style.cursor = 'grab';
    }
}

/**
 * Handle touch start (mobile)
 */
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    elements.previewCanvas.dispatchEvent(mouseEvent);
}

/**
 * Handle touch move (mobile)
 */
function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    elements.previewCanvas.dispatchEvent(mouseEvent);
}

/**
 * Handle image upload
 */
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (state.batchMode) {
        // Batch mode: add all files to queue
        files.forEach(file => {
            if (!file.type.match('image/(jpeg|jpg|png)')) {
                showStatus(`Skipped ${file.name}: Invalid format`, 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    state.batchImages.push({
                        file: file,
                        image: img,
                        processed: false
                    });
                    updateBatchQueue();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        
        showStatus(`Added ${files.length} image(s) to batch queue`, 'success');
    } else {
        // Single mode: load one image
        const file = files[0];
        
        if (!file.type.match('image/(jpeg|jpg|png)')) {
            showStatus('Please upload a JPG or PNG image.', 'error');
            return;
        }
        
        state.imageFile = file;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.uploadedImage = img;
                elements.uploadPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                updatePreview();
                showStatus('Image uploaded successfully!', 'success');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Reset file input
    e.target.value = '';
}

/**
 * Handle batch mode toggle
 */
function handleBatchModeToggle() {
    state.batchMode = elements.batchMode.checked;
    
    if (state.batchMode) {
        elements.imageUpload.setAttribute('multiple', 'multiple');
        elements.batchQueue.style.display = 'block';
        elements.downloadBatch.style.display = 'inline-block';
        showStatus('Batch mode enabled. You can now select multiple images.', 'info');
    } else {
        elements.imageUpload.removeAttribute('multiple');
        elements.batchQueue.style.display = 'none';
        elements.downloadBatch.style.display = 'none';
        clearBatchQueue();
        showStatus('Single image mode enabled.', 'info');
    }
}

/**
 * Update batch queue display
 */
function updateBatchQueue() {
    elements.batchCount.textContent = state.batchImages.length;
    elements.batchList.innerHTML = '';
    
    state.batchImages.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'batch-item';
        div.innerHTML = `
            <span class="batch-item-name">${item.file.name}</span>
            <button class="batch-item-remove" data-index="${index}">Remove</button>
        `;
        
        div.querySelector('.batch-item-remove').addEventListener('click', () => {
            removeBatchItem(index);
        });
        
        elements.batchList.appendChild(div);
    });
    
    // Load first image as preview
    if (state.batchImages.length > 0 && !state.uploadedImage) {
        const firstItem = state.batchImages[0];
        state.uploadedImage = firstItem.image;
        state.imageFile = firstItem.file;
        updatePreview();
    }
}

/**
 * Remove item from batch queue
 */
function removeBatchItem(index) {
    state.batchImages.splice(index, 1);
    updateBatchQueue();
    showStatus('Image removed from batch queue', 'info');
}

/**
 * Clear batch queue
 */
function clearBatchQueue() {
    state.batchImages = [];
    state.uploadedImage = null;
    state.imageFile = null;
    elements.uploadPreview.innerHTML = '';
    updateBatchQueue();
    showStatus('Batch queue cleared', 'info');
}

/**
 * Download batch images as ZIP
 */
async function downloadBatchImages() {
    if (state.batchImages.length === 0) {
        showStatus('❌ No images in batch queue', 'error');
        return;
    }
    
    // Show progress and disable buttons
    elements.batchProgress.style.display = 'block';
    elements.downloadBatch.disabled = true;
    elements.downloadBatch.textContent = '⏳ Processing Batch...';
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = 'Starting batch processing...';
    
    const processedImages = [];
    
    for (let i = 0; i < state.batchImages.length; i++) {
        const item = state.batchImages[i];
        
        // Update progress
        const progress = (i / state.batchImages.length) * 100;
        elements.progressFill.style.width = progress + '%';
        elements.progressText.textContent = `🔄 Processing image ${i + 1}/${state.batchImages.length}: ${item.file.name}`;
        
        showStatus(`Processing ${i + 1}/${state.batchImages.length}: ${item.file.name}`, 'info');
        
        try {
            // Set current image
            state.uploadedImage = item.image;
            state.imageFile = item.file;
            
            // Generate new unique ID for each image
            await generateUniqueId();
            
            // Regenerate QR if needed
            if (elements.showQr.checked) {
                state.qrImage = null;
                await loadQRCode();
            }
            
            // Update preview
            await updatePreview();
            
            // Process image
            const config = getConfiguration();
            const qrData = elements.showQr.checked ? buildQRData(config) : '';
            
            const formData = new FormData();
            formData.append('image', item.file);
            formData.append('config', JSON.stringify({
                ...config,
                qrData: qrData
            }));
            
            const response = await fetch('api.php?action=stampImage', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                processedImages.push({
                    filename: data.filename,
                    url: data.image_url
                });
                item.processed = true;
            } else {
                console.error(`Failed to process ${item.file.name}:`, data.error);
            }
        } catch (error) {
            console.error(`Error processing ${item.file.name}:`, error);
        }
    }
    
    // Update progress to 100%
    elements.progressFill.style.width = '100%';
    elements.progressText.textContent = `✅ Processing complete! Downloading ${processedImages.length} images...`;
    
    // Download all processed images
    showStatus(`⬇️ Downloading ${processedImages.length} images...`, 'success');
    
    // Download each image individually (simpler than ZIP)
    for (let i = 0; i < processedImages.length; i++) {
        const img = processedImages[i];
        elements.progressText.textContent = `⬇️ Downloading ${i + 1}/${processedImages.length}: ${img.filename}`;
        
        await new Promise(resolve => {
            const link = document.createElement('a');
            link.href = img.url;
            link.download = img.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(resolve, 600); // Delay between downloads
        });
    }
    
    // Hide progress and re-enable button
    setTimeout(() => {
        elements.batchProgress.style.display = 'none';
    }, 2000);
    
    elements.downloadBatch.disabled = false;
    elements.downloadBatch.textContent = '⬇️ Download All Images (ZIP)';
    elements.progressText.textContent = `✅ Complete! Downloaded ${processedImages.length} images`;
    showStatus(`✅ All ${processedImages.length} images downloaded successfully!`, 'success');
}

/**
 * Generate Unique ID
 */
async function generateUniqueId() {
    const prefix = elements.brandPrefix.value || 'PRD';
    
    try {
        const formData = new FormData();
        formData.append('prefix', prefix);
        
        const response = await fetch('api.php?action=generateId', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            elements.uniqueId.value = data.unique_id;
            state.uniqueId = data.unique_id;
            updatePreview();
        } else {
            throw new Error(data.error || 'Failed to generate ID');
        }
    } catch (error) {
        console.error('Error generating ID:', error);
        // Fallback: generate ID on client side
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const uniqueId = `${prefix}-${timestamp}-${random}`;
        elements.uniqueId.value = uniqueId;
        state.uniqueId = uniqueId;
    }
}

/**
 * Update preview canvas
 */
async function updatePreview() {
    if (!state.uploadedImage) {
        showStatus('Please upload an image first.', 'info');
        return;
    }
    
    const canvas = elements.previewCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match image
    canvas.width = state.uploadedImage.width;
    canvas.height = state.uploadedImage.height;
    
    // Draw original image
    ctx.drawImage(state.uploadedImage, 0, 0);
    
    // Load QR code if needed and not already loaded
    if (elements.showQr.checked) {
        if (!state.qrImage) {
            await loadQRCode();
        }
        // Verify QR is loaded before drawing
        if (!state.qrImage) {
            console.warn('QR code failed to load, showing placeholder');
        }
    }
    
    // Draw stamp
    drawStamp(ctx, canvas.width, canvas.height);
}

/**
 * Load QR Code image
 */
async function loadQRCode() {
    const config = getConfiguration();
    const qrData = buildQRData(config);
    
    if (!qrData) {
        console.log('No QR data to generate');
        state.qrImage = null;
        return;
    }
    
    console.log('Generating QR code for:', qrData);
    
    try {
        const formData = new FormData();
        formData.append('type', config.qrType);
        formData.append('data', qrData);
        formData.append('uniqueId', config.uniqueId);
        formData.append('qrSize', config.qrSize); // Pass QR size to API
        
        const response = await fetch('api.php?action=generateQR', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            console.error('QR generation HTTP error:', response.status, response.statusText);
            state.qrImage = null;
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.qr_url) {
            console.log('QR code generated successfully:', data.qr_url);
            // Load QR image
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous'; // Enable CORS
                img.onload = () => {
                    console.log('QR image loaded successfully');
                    state.qrImage = img;
                    resolve();
                };
                img.onerror = (error) => {
                    console.error('Failed to load QR image:', error);
                    state.qrImage = null;
                    resolve();
                };
                img.src = data.qr_url + '?t=' + Date.now(); // Cache bust
            });
        } else {
            console.error('QR generation failed:', data);
            state.qrImage = null;
        }
    } catch (error) {
        console.error('Error loading QR code:', error);
        state.qrImage = null;
    }
}

/**
 * Draw stamp on canvas
 */
function drawStamp(ctx, canvasWidth, canvasHeight) {
    const config = getConfiguration();
    
    // Build text lines
    const lines = [];
    if (config.brandName) lines.push(config.brandName);
    if (config.uniqueId) lines.push(`ID: ${config.uniqueId}`);
    if (config.price) lines.push(`Price: ${config.price}`);
    if (config.offerText) lines.push(config.offerText);
    
    if (lines.length === 0) return;
    
    // Calculate stamp dimensions
    const fontSize = parseInt(config.fontSize);
    const padding = parseInt(config.padding);
    const lineHeight = fontSize + 8;
    const qrSize = config.showQr ? parseInt(config.qrSize || 120) : 0;
    
    ctx.font = `${fontSize}px Arial, sans-serif`;
    
    let maxTextWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxTextWidth = Math.max(maxTextWidth, metrics.width);
    });
    
    // Calculate stamp dimensions
    const textHeight = lines.length * lineHeight;
    const stampWidth = maxTextWidth + padding * 2 + (config.showQr ? qrSize + padding : 0);
    const stampHeight = Math.max(textHeight + padding * 2, config.showQr ? qrSize + padding * 2 : 0);
    
    // Calculate position (use custom if set, otherwise use alignment)
    let position;
    if (state.customPosition && state.stampPosition) {
        position = {
            x: Math.max(0, Math.min(state.stampPosition.x, canvasWidth - stampWidth)),
            y: Math.max(0, Math.min(state.stampPosition.y, canvasHeight - stampHeight))
        };
    } else {
        position = calculateStampPosition(config.alignment, canvasWidth, canvasHeight, stampWidth, stampHeight);
    }
    
    // Store stamp bounds for drag detection
    state.stampBounds = {
        x: position.x,
        y: position.y,
        width: stampWidth,
        height: stampHeight
    };
    
    // Save context
    ctx.save();
    
    // Apply rotation if needed
    if (config.rotation !== 0) {
        const centerX = position.x + stampWidth / 2;
        const centerY = position.y + stampHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((config.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
    }
    
    // Draw background with opacity
    ctx.fillStyle = hexToRgba(config.bgColor, config.opacity / 100);
    ctx.fillRect(position.x, position.y, stampWidth, stampHeight);
    
    // Draw text
    ctx.fillStyle = config.textColor;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    
    let y = position.y + padding + fontSize;
    lines.forEach(line => {
        ctx.fillText(line, position.x + padding, y);
        y += lineHeight;
    });
    
    // Draw QR code if available
    if (config.showQr && state.qrImage) {
        const qrX = position.x + stampWidth - qrSize - padding;
        const qrY = position.y + padding;
        
        // Draw white background for QR
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        
        // Draw QR code image
        ctx.drawImage(state.qrImage, qrX, qrY, qrSize, qrSize);
    } else if (config.showQr) {
        // Draw QR placeholder if image not loaded
        const qrX = position.x + stampWidth - qrSize - padding;
        const qrY = position.y + padding;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR', qrX + qrSize/2, qrY + qrSize/2);
        ctx.textAlign = 'left';
    }
    
    // Draw drag handle indicator if drag is enabled
    if (elements.enableDrag.checked && !state.isDragging) {
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(position.x, position.y, stampWidth, stampHeight);
        ctx.setLineDash([]);
    }
    
    // Restore context
    ctx.restore();
}

/**
 * Calculate stamp position based on alignment
 */
function calculateStampPosition(alignment, canvasWidth, canvasHeight, stampWidth, stampHeight) {
    const margin = 20;
    
    switch (alignment) {
        case 'top-left':
            return { x: margin, y: margin };
        
        case 'top-right':
            return { x: canvasWidth - stampWidth - margin, y: margin };
        
        case 'bottom-left':
            return { x: margin, y: canvasHeight - stampHeight - margin };
        
        case 'bottom-right':
            return { x: canvasWidth - stampWidth - margin, y: canvasHeight - stampHeight - margin };
        
        case 'center':
            return {
                x: (canvasWidth - stampWidth) / 2,
                y: (canvasHeight - stampHeight) / 2
            };
        
        default:
            return { x: margin, y: margin };
    }
}

/**
 * Download stamped image
 */
async function downloadStampedImage() {
    if (!state.imageFile) {
        showStatus('Please upload an image first.', 'error');
        return;
    }
    
    if (!elements.uniqueId.value) {
        showStatus('Please generate a unique ID first.', 'error');
        return;
    }
    
    // Show progress and disable button
    elements.downloadImage.disabled = true;
    elements.downloadImage.textContent = '⏳ Processing...';
    showStatus('🔄 Processing image... Please wait.', 'info');
    
    console.log('Starting download process...');
    console.log('Config:', getConfiguration());
    
    try {
        const config = getConfiguration();
        
        // Build QR data
        let qrData = '';
        if (config.showQr) {
            qrData = buildQRData(config);
            if (!qrData) {
                throw new Error('Please configure QR code settings (phone number or URL)');
            }
        }
        
        showStatus('📤 Uploading image to server...', 'info');
        
        const formData = new FormData();
        formData.append('image', state.imageFile);
        formData.append('config', JSON.stringify({
            ...config,
            qrData: qrData
        }));
        
        const response = await fetch('api.php?action=stampImage', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        showStatus('🎨 Applying stamp to image...', 'info');
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            showStatus('⬇️ Downloading image...', 'info');
            
            console.log('Downloading:', data.image_url, data.filename);
            
            // Download the image
            const link = document.createElement('a');
            link.href = data.image_url;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Download initiated');
            
            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 500));
            showStatus('✅ Image downloaded successfully!', 'success');
        } else {
            console.error('Server returned error:', data);
            throw new Error(data.error || 'Failed to process image');
        }
    } catch (error) {
        console.error('Error processing image:', error);
        showStatus('❌ Error: ' + error.message, 'error');
    } finally {
        // Re-enable button
        elements.downloadImage.disabled = false;
        elements.downloadImage.textContent = '⬇️ Download Stamped Image';
    }
}

/**
 * Build QR data based on type
 */
function buildQRData(config) {
    const uniqueId = config.uniqueId;
    
    switch (elements.qrType.value) {
        case 'whatsapp':
            const phone = elements.phoneNumber.value.replace(/\D/g, '');
            const message = elements.whatsappMessage.value.replace('{{UNIQUE_ID}}', uniqueId);
            return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        
        case 'phone':
            const phoneNum = elements.phoneNumber.value.replace(/\D/g, '');
            return `tel:${phoneNum}`;
        
        case 'url':
            return elements.qrUrl.value;
        
        default:
            return '';
    }
}

/**
 * Get current configuration
 */
function getConfiguration() {
    return {
        brandName: elements.brandName.value,
        brandPrefix: elements.brandPrefix.value,
        uniqueId: elements.uniqueId.value,
        price: elements.price.value,
        offerText: elements.offerText.value,
        showQr: elements.showQr.checked,
        qrSize: elements.qrSize.value,
        qrType: elements.qrType.value,
        phoneNumber: elements.phoneNumber.value,
        whatsappMessage: elements.whatsappMessage.value,
        qrUrl: elements.qrUrl.value,
        fontSize: elements.fontSize.value,
        textColor: elements.textColor.value,
        bgColor: elements.bgColor.value,
        opacity: elements.opacity.value,
        padding: elements.padding.value,
        rotation: elements.rotation.value,
        alignment: elements.alignment.value,
        customPosition: state.customPosition,
        stampPosition: state.stampPosition
    };
}

/**
 * Save preset as JSON file
 */
function savePreset() {
    const config = getConfiguration();
    
    // Remove unique ID and custom position from preset (should be generated/set fresh each time)
    delete config.uniqueId;
    delete config.customPosition;
    delete config.stampPosition;
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `stamp-preset-${config.brandPrefix || 'default'}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showStatus('Preset saved successfully!', 'success');
}

/**
 * Load preset from JSON file
 */
function loadPreset(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const config = JSON.parse(event.target.result);
            
            // Apply configuration to form
            if (config.brandName) elements.brandName.value = config.brandName;
            if (config.brandPrefix) elements.brandPrefix.value = config.brandPrefix;
            if (config.price) elements.price.value = config.price;
            if (config.offerText) elements.offerText.value = config.offerText;
            if (config.showQr !== undefined) elements.showQr.checked = config.showQr;
            if (config.qrSize) elements.qrSize.value = config.qrSize;
            if (config.qrType) elements.qrType.value = config.qrType;
            if (config.phoneNumber) elements.phoneNumber.value = config.phoneNumber;
            if (config.whatsappMessage) elements.whatsappMessage.value = config.whatsappMessage;
            if (config.qrUrl) elements.qrUrl.value = config.qrUrl;
            if (config.fontSize) elements.fontSize.value = config.fontSize;
            if (config.textColor) elements.textColor.value = config.textColor;
            if (config.bgColor) elements.bgColor.value = config.bgColor;
            if (config.opacity) {
                elements.opacity.value = config.opacity;
                elements.opacityValue.textContent = config.opacity + '%';
            }
            if (config.padding) elements.padding.value = config.padding;
            if (config.rotation) elements.rotation.value = config.rotation;
            if (config.alignment) elements.alignment.value = config.alignment;
            
            // Reset custom position and generate new unique ID
            state.customPosition = false;
            state.stampPosition = null;
            state.qrImage = null;
            
            generateUniqueId();
            
            updatePreview();
            showStatus('Preset loaded successfully!', 'success');
        } catch (error) {
            showStatus('Error loading preset: Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${type}`;
    elements.statusMessage.style.display = 'block';
    
    // Auto-hide after 5 seconds (except for info messages during processing)
    if (type !== 'info') {
        setTimeout(() => {
            elements.statusMessage.style.display = 'none';
        }, 5000);
    }
}

/**
 * Utility: Convert hex color to rgba
 */
function hexToRgba(hex, alpha = 1) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
