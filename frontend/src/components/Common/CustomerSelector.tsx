import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types/customer';

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  value,
  onChange,
  error,
  helperText,
  disabled,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (searchTerm?: string) => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers({
        search: searchTerm,
        active: 'true', // Only show active customers
        limit: 50, // Limit results for better performance
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (newInputValue.length >= 2) {
        fetchCustomers(newInputValue);
      } else if (newInputValue.length === 0) {
        fetchCustomers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: Customer | null) => {
    onChange(newValue);
  };

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={customers}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return `${option.companyName}${option.contactPerson ? ` (${option.contactPerson})` : ''}`;
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Customer"
          placeholder="Search customers..."
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {option.companyName}
            </Typography>
            {option.contactPerson && (
              <Typography variant="body2" color="text.secondary">
                Contact: {option.contactPerson}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {option.email} • {option.phone}
            </Typography>
            {option.address && (
              <Typography variant="body2" color="text.secondary">
                {option.address}
                {option.city && `, ${option.city}`}
                {option.postalCode && ` ${option.postalCode}`}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={`${option.companyName}${option.contactPerson ? ` (${option.contactPerson})` : ''}`}
            variant="outlined"
          />
        ))
      }
      noOptionsText="No customers found"
      clearOnEscape
      selectOnFocus
      handleHomeEndKeys
    />
  );
};

export default CustomerSelector;
