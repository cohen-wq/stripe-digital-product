import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import JobForm from '../components/forms/JobForm';
import { supabase } from '../lib/supabase';

interface Job {
  id: string;
  title: string;
  client: string;
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  budget: number;
  progress: number;
  assignedTo: string;
  user_id: string;
}

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showAddJob, setShowAddJob] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) {
        setJobs([]);
        return;
      }

      // NOTE: Your DB does NOT have jobs.client, so we read snake_case columns.
      const { data, error } = await supabase
        .from('jobs')
        .select(
          'id,title,client_name,status,priority,due_date,budget,progress,assigned_to,user_id'
        )
        .order('due_date', { ascending: true });

      if (error) throw error;

      const normalized: Job[] = (data || []).map((row: any) => ({
        id: String(row.id),
        title: row.title ?? '',
        client: row.client_name ?? '',
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        budget: Number(row.budget ?? 0),
        progress: Number(row.progress ?? 0),
        assignedTo: row.assigned_to ?? '',
        user_id: row.user_id,
      }));

      setJobs(normalized);
    } catch (err) {
      // No popups — just log + show empty UI
      console.error(err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'all' || job.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;

      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      console.error(err);
      // no popup
    }
  };

  const handleSaveJob = async (jobData: any) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('Not signed in');

      // Insert using snake_case DB columns
      const insertPayload = {
        user_id: session.user.id,
        title: jobData.title,
        client_name: jobData.clientName ?? '',
        status: (jobData.status || 'pending') as Job['status'],
        priority: (jobData.priority || 'medium') as Job['priority'],
        due_date: jobData.dueDate || new Date().toISOString().split('T')[0],
        budget: Number(jobData.budget || 0),
        progress: Number(jobData.progress ?? 0),
        assigned_to: jobData.assignedTo || '',
      };

      const { data, error } = await supabase
        .from('jobs')
        .insert(insertPayload)
        .select(
          'id,title,client_name,status,priority,due_date,budget,progress,assigned_to,user_id'
        )
        .single();

      if (error) throw error;

      const newJob: Job = {
        id: String((data as any).id),
        title: (data as any).title ?? '',
        client: (data as any).client_name ?? '',
        status: (data as any).status,
        priority: (data as any).priority,
        dueDate: (data as any).due_date,
        budget: Number((data as any).budget ?? 0),
        progress: Number((data as any).progress ?? 0),
        assignedTo: (data as any).assigned_to ?? '',
        user_id: (data as any).user_id,
      };

      setJobs((prev) => [...prev, newJob]);
      setShowAddJob(false);
    } catch (err) {
      console.error(err);
      // no popup
    }
  };

  const handleAddToCalendar = (_eventData: any) => {
    // Calendar integration later — no popups here
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Job['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <div className="w-4 h-4 rounded-full bg-blue-500"></div>;
      case 'on_hold':
        return <PauseCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const calculateStats = () => {
    const totalValue = jobs.reduce((sum, job) => sum + (job.budget || 0), 0);
    const activeJobs = jobs.filter((job) => job.status === 'in_progress');
    const overdueJobs = jobs.filter(
      (job) => new Date(job.dueDate) < new Date() && job.status !== 'completed'
    );
    const avgProgress =
      jobs.length > 0
        ? jobs.reduce((sum, job) => sum + (job.progress || 0), 0) / jobs.length
        : 0;

    return { totalValue, activeJobs, overdueJobs, avgProgress };
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const nextDeadline = useMemo(() => {
    if (jobs.length === 0) return 'No jobs';
    const sorted = [...jobs].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    return new Date(sorted[0].dueDate).toLocaleDateString();
  }, [jobs]);

  // IMPORTANT: You asked for 0 (not “—”) while loading.
  const totalJobsDisplay = loading ? 0 : jobs.length;
  const activeJobsDisplay = loading ? 0 : stats.activeJobs.length;
  const totalValueDisplay = loading ? formatCurrency(0) : formatCurrency(stats.totalValue);
  const avgProgressDisplay = loading ? '0%' : `${stats.avgProgress.toFixed(0)}%`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Jobs & Projects</h1>
        <p className="text-gray-600">Manage all your projects, track progress, and meet deadlines</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-800">{totalJobsDisplay}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-blue-600 font-bold">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-800">{activeJobsDisplay}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <div className="w-6 h-6 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-800">{totalValueDisplay}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Progress</p>
              <p className="text-2xl font-bold text-gray-800">{avgProgressDisplay}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <span className="text-orange-600 font-bold">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs by title or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddJob(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              <Plus className="w-5 h-5" />
              Add Job
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hover:shadow-lg transition"
          >
            <div className="p-6">
              {/* Job Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.client}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => alert(`Edit job: ${job.title}`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="flex gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                    job.status
                  )}`}
                >
                  {getStatusIcon(job.status)}
                  {job.status.replace('_', ' ').charAt(0).toUpperCase() +
                    job.status.replace('_', ' ').slice(1)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                    job.priority
                  )}`}
                >
                  {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)} Priority
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Job Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Due:</span>
                  <span
                    className={`font-medium ${
                      new Date(job.dueDate) < new Date() && job.status !== 'completed'
                        ? 'text-red-600'
                        : 'text-gray-800'
                    }`}
                  >
                    {new Date(job.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium text-gray-800">{formatCurrency(job.budget)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                  <span className="text-gray-600">Assigned to:</span>
                  <span className="font-medium text-gray-800">{job.assignedTo}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  onClick={() => alert(`Viewing details for: ${job.title}`)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                >
                  View Details
                </button>
                <button
                  onClick={() => alert(`Quick update for: ${job.title}`)}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
                >
                  Quick Update
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filteredJobs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            {jobs.length === 0
              ? 'No jobs yet — create your first job to get started'
              : 'No jobs found matching your criteria'}
          </div>
          <button
            onClick={() => setShowAddJob(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
          >
            Create Your First Job
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">Timeline Overview</h3>
          <p className="text-sm text-blue-700">
            {loading ? 0 : stats.overdueJobs.length} overdue job
            {!loading && stats.overdueJobs.length !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-blue-700">Next deadline: {loading ? 'No jobs' : nextDeadline}</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
          <h3 className="font-semibold text-green-800 mb-2">Financial Summary</h3>
          <p className="text-sm text-green-700">
            Active jobs value:{' '}
            {loading
              ? formatCurrency(0)
              : formatCurrency(stats.activeJobs.reduce((sum, job) => sum + (job.budget || 0), 0))}
          </p>
          <p className="text-sm text-green-700">
            Completed value:{' '}
            {loading
              ? formatCurrency(0)
              : formatCurrency(
                  jobs
                    .filter((j) => j.status === 'completed')
                    .reduce((sum, job) => sum + (job.budget || 0), 0)
                )}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
          <h3 className="font-semibold text-purple-800 mb-2">Team Performance</h3>
          <p className="text-sm text-purple-700">
            Average progress across all jobs: {loading ? '0%' : `${stats.avgProgress.toFixed(1)}%`}
          </p>
          <p className="text-sm text-purple-700">
            {loading
              ? '0% completion rate'
              : `${((jobs.filter((j) => j.status === 'completed').length / (jobs.length || 1)) * 100).toFixed(
                  1
                )}% completion rate`}
          </p>
        </div>
      </div>

      {/* Job Form Modal */}
      {showAddJob && (
        <JobForm
          onSave={handleSaveJob}
          onClose={() => setShowAddJob(false)}
          onAddToCalendar={handleAddToCalendar}
        />
      )}
    </div>
  );
}
