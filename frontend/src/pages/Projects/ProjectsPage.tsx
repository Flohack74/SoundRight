import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

const ProjectsPage: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement project creation
          }}
        >
          New Project
        </Button>
      </Box>
      
      <Typography variant="body1" color="text.secondary">
        Project management functionality coming soon!
      </Typography>
    </Box>
  );
};

export default ProjectsPage;
