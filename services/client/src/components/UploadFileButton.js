import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import UploadIcon from '@mui/icons-material/Upload';

const UploadLabel = styled('label')(({ theme }) => ({
  display: 'inline-block',
  cursor: 'pointer',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    opacity: 0.9,
  },
}));

function UploadFileButton({ handleFileChange }) {
  return (
    <UploadLabel htmlFor="upload">
      <input
        type="file"
        hidden
        multiple
        id="upload"
        onChange={handleFileChange}
      />
      <Button
        variant="contained"
        component="span"
        startIcon={<UploadIcon />}
        sx={{
          paddingX: 3,
          paddingY: 1.5,
          fontWeight: 'bold',
          borderRadius: 3,
          background: 'linear-gradient(to right, #6366f1, #3b82f6)',
          color: 'white',
          textTransform: 'none',
          fontSize: '1rem',
          boxShadow: 3,
          '&:hover': {
            background: 'linear-gradient(to right, #4f46e5, #2563eb)',
          },
        }}
      >
        Upload File
      </Button>
    </UploadLabel>
  );
}

export default UploadFileButton;