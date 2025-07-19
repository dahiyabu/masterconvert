import { useState,useEffect,useCallback } from 'react';
import {
  Typography, Button, CircularProgress, TextField, Paper,
  RadioGroup, FormControlLabel, Radio, FormLabel, FormControl
} from '@mui/material';
import { ArrowRight, RotateCcw, Download, Check } from 'lucide-react';
import { Alert } from '@mui/material';
import UploadFileButton from './UploadFileButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

export default function ConvertSection({ API_URL }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [allFormats, setAllFormats] = useState({});
  const [compressedQuality, setCompressedQuality] = useState({});
  const [allowedCompressExtensions, setAllowedCompressExtensions] = useState([]);
  const [allowedEncryptExtensions, setAllowedEncryptExtensions] = useState([]);
  const [fileCategories, setFileCategories] = useState({});
  const [conversionStatus, setConversionStatus] = useState('idle');
  const [conversionResult, setConversionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDownloadContainer, setShowDownloadContainer] = useState(false);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(1024);

  const MAX_FILES_LIMIT = 1;

  const fetchFormats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/formats?conversion_type=basic`);
      const data = await response.json();
  
      if (!response.ok) throw new Error(data.error || 'Failed to fetch formats');
  
      setAllFormats(data.format_compatibility || {});
      setCompressedQuality(data.compression_quality || {});
      setAllowedCompressExtensions(data.allowed_compress_extentions || []);
      setFileCategories(data.file_categories || {});
      setAllowedEncryptExtensions(data.allowed_encrypt_extensions || []);
    } catch (err) {
      console.error('Error fetching formats:', err);
    }
  }, []);

  useEffect(() => {
      fetchFormats();
  }, [fetchFormats]);  // Dependency on fingerprint

/*
  const handleDownload = () => {
    if (!conversionResult) return;
    const downloadUrl = `${API_URL}/download/${conversionResult.conversion_id}?name=${encodeURIComponent(fileData.original_name.split('.')[0] + '.' + targetFormat)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
*/
  const handleClose = () => {
    setConversionStatus('idle');
  }

  const handleReset = () => {
    // Resetting the component state but not reloading the page
    setSelectedFiles([]);
    setConversionStatus('idle');
    setConversionResult(null);
    setErrorMessage('');
    setShowDownloadContainer(false);
    
    //setFileData(null);
    setConversionStatus('idle');
    setConversionResult(null);
    setErrorMessage('');
    setShowDownloadContainer(false); // Hide the download container on reset.
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Check if adding new files would exceed the limit
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > MAX_FILES_LIMIT) {
      setErrorMessage(`You can only convert a maximum of ${MAX_FILES_LIMIT} files at once. You currently have ${selectedFiles.length} files selected and trying to add ${files.length} more.`);
      setConversionStatus('error');
      return;
    }

    const fileSizeLimitMB = maxFileSizeMB || 50;
    const MAX_FILE_SIZE_BYTES = fileSizeLimitMB * 1024 * 1024;

    const newFiles = [];

    for (const file of files) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const availableFormats = allFormats[fileExtension] || [];
      
      let error = null;
      // Check if file type is supported
      if (availableFormats.length === 0) {
        error = `File type '${fileExtension}' not supported.`;
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        error = `File size exceeds the ${fileSizeLimitMB}MB limit.`;
      }
      const compressionCategory = fileCategories[fileExtension] || 'Documents';
      newFiles.push({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        extension: fileExtension,
        availableFormats,
        compressionCategory,
        targetFormat: '',
        password: '',
        compressionQuality: '',
        error, // Store error per file
        supportsPassword: false, // Will be determined when target format is selected
        supportsCompression: false // Will be determined when target format is selected
      });
    }
  
    // Add new files to existing ones instead of replacing
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    setConversionStatus('idle');
    setErrorMessage('');
    setConversionResult(null);
    setShowDownloadContainer(false);
  };

  const handleConvert = async () => {
    const validFiles = selectedFiles.filter(file => !file.error && file.targetFormat);
    if (!validFiles.length) return;
    // Check if all files have target formats
    setConversionStatus('converting');
    try {
      const conversions = selectedFiles.map(file => ({
        file_name: file.name,
        target_format: file.targetFormat,
        password: file.password || '',
        compress_rate: file.compressionQuality || '',
      }));
      const formData = new FormData();
      selectedFiles.forEach(fileData => {
        formData.append('files', fileData.file);
      });
      formData.append('conversions', JSON.stringify(conversions));
      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        body: formData
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Always show the download container regardless of success/failure
      setConversionResult(data);
      setConversionStatus('success'); // We use 'success' status to show results, even if some failed
      setShowDownloadContainer(true);
      } catch (err) {
      setErrorMessage(err.message);
      setConversionStatus('error');
    }
  };

  const updateFileTargetFormat = (index, targetFormat) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index].targetFormat = targetFormat;
    updatedFiles[index].compressionQuality = '';
    updatedFiles[index].password = '';
    
    // Determine support based on target format
    updatedFiles[index].supportsPassword = allowedEncryptExtensions.includes(targetFormat);
    updatedFiles[index].supportsCompression = allowedCompressExtensions.includes(targetFormat);
    
    setSelectedFiles(updatedFiles);
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
                    variant="outlined"
                    color="error"
                    onClick={handleReset}
                    startIcon={<RotateCcw />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleClose}
                    startIcon={<RotateCcw />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Close
                  </Button>
                </Box>
              </Alert>        
      )}


      {/* Only show upload and conversion section if there's no error */}
      {conversionStatus !== 'error' && (
        <>
          {/* Display limits */}
          {maxFileSizeMB  && (
            <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Max File Size: <strong>{maxFileSizeMB} MB</strong> &nbsp;|&nbsp; 
                Conversions Left: <strong>{'Unlimited'}</strong>
              </Typography>
            </Box>
          )}
          {/* Upload Section */}
          {selectedFiles.length === 0 && !showDownloadContainer && (
            <UploadFileButton handleFileChange={handleFileChange} />
          )}

          {/* Uploading State */}
          {conversionStatus === 'uploading' && <Typography>Uploading...</Typography>}

          {/* File Format Selection Section */}
          {selectedFiles.length > 0 && !showDownloadContainer && (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, mt: 2 }}>
    <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
      Configure Files ({selectedFiles.length})
    </Typography>

    {selectedFiles.map((fileData, index) => (
      <Paper 
        key={fileData.id} 
        sx={{ 
          p: 3, 
          width: '100%', 
          maxWidth: '600px', 
          mb: 2, 
          position: 'relative',
          ...(fileData.error && {
            borderColor: 'error.main',
            borderWidth: 2,
            backgroundColor: 'error.50'
          })
        }}
      >
        {/* Remove button */}
        <Button
          onClick={() => removeFile(fileData.id)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            minWidth: 'auto',
            width: 32,
            height: 32,
            borderRadius: '50%',
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.50'
            }
          }}
        >
          ×
        </Button>

        <Box sx={{ textAlign: 'center', mb: 2, pr: 4 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>{fileData.name}</strong>
          </Typography>
          <Chip 
            label={fileData.extension.toUpperCase()}
            variant="outlined"
            size="small"
            sx={{ backgroundColor: 'grey.100', color: 'text.secondary' }}
          />
        </Box>

        {/* Error message for this specific file */}
        {fileData.error && (
          <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            {fileData.error}
          </Typography>
        </Alert>
        )}

        {/* Format Selection - only show if no error */}
        {!fileData.error && fileData.availableFormats.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
              Select output format
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {fileData.availableFormats.map((fmt) => (
                <Button
                  key={fmt}
                  variant={fileData.targetFormat === fmt ? 'contained' : 'outlined'}
                  onClick={() => updateFileTargetFormat(index, fmt)}
                  sx={{ 
                    minWidth: '80px', 
                    borderRadius: 2, 
                    textTransform: 'uppercase', 
                    fontWeight: 600, 
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease-in-out',
                    ...(fileData.targetFormat === fmt && {
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                    }),
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: fileData.targetFormat === fmt 
                        ? '0 6px 16px rgba(25, 118, 210, 0.4)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {fmt}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* Compression Options - based on target format 
        {!fileData.error && fileData.supportsCompression && fileData.targetFormat && compressedQuality[fileData.compressionCategory] && (
          <Box sx={{ mb: 2 }}>
            <FormControl component="fieldset" margin="normal" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600, color: 'text.primary' }}>
                Compression
              </FormLabel>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Choose your preferred compression level
              </Typography>
              <RadioGroup
                value={fileData.compressionQuality}
                onChange={(e) => {
                  const updatedFiles = [...selectedFiles];
                  updatedFiles[index].compressionQuality = e.target.value;
                  setSelectedFiles(updatedFiles);
                }}
                sx={{ gap: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}
              >
                {compressedQuality[fileData.compressionCategory].map((opt) => (
                  <FormControlLabel 
                    key={opt} 
                    value={opt} 
                    control={<Radio sx={{ '&.Mui-checked': { color: 'primary.main' } }} />} 
                    label={opt === 'None' ? 'No compression' : `${opt}`}
                    sx={{ 
                      backgroundColor: 'background.paper', 
                      border: '1px solid', 
                      borderColor: fileData.compressionQuality === opt ? 'primary.main' : 'divider',
                      borderRadius: 2, 
                      px: 2, 
                      py: 1, 
                      margin: 0,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.50'
                      },
                      ...(fileData.compressionQuality === opt && {
                        backgroundColor: 'primary.100'
                      })
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Password Field - based on target format 
        {!fileData.error && fileData.supportsPassword && fileData.targetFormat && (
          <TextField
            label="Encrypt Password"
            type="password"
            value={fileData.password}
            onChange={(e) => {
              const updatedFiles = [...selectedFiles];
              updatedFiles[index].password = e.target.value;
              setSelectedFiles(updatedFiles);
            }}
            fullWidth
            margin="normal"
            sx={{ mt: 2 }}
          />
        )}*/}
      </Paper>
    ))}

    {/* Add more files button */}
    {conversionStatus !== 'converting' && (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="add-more-files"
      />
      <label htmlFor="add-more-files">
        <Button
          variant="outlined"
          component="span"
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Add More Files
        </Button>
      </label>
    </Box>
    )}

    {/* Reset and Convert buttons */}
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Button onClick={handleReset} variant="outlined" startIcon={<RotateCcw />}>
        Reset All
      </Button>
      <Button
        onClick={handleConvert}
        disabled={
          selectedFiles.some(file => file.error || !file.targetFormat) || 
          conversionStatus === 'converting' ||
          selectedFiles.length === 0
        }
        variant="contained"
        color="primary"
        startIcon={conversionStatus === 'converting' ? <CircularProgress size={20} /> : <ArrowRight />}
      >
        {conversionStatus === 'converting' ? 'Converting...' : `Convert All (${selectedFiles.filter(f => !f.error).length})`}
      </Button>
    </Box>
  </Box>
)}

          {/* Success Result */}
  {/* Success Result */}
{/* Success Result */}
{showDownloadContainer && conversionStatus === 'success' && conversionResult && (
  <Paper elevation={0} style={{ margin: '2rem auto', padding: '2rem', borderRadius: '24px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1px solid rgba(34, 197, 94, 0.1)', width: '100%', maxWidth: '600px' }}>
    <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, color: '#22c55e' }}>
      Conversion Results ({conversionResult.total_converted || 0} successful, {conversionResult.total_failed || 0} failed)
    </Typography>
    
    {/* Debug: Show the entire conversionResult structure 
    {process.env.NODE_ENV === 'development' && (
      <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
        {JSON.stringify(conversionResult, null, 2)}
      </pre>
    )}
    */}
    {/* Successful files */}
    {conversionResult.files && conversionResult.files.map((file, index) => (
      <Box key={`success-${index}`} sx={{ 
        mb: 2, 
        p: 2, 
        border: '1px solid', 
        borderColor: 'success.main',
        borderRadius: 2,
        backgroundColor: 'success.50'
      }}>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
          {file.original_name || file.file_name || `File ${index + 1}`}
        </Typography>
        
        <Typography variant="body2" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <Check size={16} style={{ marginRight: '8px' }} />
          → {file.converted_name || file.output_name}
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            const downloadUrl = `${API_URL}/download/${file.conversion_id}?name=${encodeURIComponent(file.converted_name || file.output_name)}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', '');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          startIcon={<Download size={20} />}
          sx={{ mr: 1 }}
        >
          Download
        </Button>
      </Box>
    ))}

    {/* Failed files */}
    {conversionResult.failed_files && conversionResult.failed_files.map((file, index) => (
      <Box key={`failed-${index}`} sx={{ 
        mb: 2, 
        p: 2, 
        border: '1px solid', 
        borderColor: 'error.main',
        borderRadius: 2,
        backgroundColor: 'error.50'
      }}>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
          {file.file_name || `File ${index + 1}`}
        </Typography>
        
        <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
          Error: {file.error || 'Conversion failed'}
        </Typography>
      </Box>
    ))}

    {/* Show message if no files at all */}
    {(!conversionResult.files || conversionResult.files.length === 0) && 
     (!conversionResult.failed_files || conversionResult.failed_files.length === 0) && (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
        No conversion results available. Please check your backend response.
      </Typography>
    )}

    <Button
      variant="outlined"
      onClick={handleReset}
      fullWidth
      startIcon={<RotateCcw size={18} />}
      sx={{ mt: 2 }}
    >
      Upload More Files
    </Button>
  </Paper>
)}
        </>
      )}
    </div>
  );
}
