/**
 * Download Manager Module
 * Handles software download with license generation
 */
import JSZip from 'jszip';

const DownloadManager = (function() {
    'use strict';
    console.log("REACT_APP_URL in DOWNLOAD =");
    //console.log(window.env.REACT_APP_API_URL);
    
    const API_URL = window.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    // Configuration
    const config = {
        licenseApiEndpoint: `${API_URL}/generateLicense`, // Update this to your actual endpoint
    };

    // Private variables
    let selectedPlatform = null;

    // DOM element selectors
    const selectors = {
        modal: '#saveLocationModal',
        savePath: '#downloadSavePath',
        statusContainer: '#downloadStatusContainer',
        progressContainer: '#downloadProgressContainer',
        progressBar: '#downloadProgressBar',
        confirmBtn: '#confirmDownloadSaveBtn',
        buttons: {
            windows: '#windowsBtn',
            macos: '#macosBtn',
            linux: '#linuxBtn'
        }
    };

    // Private methods
    function showStatus(message, type = 'info') {
        const container = document.querySelector(selectors.statusContainer);
        if (!container) return;

        const statusDiv = document.createElement('div');
        statusDiv.className = `download-status ${type}`;
        statusDiv.textContent = message;
        container.appendChild(statusDiv);
        
        // Auto-remove after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 5000);
        }
    }

    function updateProgress(percent) {
        const progressContainer = document.querySelector(selectors.progressContainer);
        const progressBar = document.querySelector(selectors.progressBar);
        
        if (!progressContainer || !progressBar) return;

        if (percent > 0) {
            progressContainer.style.display = 'block';
            progressBar.style.width = percent + '%';
        } else {
            progressContainer.style.display = 'none';
        }
    }

    function setButtonsState(disabled) {
        Object.values(selectors.buttons).forEach(selector => {
            const btn = document.querySelector(selector);
            if (!btn) return;

            btn.disabled = disabled;
            
            if (disabled) {
                const spinner = document.createElement('div');
                spinner.className = 'download-spinner';
                btn.insertBefore(spinner, btn.firstChild);
            } else {
                const spinner = btn.querySelector('.download-spinner');
                if (spinner) spinner.remove();
            }
        });
    }

    async function generateLicense(durationInSeconds, existingLicenseId = null,sessionData = null) {
        try {
            showStatus('Generating license...', 'info');
            
            const requestBody = {
                timestamp: new Date().toISOString(),
                platform: 'web',
                duration: durationInSeconds
            };
        
            // If we have an existing license ID, request the same license
            if (existingLicenseId) {
            requestBody.licenseId = existingLicenseId;
            requestBody.redownload = true;
            }
            if (sessionData) {
                requestBody.sessionId = sessionData.sessionId;
                requestBody.email = sessionData.email;
                requestBody.plan = sessionData.plan;
                requestBody.os = sessionData.os;
            }
            const response = await fetch(config.licenseApiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`License generation failed: ${response.status} ${response.statusText}`);
            }

            const licenseJson = await response.json();
            //const licenseKey = licenseJson.key;
            showStatus('License generated successfully', 'success');
            return {
                key: licenseJson.key,
                licenseId: licenseJson.licenseId || existingLicenseId
            };

        } catch (error) {
            console.error('License generation error:', error);
            showStatus('Using demo license (API not available)', 'info');
            return `ENCRYPTED_LICENSE_DATA_${Date.now()}_DEMO_VERSION`;
        }
    }

    async function downloadSoftware(platform,plan) {
        const s3Keys = {
            windows: {
                'basic': 'software/windows/basic/extconvert.exe',
                'professional': 'software/windows/full/extconvert.exe'
            },
            macos: {
                'basic': 'software/macos/basic/extconvert',
                'professional': 'software/macos/full/extconvert'
            },
            linux: {
                'basic': 'software/linux/basic/extconvert',
                'professional': 'software/linux/full/extconvert'
            }
        };

        try {
            showStatus(`Fetching download link for ${platform}...`, 'info');

            // Step 1: Get presigned URL from backend
            const res = await fetch(`${API_URL}/get-download-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: s3Keys[platform][plan] })
            });

            const data = await res.json();

            if (!res.ok || !data.url) {
            throw new Error(data.error || 'Failed to get download link');
            }

            // Step 2: Fetch the actual file
            showStatus(`Downloading ${platform} software...`, 'info');
            const fileRes = await fetch(data.url, {
            method: 'GET',
            mode: 'cors'
            });

            if (!fileRes.ok) {
            throw new Error(`Download failed: ${fileRes.status} ${fileRes.statusText}`);
            }

            const blob = await fileRes.blob();
            showStatus(`${platform} software downloaded successfully`, 'success');
            return blob;

        } catch (error) {
            console.error('Software download error:', error);
            showStatus(`Demo file created for ${platform} (download not available)`, 'info');
            return new Blob(
            [`Demo ${platform} software - ${new Date().toISOString()}`],
            { type: 'application/octet-stream' }
            );
        }
    }

    async function createPackage(licenseData, softwareBlob, platform) {
        try {
            showStatus('Creating package...', 'info');
    
            const zip = new JSZip();
    
            // Add license file
            zip.file('license.lic', licenseData);
    
            // Add software file with appropriate extension
            const extensions = {
                windows: '.exe',
                macos: '.dmg',
                linux: '.AppImage'
            };
    
            // Ensure platform is valid
            if (!extensions[platform]) {
                throw new Error('Unsupported platform: ' + platform);
            }
    
            const softwareFileName = `ExtConvert-${platform}${extensions[platform]}`;
            zip.file(softwareFileName, softwareBlob);
    
            // Create PDF using jsPDF
            const { jsPDF } = require('jspdf');
            const doc = new jsPDF();
    
            // Add title
            doc.setFontSize(18);
            doc.text('ExtConvert - Installation Instructions', 20, 20);
    
            // Add content
            doc.setFontSize(12);
            doc.text('Welcome to ExtConvert!', 20, 30);
            doc.text('Thank you for choosing ExtConvert. Follow these steps to install and start using the software.\n\n', 20, 40);
    
            // Installation Instructions
            doc.text('Installation Instructions:', 20, 60);
            doc.text('1. Extract the downloaded package to a location of your choice on your computer.', 20, 70);
            doc.text('2. Ensure the `license.lic` file remains in the same folder as the software.', 20, 80);
            doc.text('3. Double-click on the `ExtConvert` executable to start the software.', 20, 90);
            doc.text('4. Bypass any security warnings that may appear.', 20, 100);
            doc.text('5. Open your browser and go to http://localhost:5000 to access the app.', 20, 110);
    
            // Additional Info
            doc.text('\nWhy Choose ExtConvert?', 20, 130);
            doc.text('• All your data is processed locally.', 20, 140);
            doc.text('• No data is uploaded to the cloud.', 20, 150);
            doc.text('• Easy setup with clear instructions.', 20, 160);
    
            // Footer
            doc.text('\nSupport & Contact:', 20, 180);
            doc.text('For any issues, contact us at support@extconvert.com', 20, 190);
    
            // License information and Platform
            doc.text('\nGenerated on: ' + new Date().toISOString(), 20, 210);
            doc.text('Platform: ' + platform, 20, 220);
    
            // Save the document as a PDF (as a byte array)
            const pdfBytes = doc.output('arraybuffer');
    
            // Add the generated PDF to the ZIP file
            zip.file('README.pdf', pdfBytes);
    
            showStatus('Package created successfully', 'success');
    
            // Generate the ZIP file as a Blob and return it
            return await zip.generateAsync({ type: 'blob' });
    
        } catch (error) {
            console.error('Package creation error:', error);
            throw new Error('Failed to create package: ' + error.message);
        }
    }
    

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Initialize event listeners
    function initEventListeners() {
        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            const modal = document.querySelector(selectors.modal);
            if (event.target === modal) {
                closeSaveModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                const modal = document.querySelector(selectors.modal);
                if (modal && modal.style.display === 'block') {
                    closeSaveModal();
                }
            }
        });

        // Clear old status messages periodically
        setInterval(() => {
            const container = document.querySelector(selectors.statusContainer);
            if (!container) return;

            const statuses = container.querySelectorAll('.download-status:not(.error)');
            if (statuses.length > 3) {
                statuses[0].remove();
            }
        }, 10000);
    }

    // Public methods
    function showSaveDialog(platform) {
        console.log(platform);
        selectedPlatform = platform;
        const modal = document.querySelector(selectors.modal);
        const savePathInput = document.querySelector(selectors.savePath);
        
        if (!modal || !savePathInput) {
            console.error('Modal elements not found');
            return;
        }
        
        // Set default filename based on platform
        const defaultFilename = `ExtConvert-${platform}-Package.zip`;
        savePathInput.value = defaultFilename;
        
        modal.style.display = 'block';
        
        // Enable confirm button since we have a default path
        const confirmBtn = document.querySelector(selectors.confirmBtn);
        if (confirmBtn) confirmBtn.disabled = false;
    }

    function closeSaveModal() {
        const modal = document.querySelector(selectors.modal);
        if (modal) modal.style.display = 'none';
        selectedPlatform = null;
    }

    function browseLocation() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.zip';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                let filename = file.name;
                
                if (!filename.toLowerCase().endsWith('.zip')) {
                    filename += '.zip';
                }
                
                const savePathInput = document.querySelector(selectors.savePath);
                const confirmBtn = document.querySelector(selectors.confirmBtn);
                
                if (savePathInput) savePathInput.value = filename;
                if (confirmBtn) confirmBtn.disabled = false;
            }
            document.body.removeChild(fileInput);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    function setQuickLocation(location) {
        const platform = selectedPlatform || 'Package';
        const filename = `ExtConvert-${platform}-Package.zip`;
        const fullPath = `${location}/${filename}`;
        
        const savePathInput = document.querySelector(selectors.savePath);
        const confirmBtn = document.querySelector(selectors.confirmBtn);
        
        if (savePathInput) savePathInput.value = fullPath;
        if (confirmBtn) confirmBtn.disabled = false;
    }

    function confirmSaveLocation() {
        const savePathInput = document.querySelector(selectors.savePath);
        if (!savePathInput) return;

        const savePath = savePathInput.value.trim();
        
        if (!savePath) {
            showStatus('Please select a save location', 'error');
            return;
        }
        const platform = selectedPlatform;
        closeSaveModal();
        downloadPackage(platform,savePath);
    }

    async function downloadPackage(platform, savePath, onProgress = null, onStatus = null, existingLicenseId = null, sessionData = null) {
        if (!savePath) {
            const message = 'Please select a save location first';
            if (onStatus) onStatus(message, 'error');
            else showStatus(message, 'error');
            return;
        }
        if (!platform) {
            const message = 'Platform not selected. Please try again.';
            if (onStatus) onStatus(message, 'error');
            else showStatus(message, 'error');
            return;
        }

        try {
            setButtonsState(true);
            if (onProgress) onProgress(0);
            else updateProgress(0);
        
            // Step 1: Generate license and download software in parallel
            if (onProgress) onProgress(10);
            else updateProgress(10);
            let durationInDays;

            if (sessionData.period === 'per month') {
                durationInDays = 30;  // 30 days for monthly plan
            } else if (sessionData.period === 'per year') {
                durationInDays = 365;  // 365 days for yearly plan
            } else if (sessionData.period === 'lifetime') {
                durationInDays = 36500;  // 100 years for lifetime plan
            } else {
                // Default to 30 days if the plan is not specified or is unknown
                durationInDays = 30;
            }
            const [licenseData, softwareBlob] = await Promise.all([
                generateLicense(durationInDays,existingLicenseId,sessionData),
                downloadSoftware(platform,sessionData.plan)
            ]);
        
            if (onProgress) onProgress(60)
            else updateProgress(60);
            
            // Step 2: Create package
            const packageBlob = await createPackage(licenseData.key, softwareBlob, platform);
            if (onProgress) onProgress(90)
            else updateProgress(90);
            
            // Step 3: Download the package
            const filename = savePath.endsWith('.zip') ? savePath : `${savePath}.zip`;
            downloadBlob(packageBlob, filename);
            
            if (onProgress) onProgress(100)
            else updateProgress(100);
            const successMessage = `Package downloaded successfully as ${filename}`;
            if (onStatus) onStatus(successMessage, 'success');
            else showStatus(successMessage, 'success');
            
            // Reset progress after 2 seconds
            setTimeout(() => {
                if (onProgress) onProgress(0);
                else updateProgress(0);
            }, 2000);

            // Return the license information for tracking
            return {
                success: true,
                licenseId: licenseData.licenseId,
                filename: filename
            };
        } catch (error) {
            console.error('Download package error:', error);
            const errorMessage = `Error: ${error.message}`;
            if (onStatus) onStatus(errorMessage, 'error');
            else showStatus(errorMessage, 'error');
            
            if (onProgress) onProgress(0);
            else updateProgress(0);
            throw error;
        } finally {
            setButtonsState(false);
        }
    }

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initEventListeners);
        } else {
            initEventListeners();
        }
    }

    // Auto-initialize
    init();

    // Public API
    return {
        showSaveDialog,
        closeSaveModal,
        browseLocation,
        setQuickLocation,
        confirmSaveLocation,
        downloadPackage,
        init
    };
})();

export default DownloadManager;
// Make it globally available
//window.DownloadManager = DownloadManager;