import { useState, useEffect } from 'react';
import {
  Typography, Button, CircularProgress, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, TextField, IconButton, Snackbar, Paper
} from '@mui/material';
import { Upload, ArrowRight, RotateCcw, Delete, Download } from 'lucide-react';
import { Check } from '@mui/icons-material';
import UploadFileButton from './UploadFileButton';
import Box from '@mui/material/Box';

export default function MergeSection({ API_URL }) {
  const [files, setFiles] = useState([]);
  const [mergeType, setMergeType] = useState('zip');  // Default to 'zip' initially
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [compatibleFormats, setCompatibleFormats] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);  // Snackbar for duplicate file warning
  const [availableMergeTypes, setAvailableMergeTypes] = useState(['pdf', 'zip', 'tar', '7z']); // Removed 'rar' option
  const [conversionStatus, setConversionStatus] = useState('idle'); // idle, processing, success, error
  const [showDownloadContainer, setShowDownloadContainer] = useState(false); // Manage download container visibility

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
    const newFiles = Array.from(e.target.files);
    const newFilesToAdd = newFiles.filter((newFile) => {
      // Check if the file is already in the files array by comparing the file name
      return !files.some((existingFile) => existingFile.name === newFile.name);
    });

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

    try {
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
    } catch (err) {
      setConversionStatus('error'); // Set to error on failure
      alert(err.message);
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
      {!showDownloadContainer && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <UploadFileButton handleFileChange={handleFileChange} />

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
              Merge Complete!
            </Typography>
          </div>

          <Button
            variant="contained"
            color="primary"
            href={`${API_URL}/download/${result.merge_id}`}
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