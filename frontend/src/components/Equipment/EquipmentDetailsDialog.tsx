import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Equipment } from '../../types/equipment';

interface EquipmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  equipment: Equipment | null;
}

const EquipmentDetailsDialog: React.FC<EquipmentDetailsDialogProps> = ({
  open,
  onClose,
  equipment,
}) => {
  if (!equipment) return null;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getConditionColor = (condition?: string) => {
    if (!condition) return 'default';
    switch (condition) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'primary';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      case 'repair':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatConditionStatus = (status?: string): string => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const DetailRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body1">{value || 'N/A'}</Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Equipment Details</DialogTitle>
      <DialogContent>
        {/* Basic Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Name" value={equipment.name} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Category" value={equipment.category} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Brand" value={equipment.brand} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Model" value={equipment.model} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Serial Number" value={equipment.serialNumber} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Location" value={equipment.location} />
            </Grid>
            <Grid item xs={12}>
              <DetailRow label="Description" value={equipment.description} />
            </Grid>
            <Grid item xs={12}>
              <DetailRow label="Specifications" value={equipment.specifications} />
            </Grid>
          </Grid>
        </Box>

        {/* Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Status
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Condition
                </Typography>
                <Chip
                  label={formatConditionStatus(equipment.conditionStatus)}
                  color={getConditionColor(equipment.conditionStatus) as any}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Availability
                </Typography>
                <Chip
                  label={equipment.isAvailable !== undefined ? (equipment.isAvailable ? 'Available' : 'Allocated') : 'N/A'}
                  color={equipment.isAvailable ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Financial Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Financial Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <DetailRow label="Purchase Date" value={formatDate(equipment.purchaseDate)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DetailRow label="Purchase Price" value={formatCurrency(equipment.purchasePrice)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DetailRow label="Current Value" value={formatCurrency(equipment.currentValue)} />
            </Grid>
          </Grid>
        </Box>

        {/* Maintenance Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Maintenance Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DetailRow label="Maintenance Notes" value={equipment.maintenanceNotes} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Last Maintenance" value={formatDate(equipment.lastMaintenance)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Next Maintenance" value={formatDate(equipment.nextMaintenance)} />
            </Grid>
          </Grid>
        </Box>

        {/* System Information */}
        <Box>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Created" value={formatDate(equipment.createdAt)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DetailRow label="Last Updated" value={formatDate(equipment.updatedAt)} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentDetailsDialog;

