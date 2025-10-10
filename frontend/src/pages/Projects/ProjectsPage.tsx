import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Search,
  Visibility,
} from '@mui/icons-material';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { projectService } from '../../services/projectService';
import { Project, ProjectFilters } from '../../types/project';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ProjectFormDialog from '../../components/Projects/ProjectFormDialog';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ProjectFilters>({
    page: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { showSuccess, showError } = useSnackbar();

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects(filters);
      setProjects(response.data);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      showError('Failed to fetch projects');
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

  const handleFilterChange = (key: keyof ProjectFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEdit = () => {
    setEditingProject(selectedProject);
    setFormDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;

    try {
      await projectService.deleteProject(selectedProject.id);
      showSuccess('Project deleted successfully');
      fetchProjects();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to delete project');
    } finally {
      setDeleteDialogOpen(false);
      handleMenuClose();
      setSelectedProject(null);
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    fetchProjects();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'default';
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateProject}
        >
          New Project
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search projects..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No projects found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {project.name}
                    </Typography>
                    {project.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {project.description.length > 50 
                          ? `${project.description.substring(0, 50)}...` 
                          : project.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {project.clientName}
                    </Typography>
                    {project.clientEmail && (
                      <Typography variant="body2" color="text.secondary">
                        {project.clientEmail}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      color={getStatusColor(project.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(project.startDate)}</TableCell>
                  <TableCell>{formatDate(project.endDate)}</TableCell>
                  <TableCell>{project.location || '-'}</TableCell>
                  <TableCell>{project.createdByName || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, project)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Form Dialog */}
      <ProjectFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
        project={editingProject}
      />
    </Box>
  );
};

export default ProjectsPage;
