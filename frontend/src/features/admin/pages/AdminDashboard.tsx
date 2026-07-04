import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../config/axios';
import { 
  ShieldAlert, 
  Database, 
  FileSpreadsheet, 
  Activity, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  AlertCircle,
  Users
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'model' | 'logs' | 'rules' | 'users'>('model');
  
  // State for Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [retrainingStatus, setRetrainingStatus] = useState<string | null>(null);

  // State for Fraud Rule Form
  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    rule_description: '',
    condition_feature: 'revolving_utilization',
    condition_operator: '>',
    condition_value: 0.0,
    action: 'auto_flag',
    is_active: true
  });
  const [ruleError, setRuleError] = useState<string | null>(null);

  // State for User Form
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'risk_analyst'
  });
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Fetch Users list Query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/auth/users');
      return data;
    },
    enabled: activeTab === 'users'
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (newUser: typeof userForm) => {
      return axiosInstance.post('/auth/register', newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setUserForm({
        email: '',
        password: '',
        role: 'risk_analyst'
      });
      setUserError(null);
      setUserSuccess("User account registered successfully!");
    },
    onError: (err: any) => {
      setUserError(err.response?.data?.detail || "Failed to register user. Email might be already taken.");
      setUserSuccess(null);
    }
  });

  // 1. Fetch Audit Logs Query
  const [logPage] = useState(1);
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['auditLogs', logPage],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/audit-logs', {
        params: { page: logPage, limit: 15 }
      });
      return data;
    },
    enabled: activeTab === 'logs'
  });

  // 2. Fetch Fraud Rules Query
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['fraudRules'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/fraud-rules');
      return data.data;
    },
    enabled: activeTab === 'rules'
  });

  // 3. Mutator: Create Fraud Rule
  const createRuleMutation = useMutation({
    mutationFn: async (newRule: typeof ruleForm) => {
      return axiosInstance.post('/admin/fraud-rules', newRule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudRules'] });
      setRuleForm({
        rule_name: '',
        rule_description: '',
        condition_feature: 'revolving_utilization',
        condition_operator: '>',
        condition_value: 0.0,
        action: 'auto_flag',
        is_active: true
      });
      setRuleError(null);
    },
    onError: (err: any) => {
      setRuleError(err.response?.data?.detail || "Failed to create fraud rule.");
    }
  });

  // 4. Mutator: Toggle Fraud Rule Active Status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return axiosInstance.put(`/admin/fraud-rules/${id}`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudRules'] });
    }
  });

  // Handle Dataset CSV Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    
    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const { data } = await axiosInstance.post('/admin/model/upload-dataset', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadSuccess(data.message);
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || "Failed to upload training dataset.");
    } finally {
      setUploading(false);
    }
  };

  // Trigger Model Retraining Asynchronously
  const handleRetrain = async () => {
    setRetrainingStatus("initiating");
    try {
      const { data } = await axiosInstance.post('/admin/model/retrain');
      setRetrainingStatus(data.message);
    } catch (err) {
      setRetrainingStatus("failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Tab Menu Navigation */}
      <div className="flex border-b border-borderColor bg-bgSecondary rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('model')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-sans font-medium border-b-2 transition-all ${
            activeTab === 'model'
              ? 'border-borderActive text-textPrimary'
              : 'border-transparent text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Database size={16} />
          <span>Model Operations</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-sans font-medium border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-borderActive text-textPrimary'
              : 'border-transparent text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Activity size={16} />
          <span>Audit Log Trail</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-sans font-medium border-b-2 transition-all ${
            activeTab === 'rules'
              ? 'border-borderActive text-textPrimary'
              : 'border-transparent text-textSecondary hover:text-textPrimary'
          }`}
        >
          <ShieldAlert size={16} />
          <span>Risk Fraud Rules</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-sans font-medium border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-borderActive text-textPrimary'
              : 'border-transparent text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Users size={16} />
          <span>User Access Control</span>
        </button>
      </div>

      {/* 2. Active Tab Content Panels */}
      <div className="glass-card rounded-b-xl rounded-t-none p-6">
        
        {/* MODEL OPERATIONS TAB */}
        {activeTab === 'model' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Uploader Card */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-semibold text-base text-textPrimary">
                  Upload Fresh Training Dataset
                </h3>
                <p className="text-xs font-sans text-textMuted">
                  Replace the existing training dataset `cs-training.csv` to run pipelines
                </p>
              </div>

              {uploadSuccess && (
                <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 p-3.5 text-sm text-success">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3.5 text-sm text-danger">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-borderColor rounded-xl p-8 flex flex-col items-center justify-center text-center bg-bgPrimary/20 hover:border-borderActive transition-all cursor-pointer relative">
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                    accept=".csv"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet size={36} className="text-textMuted mb-2" />
                  <span className="text-sm font-sans text-textSecondary font-semibold">
                    {uploadFile ? uploadFile.name : 'Select or drag-and-drop CSV dataset'}
                  </span>
                  <span className="text-xs text-textMuted mt-1">Accepts only .csv format up to 20MB</span>
                </div>

                {uploadFile && (
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-2 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white font-sans font-semibold text-sm rounded-lg transition-all"
                  >
                    {uploading ? 'Uploading dataset...' : 'Replace Training CSV'}
                  </button>
                )}
              </form>
            </div>

            {/* Model Retraining Card */}
            <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-borderColor pt-6 lg:pt-0 lg:pl-8 gap-5">
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-semibold text-base text-textPrimary">
                  Trigger Model Pipeline Retraining
                </h3>
                <p className="text-xs font-sans text-textMuted">
                  Initiate asynchronous background training of classifiers using PyTorch/SMOTE/XGBoost.
                </p>
              </div>

              {retrainingStatus && (
                <div className="flex items-start gap-3 rounded-lg border border-borderActive/20 bg-borderActive/10 p-3.5 text-sm text-borderActive">
                  <Activity size={18} className="shrink-0 mt-0.5 animate-pulse" />
                  <span>{retrainingStatus}</span>
                </div>
              )}

              <div className="flex flex-col gap-4 bg-bgPrimary/30 rounded-xl p-5 border border-borderColor/50">
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Models to Train</span>
                  <span className="text-textPrimary font-semibold">LR + RF + XGB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Imbalance Correction</span>
                  <span className="text-textPrimary font-semibold">SMOTE Over-sampling</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Expected Runtime</span>
                  <span className="text-textPrimary font-semibold">~15 Seconds</span>
                </div>
              </div>

              <button
                onClick={handleRetrain}
                className="w-full py-3 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white font-sans font-semibold text-sm rounded-lg transition-all shadow-lg shadow-indigo-500/10"
              >
                Start Background Retraining Job
              </button>
            </div>
          </div>
        )}

        {/* AUDIT LOG TRAIL TAB */}
        {activeTab === 'logs' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-semibold text-base text-textPrimary">
                Chronological Audit Logs Trail
              </h3>
              <p className="text-xs font-sans text-textMuted">
                Append-only log record of risk evaluations and system logins for security compliance.
              </p>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-t-borderActive border-borderColor rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-borderColor text-textMuted font-bold">
                      <th className="py-3 px-4">Log ID</th>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsData && logsData.data.length > 0 ? (
                      logsData.data.map((log: any) => (
                        <tr key={log.id} className="border-b border-borderColor/50 hover:bg-bgTertiary/30 text-textSecondary hover:text-textPrimary transition-all">
                          <td className="py-3 px-4 font-mono text-xs">{log.id}</td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {log.user_id ? `${log.user_id.substring(0, 8)}...` : 'system'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-xs bg-bgTertiary inline-block my-2 rounded px-2.5">
                            {log.action_type}
                          </td>
                          <td className="py-3 px-4">{log.description}</td>
                          <td className="py-3 px-4 font-mono text-xs">{log.ip_address}</td>
                          <td className="py-3 px-4 text-right text-xs text-textMuted">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-textMuted">
                          No audit trail records logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RISK FRAUD RULES TAB */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* Rule Builder Form */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-semibold text-base text-textPrimary">
                  Create Fraud Prevention Rule
                </h3>
                <p className="text-xs font-sans text-textMuted">
                  Define static checks to intercept evaluations before models execute.
                </p>
              </div>

              {ruleError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3.5 text-sm text-danger">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{ruleError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createRuleMutation.mutate(ruleForm);
                }}
                className="flex flex-col gap-4"
              >
                {/* Rule Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.rule_name}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, rule_name: e.target.value }))}
                    placeholder="High Debt Ratio Block"
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-borderActive"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={ruleForm.rule_description}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, rule_description: e.target.value }))}
                    placeholder="Automatically reject applications with debt ratio > 5.0"
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-borderActive"
                  />
                </div>

                {/* Conditional statement builder row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-sans font-bold text-textSecondary uppercase">Feature</label>
                    <select
                      value={ruleForm.condition_feature}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, condition_feature: e.target.value }))}
                      className="bg-bgTertiary border border-borderColor rounded-lg px-2 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-borderActive"
                    >
                      <option value="revolving_utilization">Utilization</option>
                      <option value="debt_ratio">Debt Ratio</option>
                      <option value="monthly_income">Income</option>
                      <option value="age">Age</option>
                      <option value="number_90_days_late">90+ Days Late</option>
                    </select>
                  </div>

                  {/* Operator */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-sans font-bold text-textSecondary uppercase">Operator</label>
                    <select
                      value={ruleForm.condition_operator}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, condition_operator: e.target.value }))}
                      className="bg-bgTertiary border border-borderColor rounded-lg px-2 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-borderActive"
                    >
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="==">==</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-sans font-bold text-textSecondary uppercase">Value</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={ruleForm.condition_value}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, condition_value: parseFloat(e.target.value) }))}
                      className="bg-bgTertiary border border-borderColor rounded-lg px-2 py-2.5 text-xs focus:outline-none focus:border-borderActive"
                    />
                  </div>
                </div>

                {/* Rule Action */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">Trigger Action</label>
                  <select
                    value={ruleForm.action}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, action: e.target.value }))}
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-borderActive"
                  >
                    <option value="auto_reject">Auto Reject (Instantly Denied)</option>
                    <option value="auto_flag">Auto Flag (Requires Manual Underwriting)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createRuleMutation.isPending}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white rounded-lg text-sm font-semibold transition-all mt-2"
                >
                  <Plus size={16} />
                  <span>{createRuleMutation.isPending ? 'Adding rule...' : 'Add Rule to Engine'}</span>
                </button>
              </form>
            </div>

            {/* List of active rules */}
            <div className="lg:col-span-7 flex flex-col border-t lg:border-t-0 lg:border-l border-borderColor pt-6 lg:pt-0 lg:pl-8 gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-semibold text-base text-textPrimary">
                  Active Custom Risk Interceptors
                </h3>
                <p className="text-xs font-sans text-textMuted">
                  Enabled checks matching parameters on evaluations.
                </p>
              </div>

              {rulesLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-3 border-t-borderActive border-borderColor rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {rulesData && rulesData.length > 0 ? (
                    rulesData.map((rule: any) => (
                      <div key={rule.id} className="glass-card rounded-xl p-4 flex items-center justify-between border border-borderColor">
                        <div className="flex flex-col gap-1 text-left">
                          <span className="text-sm font-display font-semibold text-textPrimary">
                            {rule.rule_name}
                          </span>
                          <span className="text-xs font-sans text-textSecondary">
                            IF `{rule.condition_feature}` {rule.condition_operator} {rule.condition_value} THEN {rule.action.toUpperCase()}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => toggleRuleMutation.mutate({ id: rule.id, is_active: !rule.is_active })}
                          className={`text-textSecondary transition-all ${
                            rule.is_active ? 'text-success' : 'text-textMuted'
                          }`}
                        >
                          {rule.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-textMuted text-sm font-sans">
                      No custom fraud check rules defined. Add one using the builder.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* USER ACCESS CONTROL TAB */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* Create User Form */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-semibold text-base text-textPrimary">
                  Register New User Account
                </h3>
                <p className="text-xs font-sans text-textMuted">
                  Create new logins for other underwriter analysts or compliance auditors.
                </p>
              </div>

              {userError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3.5 text-sm text-danger">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 p-3.5 text-sm text-success">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createUserMutation.mutate(userForm);
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@credishield.com"
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-borderActive"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-borderActive"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider">User Authorization Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="bg-bgTertiary border border-borderColor rounded-lg px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-borderActive"
                  >
                    <option value="risk_analyst">Risk Analyst (Scoring & CRUD)</option>
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="auditor">Compliance Auditor (Read-only)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white rounded-lg text-sm font-semibold transition-all mt-2"
                >
                  <Plus size={16} />
                  <span>{createUserMutation.isPending ? 'Registering...' : 'Create Account'}</span>
                </button>
              </form>
            </div>

            {/* List of active users */}
            <div className="lg:col-span-7 flex flex-col border-t lg:border-t-0 lg:border-l border-borderColor pt-6 lg:pt-0 lg:pl-8 gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-semibold text-base text-textPrimary">
                  System User Directory
                </h3>
                <p className="text-xs font-sans text-textMuted">
                  Registered system operators and access privileges.
                </p>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-3 border-t-borderActive border-borderColor rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {usersData && usersData.length > 0 ? (
                    usersData.map((usr: any) => (
                      <div key={usr.id} className="glass-card rounded-xl p-4 flex items-center justify-between border border-borderColor">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-sm font-display font-semibold text-textPrimary">
                            {usr.email}
                          </span>
                          <span className="text-xs font-mono text-textMuted">
                            ID: {usr.id}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase ${
                          usr.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' :
                          usr.role === 'risk_analyst' ? 'bg-success/20 text-success' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {usr.role.replace("_", " ")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-textMuted text-sm font-sans">
                      No user profiles retrieved.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
