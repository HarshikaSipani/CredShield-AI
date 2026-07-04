import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../config/axios';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  X, 
  AlertCircle,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ApplicantsDirectory: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setError(null);
      setImportSuccess(null);
      const { data } = await axiosInstance.post('/applicants/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setImportSuccess(data.message);
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to import CSV applicant list.");
    }
  };


  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    revolving_utilization: 0.0,
    age: 18,
    number_30_59_days_past_due: 0,
    debt_ratio: 0.0,
    monthly_income: 0.0,
    number_open_credit_lines: 0,
    number_90_days_late: 0,
    number_real_estate_loans: 0,
    number_60_89_days_past_due: 0,
    number_of_dependents: 0
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      revolving_utilization: 0.0,
      age: 18,
      number_30_59_days_past_due: 0,
      debt_ratio: 0.0,
      monthly_income: 0.0,
      number_open_credit_lines: 0,
      number_90_days_late: 0,
      number_real_estate_loans: 0,
      number_60_89_days_past_due: 0,
      number_of_dependents: 0
    });
    setEditingApplicant(null);
    setError(null);
  };

  // Fetch Applicants query
  const { data, isLoading } = useQuery({
    queryKey: ['applicants', page, search],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/applicants', {
        params: { page, limit: 10, search: search || undefined }
      });
      return data;
    }
  });

  // Mutator: Create applicant
  const createMutation = useMutation({
    mutationFn: async (newApp: typeof formData) => {
      return axiosInstance.post('/applicants', newApp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Failed to register applicant. Double check email uniqueness.");
    }
  });

  // Mutator: Update applicant
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return axiosInstance.put(`/applicants/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Failed to update applicant.");
    }
  });

  // Mutator: Delete applicant
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return axiosInstance.delete(`/applicants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    }
  });

  const handleEditClick = (app: any) => {
    setEditingApplicant(app);
    setFormData({
      first_name: app.first_name,
      last_name: app.last_name,
      email: app.email,
      revolving_utilization: app.revolving_utilization,
      age: app.age,
      number_30_59_days_past_due: app.number_30_59_days_past_due,
      debt_ratio: app.debt_ratio,
      monthly_income: app.monthly_income,
      number_open_credit_lines: app.number_open_credit_lines,
      number_90_days_late: app.number_90_days_late,
      number_real_estate_loans: app.number_real_estate_loans,
      number_60_89_days_past_due: app.number_60_89_days_past_due,
      number_of_dependents: app.number_of_dependents
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingApplicant) {
      updateMutation.mutate({ id: editingApplicant.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-textMuted pointer-events-none">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email..."
            className="w-full bg-bgSecondary border border-borderColor rounded-lg pl-10 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-borderActive transition-all duration-200"
          />
        </div>

        {user && user.role !== 'auditor' && (
          <div className="flex items-center gap-3">
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bgSecondary border border-borderColor hover:border-borderActive text-textSecondary hover:text-textPrimary rounded-lg text-sm font-sans font-semibold transition-all duration-200 cursor-pointer">
              <Upload size={18} />
              <span>Import CSV List</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white rounded-lg text-sm font-sans font-semibold transition-all duration-300"
            >
              <Plus size={18} />
              <span>Add New Applicant</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Datagrid List */}
      <div className="glass-card rounded-xl overflow-hidden p-6 flex flex-col gap-4">
        {importSuccess && (
          <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 p-3.5 text-sm text-success">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>{importSuccess}</span>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-t-borderActive border-borderColor rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-borderColor text-textMuted font-bold">
                  <th className="py-3 px-4">Applicant ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Age</th>
                  <th className="py-3 px-4">Debt Ratio</th>
                  <th className="py-3 px-4">Monthly Income</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data && data.data.length > 0 ? (
                  data.data.map((app: any) => (
                    <tr key={app.id} className="border-b border-borderColor/50 hover:bg-bgTertiary/30 text-textSecondary hover:text-textPrimary transition-all">
                      <td className="py-4 px-4 font-mono text-xs">{app.id.substring(0, 8)}...</td>
                      <td className="py-4 px-4 font-semibold">{app.first_name} {app.last_name}</td>
                      <td className="py-4 px-4">{app.email}</td>
                      <td className="py-4 px-4">{app.age}</td>
                      <td className="py-4 px-4">{(app.debt_ratio * 100).toFixed(1)}%</td>
                      <td className="py-4 px-4">${app.monthly_income.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right flex items-center justify-end gap-2.5">
                        {user && user.role !== 'auditor' && (
                          <>
                            <Link
                              to="/evaluate"
                              state={{ applicant_id: app.id }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/20 text-success hover:bg-success hover:text-white rounded text-xs font-semibold transition-all"
                              title="Evaluate credit default risk"
                            >
                              <Play size={12} />
                              <span>Evaluate</span>
                            </Link>
                            <button
                              onClick={() => handleEditClick(app)}
                              className="p-1 hover:bg-bgTertiary text-textSecondary hover:text-indigo-400 rounded transition-all"
                              title="Edit applicant information"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(app.id)}
                              className="p-1 hover:bg-bgTertiary text-textSecondary hover:text-danger rounded transition-all"
                              title="Delete applicant"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-textMuted">
                      No matching applicant records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {data && data.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between border-t border-borderColor/50 pt-4 mt-2">
                <span className="text-xs text-textMuted">
                  Showing {data.data.length} of {data.pagination.total} records
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-bgSecondary border border-borderColor rounded text-xs text-textSecondary hover:text-textPrimary hover:border-borderActive transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === data.pagination.total_pages}
                    onClick={() => setPage(prev => prev + 1)}
                    className="px-3 py-1.5 bg-bgSecondary border border-borderColor rounded text-xs text-textSecondary hover:text-textPrimary hover:border-borderActive transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CRUD Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-bgSecondary border border-borderColor rounded-2xl shadow-glass flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-borderColor">
              <h3 className="font-display font-bold text-lg text-textPrimary">
                {editingApplicant ? 'Modify Applicant Parameters' : 'Onboard New Applicant'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-bgTertiary text-textSecondary hover:text-textPrimary rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3.5 text-sm text-danger">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Basic Demographic Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleFormChange}
                    required
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleFormChange}
                    required
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                  />
                </div>
              </div>

              {/* Credit Model Features Grid */}
              <div className="border-t border-borderColor pt-4">
                <h4 className="text-sm font-display font-semibold text-textPrimary mb-4">Financial & Delinquency Variables</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary" title="revolving_utilization">Revolving Line Utilization ratio (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="any"
                      name="revolving_utilization"
                      value={formData.revolving_utilization}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">Age (Years)</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">Monthly Gross Income ($)</label>
                    <input
                      type="number"
                      step="any"
                      name="monthly_income"
                      value={formData.monthly_income}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">Debt Payments Ratio (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="any"
                      name="debt_ratio"
                      value={formData.debt_ratio}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">Number of open loans and credit lines</label>
                    <input
                      type="number"
                      name="number_open_credit_lines"
                      value={formData.number_open_credit_lines}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">Number of real estate/mortgages</label>
                    <input
                      type="number"
                      name="number_real_estate_loans"
                      value={formData.number_real_estate_loans}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">Number of Dependents</label>
                    <input
                      type="number"
                      name="number_of_dependents"
                      value={formData.number_of_dependents}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                </div>

                <h4 className="text-sm font-display font-semibold text-textPrimary mt-6 mb-4">Past Delinquency Incidents</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">30-59 Days Past Due count</label>
                    <input
                      type="number"
                      name="number_30_59_days_past_due"
                      value={formData.number_30_59_days_past_due}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">60-89 Days Past Due count</label>
                    <input
                      type="number"
                      name="number_60_89_days_past_due"
                      value={formData.number_60_89_days_past_due}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans font-bold text-textSecondary">90+ Days Past Due count</label>
                    <input
                      type="number"
                      name="number_90_days_late"
                      value={formData.number_90_days_late}
                      onChange={handleFormChange}
                      required
                      className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-borderActive"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 justify-end border-t border-borderColor pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-borderColor rounded-lg text-sm text-textSecondary hover:text-textPrimary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Register Applicant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantsDirectory;
