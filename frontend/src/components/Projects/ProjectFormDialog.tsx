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
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { projectService } from '../../services/projectService';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../../types/project';

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: Project | null;
}

const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  project,
}) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    location: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      // Edit mode - populate form with existing data
      setFormData({
        name: project.name,
        clientName: project.clientName,
        clientEmail: project.clientEmail || '',
        clientPhone: project.clientPhone || '',
        clientAddress: project.clientAddress || '',
        description: project.description || '',
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        location: project.location || '',
        notes: project.notes || '',
      });
    } else {
      // Create mode - reset form
      setFormData({
        name: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'planning',
        location: '',
        notes: '',
      });
    }
    setErrors({});
  }, [project, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
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
      if (project) {
        // Update existing project
        const updateData: UpdateProjectRequest = {
          name: formData.name,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail || undefined,
          clientPhone: formData.clientPhone || undefined,
          clientAddress: formData.clientAddress || undefined,
          description: formData.description || undefined,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
        };
        await projectService.updateProject(project.id, updateData);
        showSuccess('Project updated successfully');
      } else {
        // Create new project
        await projectService.createProject(formData);
        showSuccess('Project created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.response?.data?.error || `Failed to ${project ? 'update' : 'create'} project`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'planning',
      location: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {project ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              {/* Project Information */}
              <Grid item xs={12}>
                <TextField
                  label="Project Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  error={!!errors.clientName}
                  helperText={errors.clientName}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client Email"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  error={!!errors.clientEmail}
                  helperText={errors.clientEmail}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client Phone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    label="Status"
                  >
                    <MenuItem value="planning">Planning</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate ? new Date(formData.startDate) : null}
                  onChange={(date) => setFormData({ ...formData, startDate: date ? date.toISOString().split('T')[0] : '' })}
                  slotProps={{
                    textField: {
                      error: !!errors.startDate,
                      helperText: errors.startDate,
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate ? new Date(formData.endDate) : null}
                  onChange={(date) => setFormData({ ...formData, endDate: date ? date.toISOString().split('T')[0] : '' })}
                  slotProps={{
                    textField: {
                      error: !!errors.endDate,
                      helperText: errors.endDate,
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Client Address"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ProjectFormDialog;
