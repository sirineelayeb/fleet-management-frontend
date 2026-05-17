import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TruckIcon, MapPinIcon, CalendarIcon, BuildingOfficeIcon,
  PhoneIcon, ClockIcon, DocumentTextIcon, PlusIcon, TrashIcon,
  UserGroupIcon, PencilIcon, CheckIcon, ExclamationTriangleIcon,
  UserIcon, EyeIcon, CubeIcon, ScaleIcon, ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon, ClipboardDocumentListIcon
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
  onArchive,
  onUnarchive,
  onEdit,
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

  useEffect(() => {
    if (!shipment?._id) return;
    setLoadingNotes(true);
    shipmentService.getNotes(shipment._id)
      .then(r => { if (r.success) setNotes(r.data || []); })
      .catch(console.error)
      .finally(() => setLoadingNotes(false));
  }, [shipment?._id]);

  useEffect(() => {
    if (!loadingNotes) notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes, loadingNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return toast.error('Note content is required');
    setAddingNote(true);
    try {
      const response = await shipmentService.addNote(shipment._id, newNote);
      if (response.success) {
        setNotes([response.data, ...notes]);
        setNewNote('');
        toast.success('Note added');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    const note = notes.find(n => n._id === noteId);
    if (!canDeleteNote(note)) return toast.error('You can only delete your own notes');
    if (!window.confirm('Delete this note?')) return;
    try {
      const response = await shipmentService.deleteNote(shipment._id, noteId);
      if (response.success) {
        setNotes(notes.filter(n => n._id !== noteId));
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleEditNote = (note) => {
    if (!canEditNote(note)) return toast.error('You can only edit your own notes');
    setEditingNoteId(note._id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEdit = async (noteId) => {
    if (!editingNoteContent.trim()) return toast.error('Note content is required');
    try {
      const response = await shipmentService.updateNote(shipment._id, noteId, editingNoteContent);
      if (response.success) {
        setNotes(notes.map(n => n._id === noteId ? { ...n, content: editingNoteContent } : n));
        setEditingNoteId(null);
        toast.success('Note updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update note');
    }
  };

  const handleViewFullHistory = () => {
    if (!user) return toast.error("Unable to navigate: User not authenticated");
    const basePath = user.role === 'admin' ? '/dashboard' : '/shipment_manager';
    navigate(`${basePath}/shipments/${shipment._id}`);
    onClose();
  };

  const handleCancelClick = () => {
    if (onCancel) onCancel(shipment._id);
  };

  const Section = ({ icon: Icon, title, children, actionButton }) => (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        </div>
        {actionButton}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const InfoRow = ({ icon: Icon, label, value, subValue }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
        {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
        <TruckIcon className="h-5 w-5 text-gray-700" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Shipment Details</p>
        <p className="text-xs text-gray-400 font-mono">{shipment?.shipmentId || shipment?._id?.slice(-8)}</p>
      </div>
      <span className={statusBadgeClass}>{statusText}</span>
    </div>
  );

  return (
    <Modal isOpen={!!shipment} onClose={onClose} title={modalTitle} size="xl">
      <div className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto px-1">
        {/* Status badges – clean text only */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md px-3 py-2 text-sm font-medium text-center bg-gray-50 text-gray-700 border border-gray-200">
            {shipment.isPriority ? 'Priority Shipment' : 'Standard Shipment'}
          </div>
          <div className="rounded-md px-3 py-2 text-sm font-medium text-center bg-gray-50 text-gray-700 border border-gray-200 capitalize">
            {shipment.shipmentType === 'refrigerated' && 'Refrigerated'}
            {shipment.shipmentType === 'fragile' && 'Fragile'}
            {(!shipment.shipmentType || shipment.shipmentType === 'normal') && 'Standard Cargo'}
          </div>
        </div>

        {/* Cargo Info */}
        <Section icon={CubeIcon} title="Cargo Information">
          <div className="space-y-1">
            {shipment.description && <InfoRow icon={ClipboardDocumentListIcon} label="Description" value={shipment.description} />}
            {shipment.goods && <InfoRow icon={CubeIcon} label="Goods Type" value={shipment.goods} />}
            {shipment.weightKg && <InfoRow icon={ScaleIcon} label="Weight" value={`${shipment.weightKg} kg`} />}
          </div>
        </Section>

        {/* Route & Schedule */}
        <Section icon={MapPinIcon} title="Route & Schedule">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <InfoRow icon={MapPinIcon} label="Origin" value={shipment.origin} subValue={shipment.originCoordinates?.lat ? `${shipment.originCoordinates.lat}, ${shipment.originCoordinates.lng}` : null} />
              <InfoRow icon={CalendarIcon} label="Planned Departure" value={formatDate(shipment.plannedDepartureDate)} />
            </div>
            <div className="space-y-2">
              <InfoRow icon={MapPinIcon} label="Destination" value={shipment.destination} subValue={shipment.destinationCoordinates?.lat ? `${shipment.destinationCoordinates.lat}, ${shipment.destinationCoordinates.lng}` : null} />
              <InfoRow icon={CalendarIcon} label="Planned Delivery" value={formatDate(shipment.plannedDeliveryDate)} />
            </div>
          </div>
        </Section>

        {/* Loading Timeline */}
        {(shipment.loadingStartedAt || shipment.loadingCompletedAt) && (
          <Section icon={ClockIcon} title="Loading Timeline">
            <div className="space-y-1">
              {shipment.loadingStartedAt && (
                <InfoRow icon={ClockIcon} label="Loading Started" value={formatDate(shipment.loadingStartedAt)} subValue={formatRelativeTime(shipment.loadingStartedAt)} />
              )}
              {shipment.loadingCompletedAt && (
                <InfoRow icon={CheckIcon} label="Loading Completed" value={formatDate(shipment.loadingCompletedAt)} subValue={formatRelativeTime(shipment.loadingCompletedAt)} />
              )}
              {shipment.actualLoadingDurationMinutes != null && (
                <InfoRow icon={ClockIcon} label="Total Duration" value={formatDuration(shipment.actualLoadingDurationMinutes)} />
              )}
              {shipment.loadingStartedAt && !shipment.loadingCompletedAt && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-200">
                  Loading in progress...
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Assignment */}
        <Section icon={TruckIcon} title="Assignment">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-md p-3 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Truck</p>
              {shipment.truck ? (
                <>
                  <p className="font-semibold text-gray-800">{shipment.truck.licensePlate}</p>
                  <p className="text-xs text-gray-500">{shipment.truck.brand} {shipment.truck.model}</p>
                </>
              ) : (
                <p className="text-gray-400 italic text-sm">Not assigned</p>
              )}
            </div>
            <div className="border border-gray-200 rounded-md p-3 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Driver</p>
              {shipment.driver ? (
                <>
                  <p className="font-semibold text-gray-800">{shipment.driver.name}</p>
                  {shipment.driver.phone && <p className="text-xs text-gray-500">{shipment.driver.phone}</p>}
                </>
              ) : (
                <p className="text-gray-400 italic text-sm">Not assigned</p>
              )}
            </div>
          </div>
        </Section>

        {/* Loading Zone & Customer */}
        <div className="grid md:grid-cols-2 gap-4">
          {shipment.loadingZone && (
            <Section icon={BuildingOfficeIcon} title="Loading Zone">
              <div className="border border-gray-200 rounded-md p-3 bg-white">
                <p className="font-semibold text-gray-800">{shipment.loadingZone.name}</p>
                {shipment.loadingZone.description && <p className="text-xs text-gray-500 mt-1">{shipment.loadingZone.description}</p>}
              </div>
            </Section>
          )}
          {shipment.customer && (
            <Section icon={BuildingOfficeIcon} title="Customer">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                  {shipment.customer.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{shipment.customer.name}</p>
                  {shipment.customer.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <PhoneIcon className="h-3 w-3" /> {shipment.customer.phone}
                    </p>
                  )}
                  {shipment.customer.email && <p className="text-xs text-gray-500">{shipment.customer.email}</p>}
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Assigned Manager */}
        {shipment.assignedTo && (
          <Section icon={UserGroupIcon} title="Assigned Manager">
            <div className="flex items-center gap-3 border border-gray-200 rounded-md p-3 bg-white">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                {(typeof shipment.assignedTo === 'object' ? shipment.assignedTo.name : '?')?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
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
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes</h3>
              <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">{notes.length}</span>
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-teal-400 focus:border-teal-400 resize-none bg-white"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 self-start text-sm font-medium"
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
                <div className="flex flex-col items-center py-8 gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full" />
                  <p className="text-sm text-gray-400">Loading notes…</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notes yet</p>
                  <p className="text-xs text-gray-400">Add the first note above</p>
                </div>
              ) : (
                notes.map((note, idx) => (
                  <div key={note._id} className="border border-gray-200 rounded-md p-3 bg-white">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700">
                            {(note.createdByName || note.createdBy?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {note.createdByName || note.createdBy?.name || 'Unknown'}
                          </span>
                          {isAdminNote(note) && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">Admin</span>
                          )}
                          <span className="text-xs text-gray-400" title={formatDate(note.createdAt)}>
                            {formatRelativeTime(note.createdAt)}
                          </span>
                        </div>
                        {editingNoteId === note._id ? (
                          <div>
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-teal-400 resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleSaveEdit(note._id)} className="px-3 py-1 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700 flex items-center gap-1">
                                <CheckIcon className="h-3 w-3" /> Save
                              </button>
                              <button onClick={() => setEditingNoteId(null)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">
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
                            <button onClick={() => handleEditNote(note)} className="p-1 text-gray-400 hover:text-teal-600 rounded">
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDeleteNote(note) && (
                            <button onClick={() => handleDeleteNote(note._id)} className="p-1 text-gray-400 hover:text-rose-600 rounded">
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

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
          <button onClick={handleViewFullHistory} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-sm font-medium">
            <EyeIcon className="h-4 w-4" />
            View Full History
          </button>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={() => { onEdit(shipment); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium">
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
            )}
            {onAssign && shipment.status === 'pending' && (
              <button onClick={() => { onAssign(shipment); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-medium">
                <UserIcon className="h-4 w-4" />
                Assign
              </button>
            )}
            {onCancel && !['completed', 'cancelled'].includes(shipment.status) && (
              <button onClick={handleCancelClick} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Cancel
              </button>
            )}
            {!shipment.isArchived ? (
              onArchive && ['completed', 'cancelled'].includes(shipment.status) && (
                <button onClick={() => { onArchive(shipment._id); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium">
                  <ArchiveBoxArrowDownIcon className="h-4 w-4" />
                  Archive
                </button>
              )
            ) : (
              onUnarchive && (
                <button onClick={() => { onUnarchive(shipment._id); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-medium">
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                  Restore
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShipmentDetailsModal;