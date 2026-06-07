import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  MapPin,
  Navigation,
  Calendar,
  Trash2,
  Circle,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit3,
  FolderPlus,
  Folder,
  Pencil,
  ChevronUp,
  PanelLeftClose,
} from 'lucide-react';
import { GROUP_COLORS } from './taskConstants';

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

function getGroupColor(group) {
  if (!group || !group.color) return GROUP_COLORS[0];
  return GROUP_COLORS.find(c => c.id === group.color) || GROUP_COLORS[0];
}

export default function FullTaskManager({
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
  onUpdateGroupColor,
  onSwitchToSidebar,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

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
  const [editingTitleTaskId, setEditingTitleTaskId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Group management state
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroupId, setRenamingGroupId] = useState(null);
  const [renameGroupValue, setRenameGroupValue] = useState('');

  if (!showPanel) return null;

  const groups = taskGroups || [{ id: 'inbox', name: 'Inbox', sortOrder: 0 }];

  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleRowClick = (task) => {
    if (selectedTaskId === task.id) {
      setSelectedTaskId(null);
    } else {
      setSelectedTaskId(task.id);
    }
  };

  const handleRowDoubleClick = (task) => {
    if (editingTaskId === task.id) {
      setEditingTaskId(null);
    } else {
      setEditingTaskId(task.id);
      setSelectedTaskId(null);
      setEditTitle(task.title);
      setEditNotes(task.notes || '');
      setEditStatus(task.status);
      setEditPriority(task.priority);
      setEditDueDate(task.dueDate || '');
      setEditGroupId(task.groupId || 'inbox');
    }
  };

  const handleSaveExpanded = () => {
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

  const handleCreateTask = (andSetLocation = false) => {
    if (!newTitle.trim()) return;
    const newTaskId = onAddTask({
      title: newTitle.trim(),
      notes: newNotes.trim(),
      priority: newPriority,
      dueDate: newDueDate || null,
      groupId: newGroupId,
    });
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

  const handleTitleDoubleClick = (e, task) => {
    e.stopPropagation();
    setEditingTitleTaskId(task.id);
    setEditTitleValue(task.title);
  };

  const saveTitleEdit = (taskId) => {
    if (!editTitleValue.trim()) return;
    onUpdateTask(taskId, { title: editTitleValue.trim() });
    setEditingTitleTaskId(null);
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

  // Group tasks by groupId
  const groupedTasks = useMemo(() => {
    let filtered = (tasks || []).filter(task => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(q) || (task.notes || '').toLowerCase().includes(q);
    });

    if (activeFilter !== 'all') {
      filtered = filtered.filter(task => task.status === activeFilter);
    }

    const sorted = [...filtered].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const result = {};
    groups.forEach(g => {
      result[g.id] = [];
    });

    sorted.forEach(task => {
      const gId = task.groupId || 'inbox';
      if (!result[gId]) result[gId] = [];
      result[gId].push(task);
    });

    return result;
  }, [tasks, searchQuery, activeFilter, groups]);

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'completed', label: 'Completed' },
  ];

  const sortedGroups = [...groups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
        <h2 className="text-sm font-bold text-slate-800 shrink-0">Task Manager</h2>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 max-w-xs">
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

        {/* Status Filters */}
        <div className="flex items-center gap-1">
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

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Add Group */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group..."
              className="text-xs bg-white border border-slate-200 rounded px-2 py-1 w-28 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroup(); }}
            />
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded transition-colors"
              title="Add Group"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Task */}
          <button
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>

          {/* Sidebar button */}
          <button
            onClick={onSwitchToSidebar}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
            title="Collapse to Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Task Form (inline at top) */}
      {showNewTaskForm && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 max-w-4xl">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title *"
              className="flex-1 text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(); if (e.key === 'Escape') setShowNewTaskForm(false); }}
            />
            <select
              value={newGroupId}
              onChange={(e) => setNewGroupId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <button
              onClick={() => handleCreateTask(false)}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => handleCreateTask(true)}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Create & Set Location
            </button>
            <button
              onClick={() => { setShowNewTaskForm(false); setNewTitle(''); setNewNotes(''); setNewPriority('medium'); setNewDueDate(''); setNewGroupId('inbox'); }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Group sections */}
      <div className="flex-1 overflow-y-auto">
        {sortedGroups.map(group => {
          const groupTasks = groupedTasks[group.id] || [];
          const isCollapsed = collapsedGroups[group.id];
          const colorCfg = getGroupColor(group);

          return (
            <div key={group.id} className="border-b border-slate-100">
              {/* Group Header */}
              <div className={`flex items-center gap-2 px-4 py-2 border-l-4 ${colorCfg.headerBorder} ${colorCfg.headerBg}`}>
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="shrink-0 text-slate-500 hover:text-slate-700"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <span className={`text-sm font-semibold ${colorCfg.headerText}`}>
                  {renamingGroupId === group.id ? (
                    <input
                      type="text"
                      value={renameGroupValue}
                      onChange={(e) => setRenameGroupValue(e.target.value)}
                      className="text-sm bg-white border border-slate-200 rounded px-2 py-0.5 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-300"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameGroup(group.id); if (e.key === 'Escape') setRenamingGroupId(null); }}
                      onBlur={() => handleRenameGroup(group.id)}
                    />
                  ) : group.name}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colorCfg.badgeBg}`}>
                  {groupTasks.length}
                </span>

                {/* Group actions */}
                <div className="flex items-center gap-1 ml-auto">
                  {/* Color picker dots */}
                  <div className="flex items-center gap-0.5">
                    {GROUP_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => onUpdateGroupColor(group.id, c.id)}
                        className={`w-3 h-3 rounded-full ${c.dotColor} ${group.color === c.id ? 'ring-2 ring-offset-1 ring-slate-400' : ''} hover:scale-125 transition-transform`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {/* Rename */}
                  {renamingGroupId !== group.id && (
                    <button
                      onClick={() => { setRenamingGroupId(group.id); setRenameGroupValue(group.name); }}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}

                  {/* Delete */}
                  {group.id !== 'inbox' && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table header */}
              {!isCollapsed && groupTasks.length > 0 && (
                <div className="flex items-center px-4 py-1 bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                  <span className="w-6 shrink-0">Status</span>
                  <span className="shrink-0" style={{ width: '360px' }}>Task</span>
                  <span className="w-14 shrink-0 text-center">Group</span>
                  <span className="w-14 shrink-0 text-center">Priority</span>
                  <span className="w-16 shrink-0 text-center">Due Date</span>
                  <span className="w-8 shrink-0 text-center">Loc</span>
                  <span className="w-20 shrink-0"></span>
                </div>
              )}

              {/* Task rows */}
              {!isCollapsed && groupTasks.map(task => {
                const statusCfg = getStatusConfig(task.status);
                const StatusIcon = statusCfg.icon;
                const priorityCfg = getPriorityConfig(task.priority);
                const isEditing = editingTaskId === task.id;
                const isSelected = selectedTaskId === task.id;
                const taskGroup = groups.find(g => g.id === (task.groupId || 'inbox'));

                return (
                  <div key={task.id}>
                    {/* Task row */}
                    <div
                      className={`flex items-center px-4 py-1.5 border-b border-slate-50 cursor-pointer transition-colors border-l-2 ${
                        isEditing ? `bg-slate-50 ${colorCfg.headerBorder}` : isSelected ? `bg-indigo-50/50 border-l-transparent` : `border-l-transparent hover:bg-slate-50`
                      }`}
                      onClick={() => handleRowClick(task)}
                      onDoubleClick={() => handleRowDoubleClick(task)}
                    >
                      {/* Status icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
                          onUpdateTask(task.id, { status: nextStatus });
                        }}
                        className={`w-6 shrink-0 ${statusCfg.color} hover:text-indigo-600 transition-colors`}
                        title={`Status: ${statusCfg.label}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </button>

                      {/* Title */}
                      <div className="shrink-0 min-w-0" style={{ width: '360px' }}>
                        {editingTitleTaskId === task.id ? (
                          <input
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveTitleEdit(task.id); if (e.key === 'Escape') setEditingTitleTaskId(null); }}
                            onBlur={() => saveTitleEdit(task.id)}
                          />
                        ) : (
                          <span
                            className={`text-xs truncate block ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                            onDoubleClick={(e) => handleTitleDoubleClick(e, task)}
                          >
                            {task.title}
                          </span>
                        )}
                      </div>

                      {/* Group badge */}
                      <div className="w-14 shrink-0 text-center">
                        {taskGroup && taskGroup.id !== 'inbox' && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 truncate inline-block max-w-[48px]">
                            {taskGroup.name}
                          </span>
                        )}
                      </div>

                      {/* Priority */}
                      <div className="w-14 shrink-0 text-center">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${priorityCfg.badgeClass}`}>
                          {priorityCfg.label}
                        </span>
                      </div>

                      {/* Due Date */}
                      <div className="w-16 shrink-0 text-center">
                        {task.dueDate && (
                          <span className={`text-[10px] ${task.dueDate < getToday() ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      <div className="w-8 shrink-0 text-center">
                        {pinExistsForTask(task) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToLocation(task.locationPinId, task.locationWorkspaceId);
                            }}
                            className="text-indigo-500 hover:text-indigo-700 transition-colors inline-flex"
                            title="Go to location"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Actions: Edit + Reorder */}
                      <div className="w-20 shrink-0 flex items-center justify-end gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRowDoubleClick(task); }}
                          className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onReorderTask(task.id, 'up', 'group'); }}
                          className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onReorderTask(task.id, 'down', 'group'); }}
                          className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Selected: notes preview (read-only) */}
                    {isSelected && !isEditing && task.notes && task.notes.trim() && (
                      <div className="text-[11px] text-slate-500 px-4 py-1.5 bg-slate-50/50 border-b border-slate-100 overflow-hidden max-h-[3.5rem] line-clamp-3">
                        {task.notes}
                      </div>
                    )}

                    {/* Edit mode: full edit panel */}
                    {isEditing && (
                      <div className={`px-4 py-3 bg-slate-50 border-b border-slate-200 border-l-2 ${colorCfg.headerBorder}`}>
                        <div className="max-w-2xl space-y-2">
                          {/* Notes */}
                          <div>
                            <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Notes</label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-600 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              placeholder="Add notes..."
                              rows={3}
                            />
                          </div>

                          {/* Edit controls row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">Status</span>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
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
                                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              >
                                {PRIORITY_OPTIONS.map(p => (
                                  <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">Due Date</span>
                              <input
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">Group</span>
                              <select
                                value={editGroupId}
                                onChange={(e) => setEditGroupId(e.target.value)}
                                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              >
                                {groups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleSaveExpanded}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => onStartLocationSelection(task.id)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded transition-colors flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              Set Location
                            </button>
                            {pinExistsForTask(task) && (
                              <button
                                onClick={() => onNavigateToLocation(task.locationPinId, task.locationWorkspaceId)}
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-semibold rounded transition-colors flex items-center gap-1"
                              >
                                <Navigation className="w-3 h-3" />
                                Go To Location
                              </button>
                            )}
                            <button
                              onClick={() => { onDeleteTask(task.id); setEditingTaskId(null); }}
                              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold rounded transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty group message */}
              {!isCollapsed && groupTasks.length === 0 && (
                <div className="px-4 py-3 text-xs text-slate-400 italic">
                  No tasks in this group
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
