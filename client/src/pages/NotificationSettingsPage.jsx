import React, { useCallback, useEffect, useState } from 'react';
import { LuBellRing, LuCheck, LuCircleAlert, LuSmartphone } from 'react-icons/lu';
import { notificationAPI } from '../services/api.js';
import { ErrorState, PageHeading } from '../components/WorkspaceUI.jsx';

const supportsPush = () => (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window
);

const decodeVapidKey = (key) => {
  const padded = `${key}${'='.repeat((4 - (key.length % 4)) % 4)}`;
  const decoded = window.atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [supported] = useState(supportsPush);
  const [permission, setPermission] = useState(() => (
    supportsPush() ? Notification.permission : 'unsupported'
  ));
  const [deviceEnabled, setDeviceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSettings = useCallback(async () => {
    setError('');
    try {
      const response = await notificationAPI.getSettings();
      setSettings(response.data);
      if (supportsPush()) {
        setPermission(Notification.permission);
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setDeviceEnabled(Boolean(subscription));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Notification settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const enableNotifications = async () => {
    if (!supported || !settings?.enabled) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        setError(permissionResult === 'denied'
          ? 'Notifications are blocked for this site. Allow them in your browser or device settings, then try again.'
          : 'Notification permission was not granted.');
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(settings.publicKey),
        });
      }

      await notificationAPI.saveSubscription(subscription.toJSON());
      setDeviceEnabled(true);
      setSettings((current) => ({ ...current, deviceCount: current.deviceCount + 1 }));
      setNotice('Phone notifications are enabled on this device.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Could not enable notifications on this device.');
    } finally {
      setSaving(false);
    }
  };

  const disableNotifications = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await notificationAPI.removeSubscription(subscription.endpoint);
        await subscription.unsubscribe();
        setSettings((current) => ({ ...current, deviceCount: Math.max(0, current.deviceCount - 1) }));
      }
      setDeviceEnabled(false);
      setNotice('Phone notifications are disabled on this device.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Could not disable notifications on this device.');
    } finally {
      setSaving(false);
    }
  };

  const canEnable = supported && settings?.enabled && permission !== 'denied';

  return (
    <div className="space-y-7 py-7 sm:py-9">
      <PageHeading
        eyebrow="Stay in the loop"
        title="Phone notifications"
        description="Get a timely nudge when a teammate assigns work or adds you to a shared workspace."
      />

      {error && <ErrorState message={error} onRetry={loadSettings} />}

      <section className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800">
            <LuBellRing aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">Push notifications</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Alerts arrive on this device even when TaskFlow is not open. Notification previews keep task and workspace names private.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              {deviceEnabled
                ? <LuCheck aria-hidden="true" className="h-4 w-4 text-emerald-700" />
                : <LuSmartphone aria-hidden="true" className="h-4 w-4 text-slate-400" />}
              <span>{loading ? 'Checking this device…' : deviceEnabled ? 'Enabled on this device' : 'Not enabled on this device'}</span>
            </div>
            <span className="text-xs text-slate-500">
              {settings ? `${settings.deviceCount} of 10 devices enabled` : ''}
            </span>
          </div>

          {!supported && (
            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">
              <LuCircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              This browser does not support web push. Try a current browser on your phone.
            </div>
          )}

          {supported && permission === 'denied' && (
            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">
              <LuCircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Notifications are blocked by your browser. Change this site’s notification permission in your browser or device settings.
            </div>
          )}

          {supported && !settings?.enabled && !loading && (
            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">
              <LuCircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Push service is not configured for this TaskFlow server yet.
            </div>
          )}

          {notice && <p role="status" className="text-sm font-medium text-emerald-800">{notice}</p>}

          {deviceEnabled ? (
            <button type="button" onClick={disableNotifications} disabled={saving || loading} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Updating…' : 'Turn off on this device'}
            </button>
          ) : (
            <button type="button" onClick={enableNotifications} disabled={saving || loading || !canEnable} className="rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Enabling…' : 'Enable phone notifications'}
            </button>
          )}
        </div>
      </section>

      <aside className="max-w-3xl rounded-xl border border-slate-200/70 bg-white/70 p-4 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-800">Using an iPhone?</p>
        <p className="mt-1">On iOS 16.4 or later, add TaskFlow to your Home Screen, open it from there, then enable notifications. Push also requires a secure HTTPS connection outside localhost.</p>
      </aside>
    </div>
  );
};

export default NotificationSettingsPage;
