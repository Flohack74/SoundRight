import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

const DeliveryPage: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Delivery Notes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement delivery note creation
          }}
        >
          New Delivery Note
        </Button>
      </Box>
      
      <Typography variant="body1" color="text.secondary">
        Delivery note functionality coming soon!
      </Typography>
    </Box>
  );
};

export default DeliveryPage;
