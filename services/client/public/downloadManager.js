/**
 * Download Manager Module
 * Handles software download with license generation
 */
const DownloadManager = (function() {
    'use strict';
    console.log("REACT_APP_URL in DOWNLOAD =");
    console.log(process.env.REACT_APP_API_URL);
  
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    // Configuration
    const config = {
        licenseApiEndpoint: `${API_URL}/generateLicense`, // Update this to your actual endpoint
        downloadUrls: {
            windows: 'https://github.com/dahiyabu/masterconvert/actions/runs/15498537930/artifacts/3278714068',
            macos: 'downloads/ConvertMaster-macOS.dmg',
            linux: 'downloads/ConvertMaster-Linux.AppImage'
        }
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

    async function generateLicense(durationInSeconds) {
        try {
            showStatus('Generating license...', 'info');
            
            const response = await fetch(config.licenseApiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    platform: 'web',
                    duration: durationInSeconds
                })
            });

            if (!response.ok) {
                throw new Error(`License generation failed: ${response.status} ${response.statusText}`);
            }

            const licenseJson = await response.json();
            const licenseKey = licenseJson.key;
            showStatus('License generated successfully', 'success');
            return licenseKey;

        } catch (error) {
            console.error('License generation error:', error);
            showStatus('Using demo license (API not available)', 'info');
            return `ENCRYPTED_LICENSE_DATA_${Date.now()}_DEMO_VERSION`;
        }
    }

    async function downloadSoftware(url, platform) {
        try {
            showStatus(`Downloading ${platform} software...`, 'info');
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            showStatus(`${platform} software downloaded successfully`, 'success');
            return blob;

        } catch (error) {
            console.error('Software download error:', error);
            showStatus(`Demo file created for ${platform} (download not available)`, 'info');
            return new Blob([`Demo ${platform} software file - ${new Date().toISOString()}`], 
                { type: 'application/octet-stream' });
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
            
            const softwareFileName = `ConvertMaster-${platform}${extensions[platform]}`;
            zip.file(softwareFileName, softwareBlob);
            
            // Add readme file
            const readmeContent = `ConvertMaster ${platform.charAt(0).toUpperCase() + platform.slice(1)} Package

Installation Instructions:
1. Extract this package to your desired location
2. The license.lic file must remain in the same directory as the software
3. Run the ConvertMaster executable

License: The license.lic file contains encrypted license data required for software activation.

Generated: ${new Date().toISOString()}
Platform: ${platform}
`;
            
            zip.file('README.txt', readmeContent);
            
            showStatus('Package created successfully', 'success');
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
        const defaultFilename = `ConvertMaster-${platform}-Package.zip`;
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
        const filename = `ConvertMaster-${platform}-Package.zip`;
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

    async function downloadPackage(platform, savePath) {
        if (!savePath) {
            showStatus('Please select a save location first', 'error');
            return;
        }
        if (!platform) {
            showStatus('Platform not selected. Please try again.', 'error');
            return;
        }

        try {
            setButtonsState(true);
            updateProgress(0);
            
            // Step 1: Generate license and download software in parallel
            updateProgress(10);
            const [licenseData, softwareBlob] = await Promise.all([
                generateLicense(60 * 60 * 24 * 30),
                downloadSoftware(config.downloadUrls[platform], platform)
            ]);
            
            updateProgress(60);
            
            // Step 2: Create package
            const packageBlob = await createPackage(licenseData, softwareBlob, platform);
            updateProgress(90);
            
            // Step 3: Download the package
            const filename = savePath.endsWith('.zip') ? savePath : `${savePath}.zip`;
            downloadBlob(packageBlob, filename);
            
            updateProgress(100);
            showStatus(`Package downloaded successfully as ${filename}`, 'success');
            
            // Reset progress after 2 seconds
            setTimeout(() => updateProgress(0), 2000);

        } catch (error) {
            console.error('Download package error:', error);
            showStatus(`Error: ${error.message}`, 'error');
            updateProgress(0);
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

// Make it globally available
window.DownloadManager = DownloadManager;