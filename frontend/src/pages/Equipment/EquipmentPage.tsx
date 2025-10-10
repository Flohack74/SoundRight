import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  ViewModule,
  ViewList,
} from '@mui/icons-material';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { equipmentService } from '../../services/equipmentService';
import { Equipment, EquipmentFilters } from '../../types/equipment';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EquipmentFormDialog from '../../components/Equipment/EquipmentFormDialog';
import EquipmentDetailsDialog from '../../components/Equipment/EquipmentDetailsDialog';

const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<EquipmentFilters>({
    page: 1,
    limit: 12,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { showSuccess, showError } = useSnackbar();

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await equipmentService.getEquipment(filters);
      setEquipment(response.data);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      showError('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: value || undefined,
        page: 1,
      }));
    }, 500);
  };

  const handleFilterChange = (key: keyof EquipmentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, equipment: Equipment) => {
    setAnchorEl(event.currentTarget);
    setSelectedEquipment(equipment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddClick = () => {
    setEditingEquipment(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = () => {
    if (selectedEquipment) {
      setEditingEquipment(selectedEquipment);
      setFormDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
    handleMenuClose();
  };

  const handleFormSuccess = () => {
    fetchEquipment();
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditingEquipment(null);
  };

  const handleDetailsClose = () => {
    setDetailsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedEquipment) return;

    try {
      await equipmentService.deleteEquipment(selectedEquipment.id);
      showSuccess('Equipment deleted successfully');
      fetchEquipment();
    } catch (error) {
      showError('Failed to delete equipment');
    } finally {
      setDeleteDialogOpen(false);
      handleMenuClose();
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      case 'repair': return 'error';
      default: return 'default';
    }
  };

  if (loading && equipment.length === 0) {
    return <LoadingSpinner message="Loading equipment..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Equipment Inventory
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => {
              if (newMode !== null) {
                setViewMode(newMode);
              }
            }}
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModule />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewList />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddClick}
          >
            Add Equipment
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Microphones">Microphones</MenuItem>
                  <MenuItem value="Speakers">Speakers</MenuItem>
                  <MenuItem value="Mixers">Mixers</MenuItem>
                  <MenuItem value="Amplifiers">Amplifiers</MenuItem>
                  <MenuItem value="Cables">Cables</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={filters.condition || ''}
                  label="Condition"
                  onChange={(e) => handleFilterChange('condition', e.target.value || undefined)}
                >
                  <MenuItem value="">All Conditions</MenuItem>
                  <MenuItem value="excellent">Excellent</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={filters.available === undefined ? '' : filters.available.toString()}
                  label="Availability"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('available', value === '' ? undefined : value === 'true');
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Available</MenuItem>
                  <MenuItem value="false">Allocated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Equipment Display */}
      {loading ? (
        <LoadingSpinner message="Loading equipment..." />
      ) : (
        <>
          {viewMode === 'grid' ? (
            /* Grid View */
            <Grid container spacing={3}>
              {equipment.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h2" noWrap>
                          {item.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.category}
                      </Typography>
                      
                      {item.brand && item.model && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {item.brand} {item.model}
                        </Typography>
                      )}
                      
                      <Box display="flex" gap={1} mb={2}>
                        <Chip
                          label={item.conditionStatus}
                          color={getConditionColor(item.conditionStatus) as any}
                          size="small"
                        />
                        <Chip
                          label={item.isAvailable ? 'Available' : 'Allocated'}
                          color={item.isAvailable ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      
                      {item.location && (
                        <Typography variant="body2" color="text.secondary">
                          Location: {item.location}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            /* List View */
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Brand/Model</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {item.brand && item.model ? (
                          `${item.brand} ${item.model}`
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.serialNumber || (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.conditionStatus}
                          color={getConditionColor(item.conditionStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.isAvailable ? 'Available' : 'Allocated'}
                          color={item.isAvailable ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.location || (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {equipment.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No equipment found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditClick}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Equipment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedEquipment?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Equipment Form Dialog */}
      <EquipmentFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        equipment={editingEquipment}
      />

      {/* Equipment Details Dialog */}
      <EquipmentDetailsDialog
        open={detailsDialogOpen}
        onClose={handleDetailsClose}
        equipment={selectedEquipment}
      />
    </Box>
  );
};

export default EquipmentPage;
