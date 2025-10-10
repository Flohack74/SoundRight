import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { equipmentService } from '../../services/equipmentService';
import { Equipment, CreateEquipmentRequest } from '../../types/equipment';

interface EquipmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment?: Equipment | null;
}

const EquipmentFormDialog: React.FC<EquipmentFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  equipment,
}) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEquipmentRequest>({
    name: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    description: '',
    specifications: '',
    purchaseDate: '',
    purchasePrice: undefined,
    currentValue: undefined,
    conditionStatus: 'good',
    location: '',
    isAvailable: true,
    maintenanceNotes: '',
    lastMaintenance: '',
    nextMaintenance: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      // Edit mode - populate form with existing data
      setFormData({
        name: equipment.name,
        category: equipment.category,
        brand: equipment.brand || '',
        model: equipment.model || '',
        serialNumber: equipment.serialNumber || '',
        description: equipment.description || '',
        specifications: equipment.specifications || '',
        purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.split('T')[0] : '',
        purchasePrice: equipment.purchasePrice,
        currentValue: equipment.currentValue,
        conditionStatus: equipment.conditionStatus,
        location: equipment.location || '',
        isAvailable: equipment.isAvailable,
        maintenanceNotes: equipment.maintenanceNotes || '',
        lastMaintenance: equipment.lastMaintenance ? equipment.lastMaintenance.split('T')[0] : '',
        nextMaintenance: equipment.nextMaintenance ? equipment.nextMaintenance.split('T')[0] : '',
      });
    } else {
      // Create mode - reset form
      setFormData({
        name: '',
        category: '',
        brand: '',
        model: '',
        serialNumber: '',
        description: '',
        specifications: '',
        purchaseDate: '',
        purchasePrice: undefined,
        currentValue: undefined,
        conditionStatus: 'good',
        location: '',
        isAvailable: true,
        maintenanceNotes: '',
        lastMaintenance: '',
        nextMaintenance: '',
      });
    }
    setErrors({});
  }, [equipment, open]);

  const handleChange = (field: keyof CreateEquipmentRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!formData.category || formData.category.trim().length === 0) {
      newErrors.category = 'Category is required';
    } else if (formData.category.length > 50) {
      newErrors.category = 'Category must be 50 characters or less';
    }

    if (formData.purchasePrice !== undefined && formData.purchasePrice < 0) {
      newErrors.purchasePrice = 'Purchase price cannot be negative';
    }

    if (formData.currentValue !== undefined && formData.currentValue < 0) {
      newErrors.currentValue = 'Current value cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData: CreateEquipmentRequest = {
        ...formData,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        description: formData.description || undefined,
        specifications: formData.specifications || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        location: formData.location || undefined,
        maintenanceNotes: formData.maintenanceNotes || undefined,
        lastMaintenance: formData.lastMaintenance || undefined,
        nextMaintenance: formData.nextMaintenance || undefined,
      };

      if (equipment) {
        // Update existing equipment
        await equipmentService.updateEquipment(equipment.id, cleanData);
        showSuccess('Equipment updated successfully');
      } else {
        // Create new equipment
        await equipmentService.createEquipment(cleanData);
        showSuccess('Equipment created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.response?.data?.message || `Failed to ${equipment ? 'update' : 'create'} equipment`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{equipment ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              required
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              error={!!errors.category}
              helperText={errors.category}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Brand"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Serial Number"
              value={formData.serialNumber}
              onChange={(e) => handleChange('serialNumber', e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              disabled={loading}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Specifications"
              multiline
              rows={2}
              value={formData.specifications}
              onChange={(e) => handleChange('specifications', e.target.value)}
              disabled={loading}
            />
          </Grid>

          {/* Purchase Information */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Purchase Price"
              type="number"
              value={formData.purchasePrice ?? ''}
              onChange={(e) => handleChange('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              error={!!errors.purchasePrice}
              helperText={errors.purchasePrice}
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Current Value"
              type="number"
              value={formData.currentValue ?? ''}
              onChange={(e) => handleChange('currentValue', e.target.value ? parseFloat(e.target.value) : undefined)}
              error={!!errors.currentValue}
              helperText={errors.currentValue}
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          {/* Condition and Availability */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Condition Status</InputLabel>
              <Select
                value={formData.conditionStatus}
                label="Condition Status"
                onChange={(e) => handleChange('conditionStatus', e.target.value)}
                disabled={loading}
              >
                <MenuItem value="excellent">Excellent</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
                <MenuItem value="repair">Repair</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isAvailable}
                  onChange={(e) => handleChange('isAvailable', e.target.checked)}
                  disabled={loading}
                />
              }
              label="Available for allocation"
              sx={{ mt: 1 }}
            />
          </Grid>

          {/* Maintenance Information */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Maintenance Notes"
              multiline
              rows={2}
              value={formData.maintenanceNotes}
              onChange={(e) => handleChange('maintenanceNotes', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Maintenance"
              type="date"
              value={formData.lastMaintenance}
              onChange={(e) => handleChange('lastMaintenance', e.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Next Maintenance"
              type="date"
              value={formData.nextMaintenance}
              onChange={(e) => handleChange('nextMaintenance', e.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : equipment ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentFormDialog;

