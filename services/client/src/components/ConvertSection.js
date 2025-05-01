import { useState } from 'react';
import {
  Typography, Button, CircularProgress, TextField, Paper,
  RadioGroup, FormControlLabel, Radio, FormLabel, FormControl
} from '@mui/material';
import { Upload, ArrowRight, RotateCcw, Download, Check } from 'lucide-react';

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
    if (!fileData || !targetFormat) return;
    setConversionStatus('converting');
    try {
      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileData.file_id,
          target_format: targetFormat,
          password,
          compress_rate: compressionQuality
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setConversionResult(data);
      setConversionStatus('success');
      setShowDownloadContainer(true); // Show the download container after successful conversion
    } catch (err) {
      setErrorMessage(err.message);
      setConversionStatus('error');
    }
  };

  return (
    <div>
      {/* If there's an error due to conversion, hide everything except the error message and reset button */}
      {conversionStatus === 'error' && (
        <>
          <Typography color="error" style={{ marginTop: 20 }}>
            {errorMessage}
          </Typography>
          <div style={{ marginTop: 20 }}>
            <Button
              onClick={handleReset}
              startIcon={<RotateCcw />}
            >
              Reset
            </Button>
          </div>
        </>
      )}

      {/* Only show upload and conversion section if there's no error */}
      {conversionStatus !== 'error' && (
        <>
          {/* Upload Section */}
          {!selectedFile && !showDownloadContainer && (
            <label htmlFor="upload">
              <Button component="span" startIcon={<Upload />}>
                Upload File
              </Button>
              <input type="file" hidden id="upload" onChange={handleFileChange} />
            </label>
          )}

          {/* Uploading State */}
          {conversionStatus === 'uploading' && <Typography>Uploading...</Typography>}

          {/* File Format Selection Section */}
          {selectedFile && fileData && availableFormats.length > 0 && !showDownloadContainer && (
            <>
              <Typography variant="h6" mt={2}>Choose Format</Typography>

              {/* Display the uploaded file name and its extension */}
              <Typography variant="body1" mt={2}>
                <strong>Uploaded File:</strong> {selectedFile.name} 
                <span style={{ marginLeft: 10, fontStyle: 'italic', color: '#888' }}>
                  ({selectedFile.name.split('.').pop().toUpperCase()})
                </span>
              </Typography>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
                {availableFormats.map((fmt) => (
                  <Button
                    key={fmt}
                    variant={targetFormat === fmt ? 'contained' : 'outlined'}
                    onClick={() => {
                      setTargetFormat(fmt);
                      setShowPasswordField(encryptFormats.includes(fmt));
                      setCompressionQuality(''); // Reset compression quality
                    }}
                  >
                    {fmt}
                  </Button>
                ))}
              </div>

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
              <div style={{ marginTop: 20 }}>
                {/* Show compression options only if compression is supported for selected format */}
                {compressionQualityOptions[targetFormat] && compressionQualityOptions[targetFormat].length > 0 && (
                  <FormControl>
                    <FormLabel>Compression</FormLabel>
                    <RadioGroup row value={compressionQuality} onChange={e => setCompressionQuality(e.target.value)}>
                      {compressionQualityOptions[targetFormat].map((opt) => (
                        <FormControlLabel
                          key={opt}
                          value={opt}
                          control={<Radio />}
                          label={`compress (${opt === 'None' ? 'no compression' : `compress at ${opt}%`})`} // Adjust label here
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              </div>

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
                <Button
                  onClick={handleReset}
                  startIcon={<RotateCcw />}
                >
                  Reset
                </Button>
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
            </>
          )}

          {/* Success Result */}
          {showDownloadContainer && conversionStatus === 'success' && conversionResult && (
            <Paper
              elevation={2}
              style={{
                marginTop: '2rem',
                padding: '1.5rem',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                width: '100%',
                maxWidth: '500px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  color: '#22c55e',
                }}
              >
                <Check size={20} style={{ marginRight: 8 }} />
                <Typography fontWeight={600}>
                  Conversion Complete!
                </Typography>
              </div>

              <Button
                variant="contained"
                color="primary"
                onClick={handleDownload}
                fullWidth
                style={{ marginBottom: '1rem' }}
                startIcon={<Download size={18} />}
              >
                Download File
              </Button>

              <Button
                variant="outlined"
                color="primary"
                onClick={handleReset}
                fullWidth
                startIcon={<RotateCcw size={18} />}
                style={{
                  borderRadius: 999,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                }}
              >
                Upload Another File
              </Button>
            </Paper>
          )}
        </>
      )}
    </div>
  );
}
