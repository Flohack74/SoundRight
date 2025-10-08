import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

const QuotesPage: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Quotes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement quote creation
          }}
        >
          New Quote
        </Button>
      </Box>
      
      <Typography variant="body1" color="text.secondary">
        Quote generation functionality coming soon!
      </Typography>
    </Box>
  );
};

export default QuotesPage;
