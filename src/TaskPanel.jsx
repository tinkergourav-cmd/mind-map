import React, { useState, useMemo } from 'react';
import {
  X,
  ListTodo,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
  Calendar,
  Trash2,
  Circle,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Edit3,
  FolderPlus,
  Folder,
  MoreVertical,
  Pencil,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo', icon: Circle, color: 'text-slate-400' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  { value: 'waiting', label: 'Waiting', icon: AlertCircle, color: 'text-amber-500' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', badgeClass: 'bg-slate-100 text-slate-600' },
  { value: 'medium', label: 'Medium', badgeClass: 'bg-amber-100 text-amber-700' },
  { value: 'high', label: 'High', badgeClass: 'bg-red-100 text-red-700' },
];

function getStatusConfig(status) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

function getPriorityConfig(priority) {
  return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
}

function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function formatDueDate(dueDate) {
  if (!dueDate) return '';
  const today = getToday();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dueDate === today) return 'Today';
  if (dueDate === tomorrowStr) return 'Tomorrow';
  if (dueDate < today) return 'Overdue';
  return new Date(dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function TaskPanel({
  tasks,
  showPanel,
  onClose,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTask,
  onStartLocationSelection,
  onNavigateToLocation,
  onCancelLocationSelection,
  isSelectingLocation,
  selectingLocationForTaskId,
  workspaces,
  taskGroups,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeGroupFilter, setActiveGroupFilter] = useState('all');
  const [collapsedSections, setCollapsedSections] = useState({ completed: true });
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Group management state
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroupId, setRenamingGroupId] = useState(null);
  const [renameGroupValue, setRenameGroupValue] = useState('');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newGroupId, setNewGroupId] = useState('inbox');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('todo');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editGroupId, setEditGroupId] = useState('inbox');

  // Status dropdown state for inline editing
  const [statusDropdownTaskId, setStatusDropdownTaskId] = useState(null);

  if (!showPanel) return null;

  const groups = taskGroups || [{ id: 'inbox', name: 'Inbox', sortOrder: 0 }];

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Inbox';
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreateTask = (andSetLocation = false) => {
    if (!newTitle.trim()) return;
    const taskData = {
      title: newTitle.trim(),
      notes: newNotes.trim(),
      priority: newPriority,
      dueDate: newDueDate || null,
      groupId: newGroupId,
    };
    const newTaskId = onAddTask(taskData);
    setNewTitle('');
    setNewNotes('');
    setNewPriority('medium');
    setNewDueDate('');
    setNewGroupId('inbox');
    setShowNewTaskForm(false);
    if (andSetLocation && newTaskId) {
      onStartLocationSelection(newTaskId);
    }
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || '');
    setEditGroupId(task.groupId || 'inbox');
  };

  const saveEditTask = () => {
    if (!editTitle.trim()) return;
    onUpdateTask(editingTaskId, {
      title: editTitle.trim(),
      notes: editNotes.trim(),
      status: editStatus,
      priority: editPriority,
      dueDate: editDueDate || null,
      groupId: editGroupId,
    });
    setEditingTaskId(null);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId) => {
    onDeleteTask(taskId);
    setEditingTaskId(null);
    setSelectedTaskId(null);
  };

  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    setStatusDropdownTaskId(null);
  };

  const handleTaskDoubleClick = (task) => {
    startEditTask(task);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    onAddGroup(newGroupName.trim());
    setNewGroupName('');
  };

  const handleRenameGroup = (groupId) => {
    if (!renameGroupValue.trim()) return;
    onRenameGroup(groupId, renameGroupValue.trim());
    setRenamingGroupId(null);
    setRenameGroupValue('');
  };

  const handleDeleteGroup = (groupId) => {
    if (groupId === 'inbox') return;
    onDeleteGroup(groupId);
  };

  const pinExistsForTask = (task) => {
    if (!task.locationPinId) return false;
    return (workspaces || []).some(ws => (ws.pins || []).some(p => p.id === task.locationPinId));
  };

  // Filtered and grouped tasks using useMemo
  const sections = useMemo(() => {
    const today = getToday();

    // Apply search filter
    let filtered = (tasks || []).filter(task => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(q) || (task.notes || '').toLowerCase().includes(q);
    });

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(task => task.status === activeFilter);
    }

    // Apply group filter
    if (activeGroupFilter !== 'all') {
      filtered = filtered.filter(task => (task.groupId || 'inbox') === activeGroupFilter);
    }

    // Sort by sortOrder
    const sorted = [...filtered].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // Group into sections
    const todayTasks = [];
    const upcomingTasks = [];
    const noDueDateTasks = [];
    const completedTasks = [];

    sorted.forEach(task => {
      if (task.status === 'completed') {
        completedTasks.push(task);
      } else if (!task.dueDate) {
        noDueDateTasks.push(task);
      } else if (task.dueDate === today) {
        todayTasks.push(task);
      } else if (task.dueDate > today) {
        upcomingTasks.push(task);
      } else {
        // Past due tasks go into Today section
        todayTasks.push(task);
      }
    });

    return [
      { key: 'today', label: 'Today', tasks: todayTasks, icon: '📅' },
      { key: 'upcoming', label: 'Upcoming', tasks: upcomingTasks, icon: '📆' },
      { key: 'noDueDate', label: 'No Due Date', tasks: noDueDateTasks, icon: '📋' },
      { key: 'completed', label: 'Completed', tasks: completedTasks, icon: '✅' },
    ];
  }, [tasks, searchQuery, activeFilter, activeGroupFilter]);

  const totalCount = (tasks || []).length;

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
      {/* Location Selection Banner */}
      {isSelectingLocation && (
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span className="text-xs text-blue-700 flex-1">Click on canvas to set location...</span>
          <button
            onClick={onCancelLocationSelection}
            className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Tasks</h3>
          <span className="text-xs text-slate-400 font-medium">({totalCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowGroupManager(!showGroupManager)}
            className={`p-1.5 hover:bg-slate-200 rounded-lg transition-colors ${showGroupManager ? 'bg-slate-200 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
            title="Manage Groups"
          >
            <Folder className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
            title="New Task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Group Manager */}
      {showGroupManager && (
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-1 mb-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name..."
              className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroup(); }}
            />
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-semibold rounded transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {groups.map(group => (
              <div key={group.id} className="flex items-center gap-1.5 text-xs">
                {renamingGroupId === group.id ? (
                  <>
                    <input
                      type="text"
                      value={renameGroupValue}
                      onChange={(e) => setRenameGroupValue(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameGroup(group.id); if (e.key === 'Escape') setRenamingGroupId(null); }}
                    />
                    <button
                      onClick={() => handleRenameGroup(group.id)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingGroupId(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <Folder className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="flex-1 text-slate-700 truncate">{group.name}</span>
                    <button
                      onClick={() => { setRenamingGroupId(group.id); setRenameGroupValue(group.name); }}
                      className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {group.id !== 'inbox' && (
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Group"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons - Status */}
      <div className="px-3 py-1.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          {filterButtons.map(fb => (
            <button
              key={fb.value}
              onClick={() => setActiveFilter(fb.value)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                activeFilter === fb.value
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {fb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Buttons - Groups */}
      <div className="px-3 py-1.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setActiveGroupFilter('all')}
            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
              activeGroupFilter === 'all'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            All Groups
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGroupFilter(g.id)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                activeGroupFilter === g.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title *"
            className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 mb-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(false); if (e.key === 'Escape') setShowNewTaskForm(false); }}
          />
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full text-[11px] bg-white border border-slate-200 rounded px-2 py-1 mb-1.5 text-slate-600 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <div className="flex items-center gap-2 mb-1.5">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>
          <div className="mb-1.5">
            <select
              value={newGroupId}
              onChange={(e) => setNewGroupId(e.target.value)}
              className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => handleCreateTask(false)}
              disabled={!newTitle.trim()}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-semibold rounded transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => handleCreateTask(true)}
              disabled={!newTitle.trim()}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-semibold rounded transition-colors flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Create & Set Location
            </button>
            <button
              onClick={() => { setShowNewTaskForm(false); setNewTitle(''); setNewNotes(''); setNewPriority('medium'); setNewDueDate(''); setNewGroupId('inbox'); }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sections.every(s => s.tasks.length === 0) && (
          <p className="text-xs text-slate-400 italic text-center py-6">
            {searchQuery ? 'No tasks match your search' : 'No tasks yet. Click + to add one.'}
          </p>
        )}

        {sections.map(section => {
          if (section.tasks.length === 0) return null;
          const isCollapsed = collapsedSections[section.key];

          return (
            <div key={section.key} className="border-b border-slate-100">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 truncate">
                  {section.label}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">({section.tasks.length})</span>
              </button>

              {/* Task Entries */}
              {!isCollapsed && section.tasks.map(task => (
                <div key={task.id}>
                  {editingTaskId === task.id ? (
                    /* Edit Mode - opened by double-click or edit button */
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 mb-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        placeholder="Task title"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEditTask(); if (e.key === 'Escape') cancelEdit(); }}
                      />
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2 py-1 mb-1.5 text-slate-600 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        placeholder="Notes (optional)"
                        rows={2}
                      />
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Status</span>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Priority</span>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                            className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          >
                            {PRIORITY_OPTIONS.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Group</span>
                          <select
                            value={editGroupId}
                            onChange={(e) => setEditGroupId(e.target.value)}
                            className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          >
                            {groups.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mb-1.5">
                        <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Due Date</span>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        />
                      </div>
                      {/* Location Buttons */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <button
                          onClick={() => onStartLocationSelection(task.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          Set Task Location
                        </button>
                        {pinExistsForTask(task) && (
                          <button
                            onClick={() => onNavigateToLocation(task.locationPinId, task.locationWorkspaceId)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-semibold rounded transition-colors flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" />
                            Go To Location
                          </button>
                        )}
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={saveEditTask}
                          disabled={!editTitle.trim()}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-semibold rounded transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold rounded transition-colors ml-auto flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode - enhanced preview with quick actions */
                    <div
                      className={`px-3 py-2 border-b border-slate-50 cursor-pointer group transition-colors ${
                        selectedTaskId === task.id ? 'bg-indigo-50 border-l-2 border-l-indigo-400' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => handleTaskClick(task)}
                      onDoubleClick={() => handleTaskDoubleClick(task)}
                    >
                      {/* Row 1: Status, Title, Location Button */}
                      <div className="flex items-center gap-2">
                        {/* Status Icon - clickable for quick toggle */}
                        {(() => {
                          const statusCfg = getStatusConfig(task.status);
                          const StatusIcon = statusCfg.icon;
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusDropdownTaskId(statusDropdownTaskId === task.id ? null : task.id);
                              }}
                              className={`shrink-0 ${statusCfg.color} hover:text-indigo-600 transition-colors`}
                              title={`Status: ${statusCfg.label} (click to change)`}
                            >
                              <StatusIcon className="w-4 h-4" />
                            </button>
                          );
                        })()}

                        {/* Title */}
                        <span className={`flex-1 min-w-0 text-xs font-medium truncate ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {task.title}
                        </span>

                        {/* Location navigation button - direct access */}
                        {pinExistsForTask(task) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToLocation(task.locationPinId, task.locationWorkspaceId);
                            }}
                            className="shrink-0 p-1 rounded hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors"
                            title="Go to location"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Quick action buttons - visible on hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditTask(task); }}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorderTask(task.id, 'up'); }}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorderTask(task.id, 'down'); }}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Group, Priority, Due Date */}
                      <div className="flex items-center gap-2 mt-1 ml-6">
                        {/* Group Name */}
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          {getGroupName(task.groupId || 'inbox')}
                        </span>

                        {/* Priority Badge */}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${getPriorityConfig(task.priority).badgeClass}`}>
                          {getPriorityConfig(task.priority).label}
                        </span>

                        {/* Due Date */}
                        {task.dueDate && task.status !== 'completed' && (
                          <span className={`text-[10px] shrink-0 flex items-center gap-0.5 ${task.dueDate < getToday() ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                            <Calendar className="w-3 h-3" />
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>

                      {/* Status Dropdown - inline, shown when status icon clicked */}
                      {statusDropdownTaskId === task.id && (
                        <div className="mt-1.5 ml-6 flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {STATUS_OPTIONS.map(s => {
                            const SIcon = s.icon;
                            return (
                              <button
                                key={s.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateTask(task.id, { status: s.value });
                                  setStatusDropdownTaskId(null);
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                                  task.status === s.value
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <SIcon className="w-3 h-3" />
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
