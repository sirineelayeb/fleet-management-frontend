import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TruckIcon, 
  MapPinIcon, 
  CalendarIcon, 
  BuildingOfficeIcon,
  PhoneIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  PlusIcon, 
  TrashIcon,
  UserGroupIcon, 
  PencilIcon, 
  CheckIcon, 
  ExclamationTriangleIcon, 
  UserIcon,
  EyeIcon,
  ArrowPathIcon,
  CubeIcon,
  ScaleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Modal from '../Common/Modal';
import { getStatusBadge, getStatusText } from '../../constants/colors';
import { shipmentService } from '../../services/shipmentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ShipmentDetailsModal = ({ 
  shipment, 
  onClose, 
  onAssign, 
  onCancel, 
  onDelete, 
  onEdit,
  onRefresh 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id?.toString() || user?.id?.toString();

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const notesEndRef = useRef(null);

  // Early return if no shipment
  if (!shipment) return null;

  const statusBadgeClass = getStatusBadge(shipment?.status, 'shipment', 'md');
  const statusText = getStatusText(shipment?.status);

  const formatDate = (date) => date ? new Date(date).toLocaleString() : '—';
  
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  const formatRelativeTime = (date) => {
    if (!date) return '';
    const diff = new Date() - new Date(date);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  const canEditNote = (note) => {
    const noteUserId = note.createdBy?._id?.toString() || note.createdBy?.toString();
    return user?.role === 'admin' || noteUserId === currentUserId;
  };
  
  const canDeleteNote = (note) => canEditNote(note);
  const isAdminNote = (note) => note.createdBy?.role === 'admin';

  // Load notes
  useEffect(() => {
    if (!shipment?._id) return;
    setLoadingNotes(true);
    shipmentService.getNotes(shipment._id)
      .then(r => {
        if (r.success) {
          setNotes(r.data || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingNotes(false));
  }, [shipment?._id]);

  useEffect(() => {
    if (!loadingNotes) {
      notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notes, loadingNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Note content is required');
      return;
    }
    setAddingNote(true);
    try {
      const response = await shipmentService.addNote(shipment._id, newNote);
      if (response.success) {
        setNotes([response.data, ...notes]);
        setNewNote('');
        toast.success('Note added');
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    const note = notes.find(n => n._id === noteId);
    if (!canDeleteNote(note)) {
      toast.error('You can only delete your own notes');
      return;
    }
    if (!window.confirm('Delete this note?')) return;
    try {
      const response = await shipmentService.deleteNote(shipment._id, noteId);
      if (response.success) {
        setNotes(notes.filter(n => n._id !== noteId));
        toast.success('Note deleted');
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleEditNote = (note) => {
    if (!canEditNote(note)) {
      toast.error('You can only edit your own notes');
      return;
    }
    setEditingNoteId(note._id);
    setEditingNoteContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleSaveEdit = async (noteId) => {
    if (!editingNoteContent.trim()) {
      toast.error('Note content is required');
      return;
    }
    try {
      const response = await shipmentService.updateNote(shipment._id, noteId, editingNoteContent);
      if (response.success) {
        setNotes(notes.map(n => n._id === noteId ? { ...n, content: editingNoteContent } : n));
        handleCancelEdit();
        toast.success('Note updated');
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update note');
    }
  };

  const getUserInitials = (name) => name?.charAt(0).toUpperCase() || 'U';
  
  const getUserColor = (note) => {
    if (isAdminNote(note)) return 'bg-red-100 text-red-700';
    const palette = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700'
    ];
    const hash = (note.createdByName || note.createdBy?.name || '').length;
    return palette[hash % palette.length];
  };
  const handleViewFullHistory = () => {
    if (!user) {
      toast.error("Unable to navigate: User not authenticated");
      return;
    }

    const basePath = user.role === 'admin' ? '/dashboard' : '/shipment_manager';

    navigate(`${basePath}/shipments/${shipment._id}`);
    onClose();
  };

  const Section = ({ icon: Icon, title, children, actionButton }) => (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-gray-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        </div>
        {actionButton}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const InfoCard = ({ icon: Icon, label, value, subValue, color = 'gray' }) => {
    const colors = {
      green: { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-200', iconColor: 'text-green-700', labelColor: 'text-green-700', valueColor: 'text-gray-800' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-200', iconColor: 'text-blue-700', labelColor: 'text-blue-700', valueColor: 'text-gray-800' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-200', iconColor: 'text-purple-700', labelColor: 'text-purple-700', valueColor: 'text-gray-800' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-100', iconBg: 'bg-gray-200', iconColor: 'text-gray-600', labelColor: 'text-gray-600', valueColor: 'text-gray-800' }
    };
    const style = colors[color] || colors.gray;
    
    return (
      <div className={`flex items-start gap-3 p-3 ${style.bg} rounded-xl border ${style.border}`}>
        <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${style.iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold ${style.labelColor} uppercase tracking-wide`}>{label}</p>
          <p className={`text-sm font-medium ${style.valueColor} mt-0.5`}>{value || '—'}</p>
          {subValue && <p className="text-xs mt-0.5 text-gray-500">{subValue}</p>}
        </div>
      </div>
    );
  };

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
        <TruckIcon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Shipment Details</p>
        <p className="text-xs text-gray-400 font-mono">{shipment?.shipmentId || shipment?._id?.slice(-8)}</p>
      </div>
      {shipment && <span className={statusBadgeClass}>{statusText}</span>}
    </div>
  );

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel(shipment._id);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <Modal isOpen={!!shipment} onClose={onClose} title={modalTitle} size="xl">
      <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
        
        {/* Header Status Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center border ${
            shipment.isPriority 
              ? 'bg-red-50 text-red-700 border-red-200' 
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            {shipment.isPriority ? '🚨 Priority Shipment' : '📦 Standard Shipment'}
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-center border border-gray-200 capitalize">
            {shipment.shipmentType === 'refrigerated' && '❄️ Refrigerated'}
            {shipment.shipmentType === 'fragile' && '🔔 Fragile'}
            {(!shipment.shipmentType || shipment.shipmentType === 'normal') && '📦 Standard Cargo'}
          </div>
        </div>

        {/* Cargo Information */}
        <Section icon={CubeIcon} title="Cargo Information">
          <div className="space-y-3">
            {shipment.description && (
              <InfoCard icon={ClipboardDocumentListIcon} label="Description" value={shipment.description} />
            )}
            {shipment.goods && (
              <InfoCard icon={CubeIcon} label="Goods Type" value={shipment.goods} />
            )}
            {shipment.weightKg && (
              <InfoCard icon={ScaleIcon} label="Weight" value={`${shipment.weightKg} kg`} />
            )}
          </div>
        </Section>

        {/* Route & Schedule Combined */}
        <Section icon={MapPinIcon} title="Route & Schedule">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Origin</p>
                <p className="font-semibold text-gray-800 text-sm">{shipment.origin || '—'}</p>
                {shipment.originCoordinates?.lat && (
                  <p className="text-xs text-gray-400 mt-1">📍 {shipment.originCoordinates.lat}, {shipment.originCoordinates.lng}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Planned Departure</p>
                <p className="font-semibold text-gray-800 text-sm">{formatDate(shipment.plannedDepartureDate)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Destination</p>
                <p className="font-semibold text-gray-800 text-sm">{shipment.destination || '—'}</p>
                {shipment.destinationCoordinates?.lat && (
                  <p className="text-xs text-gray-400 mt-1">📍 {shipment.destinationCoordinates.lat}, {shipment.destinationCoordinates.lng}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Planned Delivery</p>
                <p className="font-semibold text-gray-800 text-sm">{formatDate(shipment.plannedDeliveryDate)}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Loading Timeline */}
        {(shipment.loadingStartedAt || shipment.loadingCompletedAt) && (
          <Section icon={ClockIcon} title="Loading Timeline">
            <div className="space-y-3">
              {shipment.loadingStartedAt && (
                <InfoCard 
                  icon={ClockIcon} 
                  label="Loading Started" 
                  value={formatDate(shipment.loadingStartedAt)}
                  subValue={formatRelativeTime(shipment.loadingStartedAt)}
                  color="green"
                />
              )}
              {shipment.loadingCompletedAt && (
                <InfoCard 
                  icon={CheckIcon} 
                  label="Loading Completed" 
                  value={formatDate(shipment.loadingCompletedAt)}
                  subValue={formatRelativeTime(shipment.loadingCompletedAt)}
                  color="blue"
                />
              )}
              {shipment.actualLoadingDurationMinutes !== null && shipment.actualLoadingDurationMinutes !== undefined && (
                <InfoCard 
                  icon={ClockIcon} 
                  label="Total Duration" 
                  value={formatDuration(shipment.actualLoadingDurationMinutes)}
                  color="purple"
                />
              )}
              {shipment.loadingStartedAt && !shipment.loadingCompletedAt && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />
                    <span className="text-sm font-medium text-yellow-700">Loading in progress...</span>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Assignment Details */}
        <Section icon={TruckIcon} title="Assignment">
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`rounded-xl p-3 border ${shipment.truck ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Truck</p>
              {shipment.truck ? (
                <>
                  <p className="font-semibold text-gray-800">{shipment.truck.licensePlate}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{shipment.truck.brand} {shipment.truck.model}</p>
                </>
              ) : (
                <p className="text-gray-400 text-sm italic">Not assigned</p>
              )}
            </div>
            <div className={`rounded-xl p-3 border ${shipment.driver ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Driver</p>
              {shipment.driver ? (
                <>
                  <p className="font-semibold text-gray-800">{shipment.driver.name}</p>
                  {shipment.driver.phone && <p className="text-xs text-gray-500 mt-0.5">{shipment.driver.phone}</p>}
                </>
              ) : (
                <p className="text-gray-400 text-sm italic">Not assigned</p>
              )}
            </div>
          </div>
        </Section>

        {/* Location Details */}
        <div className="grid md:grid-cols-2 gap-4">
          {shipment.loadingZone && (
            <Section icon={BuildingOfficeIcon} title="Loading Zone">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="font-semibold text-gray-800 text-sm">{shipment.loadingZone.name}</p>
                {shipment.loadingZone.description && (
                  <p className="text-xs text-gray-500 mt-1">{shipment.loadingZone.description}</p>
                )}
              </div>
            </Section>
          )}

          {shipment.customer && (
            <Section icon={BuildingOfficeIcon} title="Customer">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                  {shipment.customer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{shipment.customer.name}</p>
                  {shipment.customer.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <PhoneIcon className="h-3 w-3" /> {shipment.customer.phone}
                    </p>
                  )}
                  {shipment.customer.email && (
                    <p className="text-xs text-gray-500 mt-0.5">{shipment.customer.email}</p>
                  )}
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Assigned Manager */}
        {shipment.assignedTo && (
          <Section icon={UserGroupIcon} title="Assigned Manager">
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {(typeof shipment.assignedTo === 'object' ? shipment.assignedTo.name : '?')?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {typeof shipment.assignedTo === 'object' ? shipment.assignedTo.name : shipment.assignedTo}
                </p>
                {typeof shipment.assignedTo === 'object' && shipment.assignedTo.email && (
                  <p className="text-xs text-gray-500">{shipment.assignedTo.email}</p>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Notes Section */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center">
                <DocumentTextIcon className="h-3.5 w-3.5 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes</h3>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{notes.length}</span>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                placeholder="Write a note… (Enter to submit, Shift+Enter for new line)"
                rows="2"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 self-start text-sm font-medium"
              >
                {addingNote ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
                Add
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loadingNotes ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                  <p className="text-sm text-gray-400">Loading notes…</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-10">
                  <DocumentTextIcon className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No notes yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add the first note above</p>
                </div>
              ) : (
                notes.map((note, index) => (
                  <div key={note._id} className={`bg-white border rounded-2xl p-3.5 hover:shadow-md transition-all ${
                    index === 0 ? 'border-l-4 border-l-blue-500 border-t border-r border-b border-gray-200' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getUserColor(note)}`}>
                            {getUserInitials(note.createdByName || note.createdBy?.name)}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {note.createdByName || note.createdBy?.name || 'Unknown'}
                            </span>
                            {isAdminNote(note) && (
                              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
                            )}
                            <span className="text-xs text-gray-400" title={formatDate(note.createdAt)}>
                              · {formatRelativeTime(note.createdAt)}
                            </span>
                          </div>
                        </div>

                        {editingNoteId === note._id ? (
                          <div>
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleSaveEdit(note._id)} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-1">
                                <CheckIcon className="h-3 w-3" /> Save
                              </button>
                              <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        )}
                      </div>

                      {!editingNoteId && (canEditNote(note) || canDeleteNote(note)) && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {canEditNote(note) && (
                            <button onClick={() => handleEditNote(note)} className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDeleteNote(note) && (
                            <button onClick={() => handleDeleteNote(note._id)} className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50">
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={notesEndRef} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button onClick={handleViewFullHistory} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium">
              <EyeIcon className="h-4 w-4" />
              View Full History
            </button>
            {onRefresh && (
              <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={() => { onEdit(shipment); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium">
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
            )}
            {onAssign && shipment.status === 'pending' && (
              <button onClick={() => { onAssign(shipment); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium">
                <UserIcon className="h-4 w-4" />
                Assign
              </button>
            )}
            {onCancel && !['completed', 'cancelled'].includes(shipment.status) && (
              <button onClick={handleCancelClick} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 text-sm font-medium">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Cancel
              </button>
            )}
            {onDelete && shipment.status === 'pending' && (
              <button onClick={() => { onDelete(shipment._id); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium">
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShipmentDetailsModal;