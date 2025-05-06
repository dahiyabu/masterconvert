// components/ModeSelector.js
import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

export default function ModeSelector({ mode, setMode }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <Typography variant="h5" gutterBottom>
        What would you like to do?
      </Typography>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(e, value) => value && setMode(value)}
        color="primary"
      >
        <ToggleButton value="convert">Convert Files</ToggleButton>
        <ToggleButton value="merge">Merge Files</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}