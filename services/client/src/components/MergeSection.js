import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Button, CircularProgress, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, TextField, IconButton, Snackbar, Paper
} from '@mui/material';
import { ArrowRight, RotateCcw, Delete, Download } from 'lucide-react';
import { Check } from '@mui/icons-material';
import UploadFileButton from './UploadFileButton';
import { Alert } from '@mui/material';
import Box from '@mui/material/Box';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function MergeSection({ API_URL }) {
  const [files, setFiles] = useState([]);
  const [mergeType, setMergeType] = useState('zip');  // Default to 'zip' initially
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [compatibleFormats, setCompatibleFormats] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);  // Snackbar for duplicate file warning
  const [availableMergeTypes, setAvailableMergeTypes] = useState(['pdf', 'zip', 'tar', '7z']); // Removed 'rar' option
  const [conversionStatus, setConversionStatus] = useState('idle'); // idle, processing, success, error
  const [showDownloadContainer, setShowDownloadContainer] = useState(false); // Manage download container visibility
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(null);
  const [conversionsLeft, setConversionsLeft] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);

  //Effects
  const fetchAccountLimits = useCallback(async () => {
      try {
        if(!fingerprint) return;
        const response = await fetch(`${API_URL}/account-limits?fp=${fingerprint}`);
        const data = await response.json();
  
        if (!response.ok) throw new Error(data.error || 'Failed to fetch limits');
  
        setMaxFileSizeMB(data.max_file_size_mb);  // expected from backend
        setConversionsLeft(data.conversions_left);  // expected from backend
      } catch (err) {
        console.error('Error fetching limits:', err);
        setMaxFileSizeMB(50); // fallback
        setConversionsLeft('N/A');
      }
   }, []);

   useEffect(() => {
    fetchAccountLimits();
  }, [fetchAccountLimits]);

  // Initialize FingerprintJS and get the fingerprint
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);  // Store the fingerprint
    };

    getFingerprint();
  }, []);

  // Fetch formats compatibility on component mount
  useEffect(() => {
    const fetchCompatibleFormats = async () => {
      try {
        const response = await fetch(`${API_URL}/formats`);
        const data = await response.json();
        if (data.format_compatibility) {
          setCompatibleFormats(data.format_compatibility);
        }
      } catch (err) {
        console.error('Error fetching format compatibility', err);
      }
    };

    fetchCompatibleFormats();
  }, [API_URL]);

  const handleFileChange = (e) => {
    const fileSizeLimitMB = maxFileSizeMB || 50;
    const MAX_FILE_SIZE_BYTES = fileSizeLimitMB * 1024 * 1024;
    
    const newFiles = Array.from(e.target.files);
    const newFilesToAdd = [];

    for (const newFile of newFiles) {
      const isDuplicate = files.some((existingFile) => existingFile.name === newFile.name);

      if (isDuplicate) {
        setOpenSnackbar(true); // Duplicate file warning
        continue;
      }

      if (newFile.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`File "${newFile.name}" exceeds the ${fileSizeLimitMB}MB limit.`);
        setConversionStatus('error');
        //continue;
        return;
      }

      newFilesToAdd.push(newFile);
    }
  //  const newFilesToAdd = newFiles.filter((newFile) => {
      // Check if the file is already in the files array by comparing the file name
    //  return !files.some((existingFile) => existingFile.name === newFile.name);
   // });
    setErrorMessage('');
    if (newFilesToAdd.length > 0) {
      // If there are new files to add, update the state
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...newFilesToAdd];
        updateAvailableMergeTypes(updatedFiles); // Update available merge types based on new files
        return updatedFiles;
      });
    } else {
      // Show warning if the file is already added
      setOpenSnackbar(true);
    }
  };

  const updateAvailableMergeTypes = (updatedFiles) => {
    // Extract file extensions from the uploaded files
    const fileExtensions = updatedFiles.map((file) => file.name.split('.').pop().toLowerCase());

    // Check if **all** files' extensions are compatible with PDF
    const pdfCompatibleFormats = compatibleFormats['pdf'] || [];
    const allFilesCompatibleWithPDF = fileExtensions.every((ext) => pdfCompatibleFormats.includes(ext));

    // Update available merge types based on whether all files are PDF compatible
    const newAvailableTypes = ['zip', 'tar', '7z']; // Removed 'rar' option

    if (allFilesCompatibleWithPDF) {
      newAvailableTypes.unshift('pdf');  // If all files are PDF compatible, add PDF as the first option
    }

    setAvailableMergeTypes(newAvailableTypes);
  };

  const handleFileRemove = (fileName) => {
    setFiles(files.filter((file) => file.name !== fileName)); // Remove the selected file
    updateAvailableMergeTypes(files.filter((file) => file.name !== fileName)); // Recalculate available merge types
  };

  const handleMerge = async () => {
    setIsProcessing(true);
    setConversionStatus('processing'); // Set processing state

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('merge_type', mergeType);

    // Add password for formats that support it (excluding 'rar')
    if (password && mergeType !== 'rar') {
      formData.append('password', password);
    }

    // Ensure fingerprint is included
    if (!fingerprint) {
      setErrorMessage('Fingerprint is required.');
      setConversionStatus('error');
      return;
    }
    try {
      // Add fingerprint to the form data
      formData.append('fingerprint', fingerprint);

      // Call the backend API to merge the files
      const response = await fetch(`${API_URL}/merge`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Handle API error
      if (!response.ok) throw new Error(data.error);

      // Update the result and status
      setResult(data);
      setConversionStatus('success'); // Set to success once merged
      setShowDownloadContainer(true); // Show download container after successful merge
      await fetchAccountLimits(); //refresh limits
    } catch (err) {
      setConversionStatus('error'); // Set to error on failure
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setMergeType('zip');
    setPassword('');
    setResult(null);
    setConversionStatus('idle');
    setShowDownloadContainer(false); // Reset to hide download container
  };

  return (
    <div>
      {/* If there's an error due to conversion, hide everything except the error message and reset button */}
      {conversionStatus === 'error' && (
        <Alert
        severity="error"
        variant="outlined"
        icon={<RotateCcw />} // Optional: Replace with an alert icon if you prefer
        sx={{
          mt: 3,
          mb: 2,
          borderRadius: 2,
          borderColor: 'error.main',
          bgcolor: '#fff5f5',
          color: 'error.main',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: 2,
        }}
      >
        <Typography variant="body1" fontWeight="bold" gutterBottom>
          {errorMessage}
        </Typography>

        <Typography variant="body2" sx={{ mb: 1 }}>
          Upgrade your plan to increase file size limit or conversions.
        </Typography>

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            href="/pricing"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            View Pricing Plans
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleReset}
            startIcon={<RotateCcw />}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Reset
          </Button>
        </Box>
      </Alert>
      )}
      {conversionStatus != 'error' && !showDownloadContainer && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <UploadFileButton handleFileChange={handleFileChange} />
          {/* Inserted: Max File Size and Conversions Left */}
          {maxFileSizeMB && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Max File Size: <strong>{maxFileSizeMB} MB</strong> &nbsp;|&nbsp;
              Conversions Left: <strong>{conversionsLeft !== null ? conversionsLeft : 'Unlimited'}</strong>
            </Typography>
          )}
          {files.length > 0 && (
            <>
              <Typography variant="body2" mt={1}>
                {files.length} file(s) selected.
              </Typography>

              <div>
                {files.map((file) => (
                  <div key={file.name} style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                    <Typography variant="body2" style={{ flex: 1 }}>
                      {file.name}
                    </Typography>
                    <IconButton onClick={() => handleFileRemove(file.name)} color="error" size="small">
                      <Delete />
                    </IconButton>
                  </div>
                ))}
              </div>
            </>
          )}

        <FormControl component="fieldset" margin="normal" sx={{ mt: 4, width: '100%' }}>
            <FormLabel 
              component="legend" 
              sx={{ 
                mb: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'text.primary',
                textAlign: 'center',
                width: '100%',
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }}
            >
              Merge as
            </FormLabel>
            <RadioGroup
              value={mergeType}
              onChange={(e) => setMergeType(e.target.value)}
              row
              sx={{ gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap' }}
            >
              {availableMergeTypes.map((type) => (
                <FormControlLabel 
                  key={type} 
                  value={type} 
                  control={
                    <Radio 
                      sx={{
                        '&.Mui-checked': {
                          color: 'primary.main'
                        },
                        '&:hover': {
                          backgroundColor: 'primary.50'
                        }
                      }}
                    />
                  } 
                  label={type.toUpperCase()}
                  sx={{
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    margin: 0,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.50'
                    },
                    '&.Mui-checked': {
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.100'
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {/* Password input for all formats except RAR */}
          {mergeType !== 'rar' && (
            <TextField
              label="Encryption Password (Optional)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          )}

          <Button
            onClick={handleMerge}
            disabled={files.length < 2 || isProcessing}
            variant="contained"
            color="primary"
            startIcon={isProcessing ? <CircularProgress size={20} /> : <ArrowRight />}
          >
            {isProcessing ? 'Processing...' : 'Merge'}
          </Button>

          <Button onClick={handleReset} startIcon={<RotateCcw />} sx={{ mt: 2 }}>
            Reset
          </Button>
        </Box>
      )}

      {/* ✅ Success Result */}
      {showDownloadContainer && conversionStatus === 'success' && result && (
        <Paper
        elevation={0}
        sx={{
          marginTop: 4,
          padding: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid rgba(34, 197, 94, 0.1)',
          width: '100%',
          maxWidth: 500,
          margin: '2rem auto',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 2.5,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              marginRight: 2,
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' },
                '50%': { boxShadow: '0 6px 20px rgba(34, 197, 94, 0.5)' },
                '100%': { boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' },
              }
            }}
          >
            <Check size={24} color="white" />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: '#15803d',
              letterSpacing: '-0.025em'
            }}
          >
            Merge Complete!
          </Typography>
        </Box>
      
        <Button
          variant="contained"
          href={`${API_URL}/download/${result.merge_id}`}
          fullWidth
          startIcon={<Download size={20} />}
          sx={{
            marginBottom: 2,
            borderRadius: 2,
            py: 1.5,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            }
          }}
        >
          Download File
        </Button>
      
        <Button
          variant="outlined"
          onClick={handleReset}
          fullWidth
          startIcon={<RotateCcw size={18} />}
          sx={{
            borderRadius: 50,
            py: 1.25,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            color: '#3b82f6',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.2s ease-in-out',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              borderColor: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.05)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
            },
            '&:active': {
              transform: 'translateY(0)',
            }
          }}
        >
          Merge More Files
        </Button>
      </Paper>
      )}

      {/* Snackbar for Duplicate File Warning */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message="This file has already been added!"
        severity="warning"
      />
    </div>
  );
}