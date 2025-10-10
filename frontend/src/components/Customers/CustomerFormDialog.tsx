import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { customerService } from '../../services/customerService';
import { Customer, CreateCustomerRequest } from '../../types/customer';

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  customer,
}) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    taxId: '',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      // Edit mode - populate form with existing data
      setFormData({
        companyName: customer.companyName,
        contactPerson: customer.contactPerson || '',
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode,
        country: customer.country || '',
        taxId: customer.taxId || '',
        notes: customer.notes || '',
        isActive: customer.isActive ?? true,
      });
    } else {
      // Create mode - reset form
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        taxId: '',
        notes: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [customer, open]);

  const handleChange = (field: keyof CreateCustomerRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName || formData.companyName.trim().length === 0) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.length > 100) {
      newErrors.companyName = 'Company name must be 100 characters or less';
    }

    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone || formData.phone.trim().length === 0) {
      newErrors.phone = 'Phone is required';
    }

    if (!formData.address || formData.address.trim().length === 0) {
      newErrors.address = 'Address is required';
    }

    if (!formData.postalCode || formData.postalCode.trim().length === 0) {
      newErrors.postalCode = 'Postal code is required';
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
      const cleanData: CreateCustomerRequest = {
        ...formData,
        contactPerson: formData.contactPerson || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        taxId: formData.taxId || undefined,
        notes: formData.notes || undefined,
        isActive: formData.isActive ?? true,
      };

      if (customer) {
        // Update existing customer
        await customerService.updateCustomer(customer.id, cleanData);
        showSuccess('Customer updated successfully');
      } else {
        // Create new customer
        await customerService.createCustomer(cleanData);
        showSuccess('Customer created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.response?.data?.message || `Failed to ${customer ? 'update' : 'create'} customer`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Company Information */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Company Name"
              required
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              error={!!errors.companyName}
              helperText={errors.companyName}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              required
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tax ID / VAT Number"
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
              disabled={loading}
            />
          </Grid>

          {/* Address Information */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              required
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="State / Province"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Postal Code"
              required
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              error={!!errors.postalCode}
              helperText={errors.postalCode}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              disabled={loading}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={loading}
            />
          </Grid>

          {customer && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive ?? true}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Active"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerFormDialog;

