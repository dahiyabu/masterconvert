import { useState } from 'react';
import ModeSelector from './components/ModeSelector';
import ConvertSection from './components/ConvertSection';
import MergeSection from './components/MergeSection';
import { Container, Paper } from '@mui/material';

export default function FileConvertApp() {
  const [mode, setMode] = useState('convert');
  const API_URL = 'http://localhost:5000/api'; // Your API URL

  return (
    <Container maxWidth="sm" style={{ marginTop: '3rem' }}>
      <Paper elevation={3} style={{ padding: '2rem', borderRadius: '16px' }}>
        <ModeSelector mode={mode} setMode={setMode} />
        {mode === 'convert' ? (
          <ConvertSection API_URL={API_URL} />
        ) : (
          <MergeSection API_URL={API_URL} />
        )}
      </Paper>
    </Container>
  );
}