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
import FingerprintJS from "@fingerprintjs/fingerprintjs";


export default function ConvertSection({ API_URL }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [availableFormats, setAvailableFormats] = useState([]);
  const [targetFormat, setTargetFormat] = useState('');
  const [conversionStatus, setConversionStatus] = useState('idle');
  const [conversionResult, setConversionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [encryptFormats, setEncryptFormats] = useState([]);
  const [compressionQualityOptions, setCompressionQualityOptions] = useState({});
  const [compressionQuality, setCompressionQuality] = useState('');
  const [showDownloadContainer, setShowDownloadContainer] = useState(false);
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

  const handleReset = () => {
    // Resetting the component state but not reloading the page
    setSelectedFile(null);
    setFileData(null);
    setAvailableFormats([]);
    setEncryptFormats([]);
    setCompressionQualityOptions({});
    setTargetFormat('');
    setConversionStatus('idle');
    setConversionResult(null);
    setErrorMessage('');
    setPassword(''); // Also clear the password field
    setShowDownloadContainer(false); // Hide the download container on reset.
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeLimitMB = maxFileSizeMB || 50;
    const MAX_FILE_SIZE_BYTES = fileSizeLimitMB * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File size exceeds the ${fileSizeLimitMB}MB limit.`);
      setConversionStatus('error');
      return;
    }
    setSelectedFile(file);
    setConversionStatus('uploading');
    setErrorMessage('');
    setConversionResult(null);
    setShowDownloadContainer(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setFileData(data);
      setAvailableFormats(data.compatible_formats);
      setEncryptFormats(data.allowed_encrypt_extensions || []);
      setCompressionQualityOptions(data.compressed_quality || {});
      setConversionStatus('idle');
    } catch (err) {
      setErrorMessage(err.message);
      setConversionStatus('error');
    }
  };

  const handleConvert = async () => {
    if (!fileData || !targetFormat|| !fingerprint) return;
    setConversionStatus('converting');
    try {
      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileData.file_id,
          target_format: targetFormat,
          password,
          compress_rate: compressionQuality,
          fingerprint
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setConversionResult(data);
      setConversionStatus('success');
      setShowDownloadContainer(true); // Show the download container after successful conversion
      await fetchAccountLimits(); // Reset limits
    } catch (err) {
      setErrorMessage(err.message);
      setConversionStatus('error');
    }
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


      {/* Only show upload and conversion section if there's no error */}
      {conversionStatus !== 'error' && (
        <>
          {/* Display limits */}
          {maxFileSizeMB  && (
            <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Max File Size: <strong>{maxFileSizeMB} MB</strong> &nbsp;|&nbsp; 
                Conversions Left: <strong>{conversionsLeft !== null ? conversionsLeft : 'Unlimited'}</strong>
              </Typography>
            </Box>
          )}
          {/* Upload Section */}
          {!selectedFile && !showDownloadContainer && (
            <UploadFileButton handleFileChange={handleFileChange} />

          )}

          {/* Uploading State */}
          {conversionStatus === 'uploading' && <Typography>Uploading...</Typography>}

          {/* File Format Selection Section */}
          {selectedFile && fileData && availableFormats.length > 0 && !showDownloadContainer && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, mt: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'text.primary',
                textAlign: 'center'
              }}
            >
              Choose Format
            </Typography>

              {/* Display the uploaded file name and its extension */}
  <Box sx={{ textAlign: 'center', maxWidth: '500px' }}>
    <Typography variant="body1" sx={{ mb: 1 }}>
      <strong>Uploaded File:</strong> {selectedFile.name}
    </Typography>
    <Chip 
      label={selectedFile.name.split('.').pop().toUpperCase()}
      variant="outlined"
      size="small"
      sx={{ 
        backgroundColor: 'grey.100',
        color: 'text.secondary',
        fontStyle: 'italic'
      }}
    />
  </Box>

              {/* Format Selection */}
  <Box sx={{ width: '100%', maxWidth: '600px' }}>
    <Typography 
      variant="body2" 
      color="text.secondary" 
      sx={{ textAlign: 'center', mb: 2 }}
    >
      Select your desired output format
    </Typography>
    
    <Box sx={{ 
      display: 'flex', 
      gap: 1.5, 
      flexWrap: 'wrap', 
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {availableFormats.map((fmt) => (
        <Button
          key={fmt}
          variant={targetFormat === fmt ? 'contained' : 'outlined'}
          onClick={() => {
            setTargetFormat(fmt);
            setShowPasswordField(encryptFormats.includes(fmt));
            setCompressionQuality(''); // Reset compression quality
          }}
          sx={{
            minWidth: '80px',
            borderRadius: 2,
            textTransform: 'uppercase',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease-in-out',
            ...(targetFormat === fmt && {
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }),
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: targetFormat === fmt 
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

              {/* Compression Explanation */}
              {compressionQualityOptions[targetFormat] && compressionQualityOptions[targetFormat].length > 0 && (
                <Typography variant="body2" color="textSecondary" paragraph>
                  Compression options: 
                  <strong>
                    Low means high compression but poor file quality. Medium and high mean less compression and better quality.
                  </strong>
                </Typography>
              )}

              {/* Compression section */}
              <Box sx={{ mt: 3 }}>
                {/* Show compression options only if compression is supported for selected format */}
                {compressionQualityOptions[targetFormat] && compressionQualityOptions[targetFormat].length > 0 && (
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
                      Compression
                    </FormLabel>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                      Choose your preferred compression level
                    </Typography>
                    
                    <RadioGroup
                      value={compressionQuality}
                      onChange={(e) => setCompressionQuality(e.target.value)}
                      sx={{ 
                        gap: 2,
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                      }}
                    >
                      {compressionQualityOptions[targetFormat].map((opt) => (
                        <FormControlLabel 
                          key={opt} 
                          value={opt} 
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
                          label={opt === 'None' ? 'No compression' : `Compress at ${opt}%`}
                          sx={{
                            backgroundColor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            margin: 0,
                            transition: 'all 0.2s ease-in-out',
                            position: 'relative',
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'primary.50'
                            },
                            '& .MuiFormControlLabel-root': {
                              '&.Mui-checked': {
                                borderColor: 'primary.main',
                                backgroundColor: 'primary.100'
                              }
                            },
                            ...(compressionQuality === opt && {
                              borderColor: 'primary.main',
                              backgroundColor: 'primary.100'
                            })
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              </Box>
              <div style={{ width: '100%' }}>
                {showPasswordField && (
                  <TextField
                    label="Encrypt Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                )}
              </div>

              {/* Reset button shown after file is uploaded */}
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>
              <div style={{ marginTop: 20 }}>
                <Button
                  onClick={handleConvert}
                  disabled={!targetFormat || conversionStatus === 'converting'}
                  variant="contained"
                  color="primary"
                  startIcon={conversionStatus === 'converting' ? <CircularProgress size={20} /> : <ArrowRight />}
                >
                  {conversionStatus === 'converting' ? 'Converting...' : 'Convert'}
                </Button>
              </div>
            </Box>
          )}

          {/* Success Result */}
          {showDownloadContainer && conversionStatus === 'success' && conversionResult && (
            <Paper
              elevation={0}
              style={{
                margin: '2rem auto',
                padding: '2rem',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1px solid rgba(34, 197, 94, 0.1)',
                width: '100%',
                maxWidth: '500px',
                position: 'relative',
                overflow: 'hidden',
                display: 'block',
              }}
            >
              {/* Subtle background pattern */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)',
                  pointerEvents: 'none',
                }}
              />
              
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  color: '#22c55e',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    marginRight: '12px',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <Check size={24} />
                </div>
                <Typography 
                  fontWeight={700}
                  fontSize="1.25rem"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Conversion Complete!
                </Typography>
              </div>

              <Button
                variant="contained"
                onClick={handleDownload}
                fullWidth
                style={{ 
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '16px',
                  padding: '14px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                  border: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  }
                }}
                startIcon={<Download size={20} />}
              >
                Download File
              </Button>

              <Button
                variant="outlined"
                onClick={handleReset}
                fullWidth
                startIcon={<RotateCcw size={18} />}
                style={{
                  borderRadius: '16px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  padding: '12px 24px',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Upload Another File
              </Button>

              <style jsx>{`
                @keyframes pulse {
                  0%, 100% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.7;
                  }
                }
              `}</style>
            </Paper>
        )}
        </>
      )}
    </div>
  );
}
