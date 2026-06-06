import React, { useState, useRef } from 'react';
import {
  X, CheckSquare, ChevronUp, ChevronDown,
  Maximize2, Minimize2, MessageSquare,
  Plus, Trash2, Palette, LayoutList, Grid3X3, Filter,
  Pencil, MapPin
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', abbr: 'Todo', color: 'bg-gray-400' },
  { value: 'in_progress', label: 'In Progress', abbr: 'WIP', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', abbr: 'Done', color: 'bg-green-500' },
  { value: 'blocked', label: 'Blocked', abbr: 'Block', color: 'bg-amber-500' },
];

const GROUP_COLORS = [
  { value: 'slate', label: 'Default', bg: 'bg-slate-100', border: 'border-slate-200', header: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  { value: 'green', label: 'Green', bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-50', border: 'border-teal-200', header: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
];

export default function TaskPanel({
  tasks, taskGroups, showTaskPanel, taskPanelMode,
  setTaskPanelMode, onClose, onUpdateTask, onDeleteTask, onToggleTaskStatus,
  onMoveTaskToGroup, onReorderGroups, onAddGroup, onDeleteGroup, onUpdateGroup, onLocateTaskPin, onDropTaskLocation,
}) {
  const [viewMode, setViewMode] = useState('list');
  const [activeGroupTab, setActiveGroupTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [colorPickerGroupId, setColorPickerGroupId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const cancelledRef = useRef(false);

  if (!showTaskPanel) return null;

  const sortedGroups = [...taskGroups].sort((a, b) => a.order - b.order);

  const getTasksForGroup = (groupId) => tasks.filter(t => t.groupId === groupId);

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (activeGroupTab !== 'all') {
      filtered = filtered.filter(t => t.groupId === activeGroupTab);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    return filtered;
  };

  const getStatusCount = (status) => {
    let base = tasks;
    if (activeGroupTab !== 'all') {
      base = base.filter(t => t.groupId === activeGroupTab);
    }
    if (status === 'all') return base.length;
    return base.filter(t => t.status === status).length;
  };

  const toggleRow = (taskId) => {
    setExpandedRows(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const startEditTitle = (task) => {
    cancelledRef.current = false;
    setEditingTitleId(task.id);
    setEditingTitleValue(task.title);
  };

  const commitEditTitle = (taskId) => {
    if (editingTitleValue.trim()) {
      onUpdateTask(taskId, { title: editingTitleValue.trim() });
    }
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleNote = (taskId) => {
    setExpandedNotes(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleAddGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    onAddGroup(name);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const filteredTasks = getFilteredTasks();

  // --- LIST VIEW TASK ROW ---
  const renderListRow = (task) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];
    const isCompleted = task.status === 'completed';
    const isExpanded = expandedRows[task.id];
    const isEditing = editingTitleId === task.id;

    return (
      <div key={task.id}>
        <div
          className="flex items-center gap-2 py-1.5 px-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer group"
          onClick={() => toggleRow(task.id)}
        >
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTaskStatus(task.id); }}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              isCompleted ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {isCompleted && <CheckSquare className="w-3 h-3 text-white" />}
          </button>

          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editingTitleValue}
              onChange={(e) => setEditingTitleValue(e.target.value)}
              onBlur={() => { if (!cancelledRef.current) commitEditTitle(task.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEditTitle(task.id); if (e.key === 'Escape') { cancelledRef.current = true; setEditingTitleId(null); } }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 text-xs font-semibold bg-white border border-indigo-300 rounded px-1 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              autoFocus
            />
          ) : (
            <span
              className={`flex-1 min-w-0 text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}
              onDoubleClick={(e) => { e.stopPropagation(); startEditTitle(task); }}
            >
              {task.title || 'Untitled'}
            </span>
          )}

          {/* Location Pin Chip */}
          {task.locationPin ? (
            <button
              onClick={(e) => { e.stopPropagation(); onLocateTaskPin(task.id); }}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
              title="Navigate to location"
            >
              <MapPin className="w-2 h-2 shrink-0" />
              <span>Location</span>
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDropTaskLocation(task.id); }}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
              title="Drop location pin"
            >
              <MapPin className="w-2 h-2 shrink-0" />
              <span>Pin</span>
            </button>
          )}

          {/* Status dot */}
          <div className="flex items-center gap-1 shrink-0" title={statusOption.label}>
            <span className={`w-2 h-2 rounded-full ${statusOption.color}`}></span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">{statusOption.abbr}</span>
          </div>

          {/* Note indicator */}
          {task.note && (
            <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
          )}

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
            className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            title="Delete"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Expanded note area */}
        {isExpanded && (
          <div className="px-8 py-2 bg-slate-50 border-b border-slate-100">
            <textarea
              value={task.note || ''}
              onChange={(e) => onUpdateTask(task.id, { note: e.target.value })}
              placeholder="Add a note..."
              className="w-full text-[11px] bg-white border border-slate-200 rounded p-2 text-slate-600 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 min-h-[50px]"
              rows={3}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <select
                value={task.status}
                onChange={(e) => onUpdateTask(task.id, { status: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-medium bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={task.groupId}
                onChange={(e) => onMoveTaskToGroup(task.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-medium bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                {sortedGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={(e) => { e.stopPropagation(); onDropTaskLocation(task.id); }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                title={task.locationPin ? 'Update location pin' : 'Drop location pin'}
              >
                <MapPin className="w-2.5 h-2.5" />
                {task.locationPin ? 'Update Location' : 'Pin Location'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- LIST VIEW ---
  const renderListView = () => {
    if (activeGroupTab !== 'all') {
      // Single group mode - no section headers
      const groupTasks = filteredTasks;
      if (groupTasks.length === 0) {
        return <p className="text-xs text-slate-400 italic text-center py-4">No tasks match filters</p>;
      }
      return <div>{groupTasks.map(renderListRow)}</div>;
    }

    // All groups mode - with collapsible section headers
    return (
      <div>
        {sortedGroups.map(group => {
          let groupTasks = tasks.filter(t => t.groupId === group.id);
          if (statusFilter !== 'all') {
            groupTasks = groupTasks.filter(t => t.status === statusFilter);
          }
          if (groupTasks.length === 0) return null;
          const isCollapsed = collapsedGroups[group.id];
          const groupColor = GROUP_COLORS.find(c => c.value === group.color) || GROUP_COLORS[0];

          return (
            <div key={group.id} className="mb-1">
              <div
                className="w-full flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 border-b border-slate-150 transition-colors group/header relative"
              >
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-1.5 flex-1 min-w-0"
                >
                  <span className={`w-2 h-2 rounded-full ${groupColor.dot} shrink-0`}></span>
                  {editingGroupId === group.id ? (
                    <input
                      type="text"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onBlur={() => {
                        if (editingGroupName.trim()) onUpdateGroup(group.id, { name: editingGroupName.trim() });
                        setEditingGroupId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { if (editingGroupName.trim()) onUpdateGroup(group.id, { name: editingGroupName.trim() }); setEditingGroupId(null); }
                        if (e.key === 'Escape') setEditingGroupId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold text-slate-600 uppercase tracking-wide bg-white border border-indigo-300 rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-w-[60px]"
                      autoFocus
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate">{group.name}</span>
                  )}
                  <span className="text-[10px] text-slate-400 shrink-0">({groupTasks.length})</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {/* Group action buttons */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); setEditingGroupName(group.name); }} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="Rename Group"><Pencil className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setColorPickerGroupId(colorPickerGroupId === group.id ? null : group.id); }} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="Change Color"><Palette className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); const idx = sortedGroups.indexOf(group); onReorderGroups(idx, idx - 1); }} disabled={sortedGroups.indexOf(group) === 0} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move Up"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); const idx = sortedGroups.indexOf(group); onReorderGroups(idx, idx + 1); }} disabled={sortedGroups.indexOf(group) === sortedGroups.length - 1} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move Down"><ChevronDown className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }} className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete Group"><Trash2 className="w-3 h-3" /></button>
                </div>
                {/* Color picker dropdown */}
                {colorPickerGroupId === group.id && (
                  <div className="absolute top-full right-2 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 flex gap-1.5 flex-wrap max-w-[180px]">
                    {GROUP_COLORS.map(color => (
                      <button key={color.value} onClick={(e) => { e.stopPropagation(); onUpdateGroup(group.id, { color: color.value }); setColorPickerGroupId(null); }} className={`w-5 h-5 rounded-full ${color.dot} border-2 border-white shadow-sm hover:scale-110 transition-transform flex items-center justify-center`} title={color.label}>
                        {group.color === color.value && <span className="text-white text-[7px] font-bold">&#10003;</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!isCollapsed && groupTasks.map(renderListRow)}
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-4">No tasks match filters</p>
        )}
      </div>
    );
  };

  // --- CARD VIEW (compact dense layout) ---
  const renderCardView = () => {
    const groupsToShow = activeGroupTab === 'all' ? sortedGroups : sortedGroups.filter(g => g.id === activeGroupTab);
    return (
    <div className="p-2 space-y-2">
      {groupsToShow.map((group, groupIndex) => {
        let groupTasks = getTasksForGroup(group.id);
        if (statusFilter !== 'all') {
          groupTasks = groupTasks.filter(t => t.status === statusFilter);
        }
        if (groupTasks.length === 0) return null;
        const groupColor = GROUP_COLORS.find(c => c.value === group.color) || GROUP_COLORS[0];
        const originalIndex = sortedGroups.indexOf(group);
        return (
          <div key={group.id} className={`${groupColor.bg} rounded-md border ${groupColor.border} overflow-hidden`}>
            <div className={`flex items-center justify-between px-2.5 py-1.5 ${groupColor.header} border-b ${groupColor.border} relative`}>
              <span className={`text-[11px] font-bold ${groupColor.text} uppercase tracking-wide`}>{group.name}</span>
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-slate-400 mr-1">{groupTasks.length}</span>
                <button onClick={() => setColorPickerGroupId(colorPickerGroupId === group.id ? null : group.id)} className={`p-0.5 rounded hover:bg-white/50 ${groupColor.text} transition-colors`} title="Change color"><Palette className="w-3 h-3" /></button>
                <button onClick={() => onReorderGroups(originalIndex, originalIndex - 1)} disabled={originalIndex === 0} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move Up"><ChevronUp className="w-3 h-3" /></button>
                <button onClick={() => onReorderGroups(originalIndex, originalIndex + 1)} disabled={originalIndex === sortedGroups.length - 1} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move Down"><ChevronDown className="w-3 h-3" /></button>
                <button onClick={() => onDeleteGroup(group.id)} className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete Group"><Trash2 className="w-3 h-3" /></button>
              </div>
              {colorPickerGroupId === group.id && (
                <div className="absolute top-full right-2 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 flex gap-1.5 flex-wrap max-w-[180px]">
                  {GROUP_COLORS.map(color => (
                    <button key={color.value} onClick={() => { onUpdateGroup(group.id, { color: color.value }); setColorPickerGroupId(null); }} className={`w-5 h-5 rounded-full ${color.dot} border-2 border-white shadow-sm hover:scale-110 transition-transform flex items-center justify-center`} title={color.label}>
                      {group.color === color.value && <span className="text-white text-[7px] font-bold">&#10003;</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {groupTasks.map(task => {
                  const statusOption = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];
                  const isCompleted = task.status === 'completed';
                  return (
                    <div key={task.id} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/60 transition-colors group">
                      <button onClick={() => onToggleTaskStatus(task.id)} className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-slate-400'}`}>{isCompleted && <CheckSquare className="w-2.5 h-2.5 text-white" />}</button>
                      <input type="text" value={task.title} onChange={(e) => onUpdateTask(task.id, { title: e.target.value })} className={`flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-700 focus:outline-none focus:bg-white/80 rounded px-0.5 truncate ${isCompleted ? 'line-through text-slate-400' : ''}`} placeholder="Task title..." />
                      {task.locationPin ? (
                        <button onClick={() => onLocateTaskPin(task.id)} className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0" title="Navigate to location">
                          <MapPin className="w-2 h-2 shrink-0" /><span>Loc</span>
                        </button>
                      ) : (
                        <button onClick={() => onDropTaskLocation(task.id)} className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-medium text-slate-500 hover:bg-slate-100 transition-colors shrink-0" title="Drop location pin">
                          <MapPin className="w-2 h-2 shrink-0" /><span>Pin</span>
                        </button>
                      )}
                      <select value={task.status} onChange={(e) => onUpdateTask(task.id, { status: e.target.value })} className="text-[9px] font-medium bg-transparent border border-slate-200 rounded px-1 py-0.5 text-slate-500 focus:outline-none shrink-0">{STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.abbr}</option>))}</select>
                      <select value={task.groupId} onChange={(e) => onMoveTaskToGroup(task.id, e.target.value)} className="text-[9px] font-medium bg-transparent border border-slate-200 rounded px-1 py-0.5 text-slate-500 focus:outline-none shrink-0 max-w-[60px]">{sortedGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}</select>
                      {task.note && <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />}
                      <button onClick={() => onDeleteTask(task.id)} className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Delete"><X className="w-3 h-3" /></button>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
    );
  };

  return (
    <div className={`${taskPanelMode === 'fullscreen' ? 'flex-1' : 'w-1/2'} bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Tasks</h3>
          <span className="text-xs text-slate-400 font-medium">({tasks.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden mr-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`} title="List View"><LayoutList className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('card')} className={`p-1.5 transition-colors ${viewMode === 'card' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`} title="Card View"><Grid3X3 className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => setShowAddGroup(!showAddGroup)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors" title="Add Group"><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={() => setTaskPanelMode(taskPanelMode === 'split' ? 'fullscreen' : 'split')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors" title={taskPanelMode === 'split' ? 'Fullscreen' : 'Split View'}>{taskPanelMode === 'split' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}</button>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Close"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Group Navigation Tabs */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveGroupTab('all')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${activeGroupTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >All ({statusFilter !== 'all' ? tasks.filter(t => t.status === statusFilter).length : tasks.length})</button>
        {sortedGroups.map(group => {
          let groupTasks = tasks.filter(t => t.groupId === group.id);
          if (statusFilter !== 'all') {
            groupTasks = groupTasks.filter(t => t.status === statusFilter);
          }
          const count = groupTasks.length;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroupTab(group.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${activeGroupTab === group.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >{group.name} ({count})</button>
          );
        })}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 overflow-x-auto shrink-0">
        <Filter className="w-3 h-3 text-slate-400 shrink-0" />
        <button onClick={() => setStatusFilter('all')} className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>All ({getStatusCount('all')})</button>
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)} className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${statusFilter === opt.value ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{opt.abbr} ({getStatusCount(opt.value)})</button>
        ))}
      </div>

      {/* Add Group Input */}
      {showAddGroup && (
        <div className="px-3 py-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5">
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddGroup(); if (e.key === 'Escape') { setShowAddGroup(false); setNewGroupName(''); } }} placeholder="New group name..." className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300" autoFocus />
            <button onClick={handleAddGroup} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">Add</button>
            <button onClick={() => { setShowAddGroup(false); setNewGroupName(''); }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {viewMode === 'list' ? renderListView() : renderCardView()}
      </div>
    </div>
  );
}
