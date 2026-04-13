import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shipmentService } from '../services/shipmentService';
import {
  ArrowLeftIcon,
  MapPinIcon,
  TruckIcon,
  UserIcon,
  ScaleIcon,
  CalendarIcon,
  ClockIcon,
  CubeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  StarIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { getStatusBadge, getStatusText } from '../constants/colors';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const diffMinutes = (a, b) => {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 60000);
};

const StatusStep = ({ label, done, active }) => (
  <div className="flex flex-col items-center gap-1.5 flex-1">
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
        ${done || active
          ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200'
          : 'bg-white border-gray-200'}`}
    >
      {done ? (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : active ? (
        <div className="w-2.5 h-2.5 rounded-full bg-white" />
      ) : null}
    </div>
    <span className={`text-xs font-medium ${done || active ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
      <div className="p-1.5 bg-blue-50 rounded-lg">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Field = ({ label, value, mono, accent }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${accent ? 'text-blue-700' : 'text-gray-800'}`}>
      {value || '—'}
    </p>
  </div>
);

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

// ─── status progress bar ─────────────────────────────────────────────────────

const STEPS = ['pending', 'assigned', 'in_progress', 'completed'];

const ProgressTrack = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
        <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Shipment Cancelled</p>
          <p className="text-xs text-red-400 mt-0.5">This shipment is no longer active.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="relative flex items-start justify-between">
      {/* connector line */}
      <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-100 z-0" />
      <div
        className="absolute left-0 top-4 h-0.5 bg-blue-500 z-0 transition-all duration-700"
        style={{ width: currentIdx <= 0 ? '0%' : `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
      />
      {STEPS.map((step, i) => (
        <StatusStep
          key={step}
          label={step === 'in_progress' ? 'In Progress' : step.charAt(0).toUpperCase() + step.slice(1)}
          done={i < currentIdx}
          active={i === currentIdx}
        />
      ))}
    </div>
  );
};

// ─── delay alert ─────────────────────────────────────────────────────────────

const DelayAlert = ({ planned, actual, label }) => {
  if (!planned || !actual) return null;
  const diff = diffMinutes(planned, actual);
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  const display = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700 mt-3">
      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
      {label} delayed by <strong>{display}</strong>
    </div>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['shipmentDetail', id],  // change key to avoid conflict
  queryFn: async () => {
    const res = await shipmentService.getById(id);
    console.log('raw res:', res);
    // res = { success: true, data: {...} }
    if (res?.success && res?.data) return res.data;
    if (res?.data) return res.data;
    return res;
  },
  enabled: !!id,
  retry: 1,
});

  const s = data;

  // ── loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-400">Loading shipment…</p>
        </div>
      </div>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (isError || !s) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">Shipment not found</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 text-sm hover:underline">← Go back</button>
        </div>
      </div>
    );
  }

  // ── derived values ────────────────────────────────────────────────────────
  const statusBadge = getStatusBadge(s.status, 'shipment', 'md');
  const statusText = getStatusText(s.status);

  const loadingOvertime =
    s.actualLoadingDurationMinutes != null &&
    s.plannedLoadingDurationMinutes != null &&
    s.actualLoadingDurationMinutes > s.plannedLoadingDurationMinutes
      ? Math.round(s.actualLoadingDurationMinutes - s.plannedLoadingDurationMinutes)
      : null;

  const typeIcon = s.shipmentType === 'refrigerated' ? '❄️' : s.shipmentType === 'fragile' ? '📦' : '📦';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── top bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900 font-mono">
                  {s.shipmentId || s._id}
                </h1>
                <span className={statusBadge}>{statusText}</span>
                {s.isPriority && <Badge color="red">⚡ Priority</Badge>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Created {fmt(s.createdAt)} · Updated {fmt(s.updatedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Status progress */}
        <Section title="Status Progress" icon={CheckCircleIcon}>
          <ProgressTrack status={s.status} />
        </Section>

        {/* Route + Cargo side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Route */}
          <Section title="Route" icon={MapPinIcon}>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-blue-500 flex-shrink-0 ring-4 ring-blue-50" />
                <div>
                  <p className="text-xs text-gray-400">Origin</p>
                  <p className="text-sm font-semibold text-gray-800">{s.origin}</p>
                  {s.originCoordinates && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {s.originCoordinates.lat}, {s.originCoordinates.lng}
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-1 border-l-2 border-dashed border-gray-200 h-5" />
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-emerald-500 flex-shrink-0 ring-4 ring-emerald-50" />
                <div>
                  <p className="text-xs text-gray-400">Destination</p>
                  <p className="text-sm font-semibold text-gray-800">{s.destination}</p>
                  {s.destinationCoordinates && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {s.destinationCoordinates.lat}, {s.destinationCoordinates.lng}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* Cargo */}
          <Section title="Cargo" icon={CubeIcon}>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Description" value={s.description} />
              <div className="flex items-start gap-2">
                <span className="text-xl mt-0.5">{typeIcon}</span>
                <Field label="Type" value={s.shipmentType?.charAt(0).toUpperCase() + s.shipmentType?.slice(1)} />
              </div>
              <div className="flex items-center gap-2">
                <ScaleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <Field label="Weight" value={`${s.weightKg} kg`} />
              </div>
              <Field label="Priority" value={s.isPriority ? '⚡ Yes' : 'Normal'} />
            </div>
          </Section>
        </div>

        {/* Schedule */}
        <Section title="Schedule" icon={CalendarIcon}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="Planned Departure" value={fmt(s.plannedDepartureDate)} />
            <Field label="Planned Delivery" value={fmt(s.plannedDeliveryDate)} />
            <Field label="Actual Departure" value={fmt(s.actualDepartureDate)} />
            <Field label="Actual Delivery" value={fmt(s.actualDeliveryDate)} />
          </div>
          <DelayAlert planned={s.plannedDeliveryDate} actual={s.actualDeliveryDate} label="Delivery" />
        </Section>

        {/* Loading Duration */}
        <Section title="Loading Duration" icon={ClockIcon}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Planned (min)</p>
              <p className="text-2xl font-bold text-gray-900">
                {s.plannedLoadingDurationMinutes ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Actual (min)</p>
              <p className={`text-2xl font-bold ${loadingOvertime ? 'text-red-600' : 'text-gray-900'}`}>
                {s.actualLoadingDurationMinutes != null
                  ? s.actualLoadingDurationMinutes.toFixed(1)
                  : s.loadingStartedAt && !s.loadingCompletedAt
                  ? <span className="text-sm text-blue-500 font-medium">In progress…</span>
                  : '—'}
              </p>
            </div>
            {s.loadingStartedAt && (
              <Field label="Loading Started" value={fmt(s.loadingStartedAt)} />
            )}
            {s.loadingCompletedAt && (
              <Field label="Loading Completed" value={fmt(s.loadingCompletedAt)} />
            )}
          </div>
          {loadingOvertime && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Loading overtime by <strong>{loadingOvertime} min</strong>
            </div>
          )}
        </Section>

        {/* Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Truck */}
          <Section title="Truck" icon={TruckIcon}>
            {s.truck ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <TruckIcon className="h-6 w-6 text-sky-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-base font-bold text-gray-900 font-mono">{s.truck.licensePlate}</p>
                  <p className="text-sm text-gray-500">{s.truck.brand} {s.truck.model}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge color="blue">{s.truck.type}</Badge>
                    <Badge color={s.truck.status === 'available' ? 'emerald' : 'amber'}>
                      {s.truck.status}
                    </Badge>
                    {s.truck.capacity && (
                      <Badge color="gray">{s.truck.capacity}t capacity</Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No truck assigned</p>
            )}
          </Section>

          {/* Driver */}
          <Section title="Driver" icon={UserIcon}>
            {s.driver ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-lg">
                  {s.driver.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-base font-bold text-gray-900">{s.driver.name}</p>
                  {s.driver.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <PhoneIcon className="h-3.5 w-3.5" /> {s.driver.phone}
                    </p>
                  )}
                  {s.driver.licenseNumber && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <IdentificationIcon className="h-3.5 w-3.5" /> {s.driver.licenseNumber}
                    </p>
                  )}
                  {s.driver.score != null && (
                    <div className="flex items-center gap-1 mt-1">
                      <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-amber-600">Score: {s.driver.score}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No driver assigned</p>
            )}
          </Section>
        </div>

        {/* Customer */}
        {(s.customer?.name || s.customer?.phone) && (
          <Section title="Customer" icon={BuildingOfficeIcon}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-violet-600" />
              </div>
              <div className="space-y-1">
                {s.customer.name && (
                  <p className="text-base font-bold text-gray-900">{s.customer.name}</p>
                )}
                {s.customer.phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <PhoneIcon className="h-3.5 w-3.5" /> {s.customer.phone}
                  </p>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Back link */}
        <div className="flex justify-end pt-2">
          <Link
            to="/shipment_manager/shipments"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back to Shipments
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetail;