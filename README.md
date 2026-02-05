# 📸 Business Stamper CTA - Image Stamp & QR Generator

A professional web-based tool for stamping product images with brand information, pricing, and dynamic QR codes. Perfect for e-commerce businesses, retailers, and product listings.

## ✨ Features

### Current Features (v1.1)
- ✅ **Single & Batch Image Upload** - Upload single or multiple JPG/PNG images
- ✅ **Batch Processing** - Process multiple images with the same stamp settings
- ✅ **Batch Download** - Download all processed images with one click
- ✅ **Dynamic Stamping** - Add brand name, unique ID, price, and promotional text
- ✅ **QR Code Generation** - Generate QR codes for WhatsApp, phone calls, or custom URLs
- ✅ **Enhanced QR Visibility** - Improved QR code rendering with better error handling
- ✅ **Smooth Draggable Positioning** - Click and drag with requestAnimationFrame for smooth movement
- ✅ **Slider Controls** - Font Size and QR Code Size with slider + manual text input
- ✅ **Real-time Preview** - See changes instantly on the canvas
- ✅ **Customizable Styling** - Control font size, colors, opacity, padding, and rotation
- ✅ **Preset Management** - Save and load stamp configurations as JSON files
- ✅ **Unique ID Generation** - Auto-generate unique product IDs with custom prefixes
- ✅ **Multiple Alignments** - Position stamps at corners, center, or custom locations
- ✅ **Download Stamped Images** - Export final images with stamps applied

### 🚧 In Development (v1.2)
- 📦 **ZIP Export** - Package batch downloads as a single ZIP file
- 🎨 **Custom Fonts** - Upload and use custom fonts for stamping
- 📐 **Multiple Stamps** - Add multiple stamps per image

## 🎯 Usage

### Basic Workflow
1. **Upload Image** - Select a product image (JPG/PNG)
2. **Configure Brand** - Enter brand name and prefix
3. **Generate ID** - Auto-generate unique product identifier
4. **Set Details** - Add price and promotional text
5. **Configure QR** - Choose QR action type (WhatsApp/Phone/URL)
6. **Customize Style** - Adjust colors, size, opacity
7. **Position Stamp** - Drag to desired location or use alignment presets
8. **Download** - Export the stamped image

### QR Code Types
- **WhatsApp Chat** - Creates a WhatsApp link with pre-filled message
- **Phone Call** - Direct phone call link
- **Custom URL** - Any external website or landing page

## 🛠️ Technical Details

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 7.4+
- **Canvas API**: HTML5 Canvas for image manipulation
- **QR Generation**: Custom PHP QR code generator

### File Structure
```
├── index.php           # Main UI interface
├── app.js             # Frontend JavaScript logic
├── api.php            # Backend API endpoints
├── styles.css         # Styling
├── QRCodeGenerator.php # QR code generation
├── uploads/           # Uploaded images (temp storage)
├── temp/              # Generated QR codes and temp files
└── fonts/             # Custom fonts for stamping
```

### API Endpoints
- `POST api.php?action=generateId` - Generate unique product ID
- `POST api.php?action=generateQR` - Create QR code image
- `POST api.php?action=stampImage` - Process and stamp image

## 🚀 Installation

### Prerequisites
- PHP 7.4 or higher
- GD Library enabled in PHP
- Web server (Apache/Nginx)

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/riankprasad/BUSINESS-STAMPER-CTA.git
   cd BUSINESS-STAMPER-CTA
   ```

2. Ensure required directories exist and have write permissions:
   ```bash
   mkdir -p uploads temp fonts
   chmod 755 uploads temp fonts
   ```

3. Start local server:
   ```bash
   php -S localhost:8000
   ```

4. Access in browser:
   ```
   http://localhost:8000
   ```

## ⚙️ Configuration

### Customization Options
- **Font Size**: 8px - 72px (slider + text input control)
- **QR Code Size**: 50px - 300px (slider + text input control)
- **Opacity**: 0% - 100%
- **Rotation**: -180° to 180°
- **Colors**: Custom hex color picker
- **Padding**: 0px - 100px

### Preset Files
Save your configurations as JSON files for quick reuse:
```json
{
  "brandName": "Nike Store",
  "brandPrefix": "NTK",
  "price": "$99.99",
  "fontSize": "16",
  "qrSize": "120",
  "alignment": "bottom-right"
}
```

## 🐛 Known Issues

### Fixed in v1.1 ✅
1. **QR Code Visibility** - FIXED
   - Enhanced error handling and logging
   - Added CORS support for QR image loading
   - Better fallback placeholder rendering

2. **Drag Smoothness** - FIXED
   - Implemented requestAnimationFrame for smooth dragging
   - Optimized rendering to prevent performance issues
   - Added pending update flag to avoid duplicate renders

3. **Batch Processing** - ADDED
   - Full batch upload/download functionality
   - Progress tracking and visual feedback
   - Individual unique IDs for each image

### Current Issues
None reported. Please open an issue if you encounter any problems!

## 📋 Roadmap

### Version 1.1 (Completed ✅)
- [x] Add batch upload/download functionality
- [x] Implement slider controls for Font Size and QR Code Size
- [x] Fix QR code visibility issues
- [x] Improve drag smoothness with requestAnimationFrame
- [x] Enhanced error handling and logging

### Version 1.2 (Planned)
- [ ] ZIP export for batch downloads
- [ ] Image filters and effects
- [ ] Custom font upload support
- [ ] Multiple stamp templates per image
- [ ] Export to multiple formats (WEBP, AVIF)
- [ ] Cloud storage integration
- [ ] Watermark protection options
- [ ] Keyboard shortcuts for positioning

### Version 2.0 (Future)
- [ ] User accounts and authentication
- [ ] Project management and organization
- [ ] API access for automation
- [ ] Mobile app versions
- [ ] Advanced batch processing via CLI
- [ ] Analytics and tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Rian Prasad**
- GitHub: [@riankprasad](https://github.com/riankprasad)

## 🙏 Acknowledgments

- QR Code generation library
- Canvas API documentation
- Open-source community

---

**Last Updated**: February 5, 2026  
**Version**: 1.1 (v1.2 in planning)