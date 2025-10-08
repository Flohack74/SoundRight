import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

const UsersPage: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement user creation
          }}
        >
          New User
        </Button>
      </Box>
      
      <Typography variant="body1" color="text.secondary">
        User management functionality coming soon!
      </Typography>
    </Box>
  );
};

export default UsersPage;
