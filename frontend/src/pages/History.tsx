import { useEffect, useState, useMemo, useCallback } from 'react';
import { History as HistoryIcon, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import StatTiles from '../components/history/StatTiles';
import HistoryFilters from '../components/history/HistoryFilters';
import HistoryList, { type HistoryItemData } from '../components/history/HistoryList';
import ConfirmDialog from '../components/history/ConfirmDialog';
import GuestUpgradeBanner from '../components/auth/GuestUpgradeBanner';
import { API_BASE } from '../api/client';


export default function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFeature, setSelectedFeature] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, 'users', user.uid, 'analyses');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      const loaded: HistoryItemData[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        let createdIso = new Date().toISOString();
        if (d.createdAt?.toDate) {
          createdIso = d.createdAt.toDate().toISOString();
        } else if (typeof d.createdAt === 'string') {
          createdIso = d.createdAt;
        }

        return {
          id: docSnap.id,
          featureType: d.featureType || 'conversation',
          createdAt: createdIso,
          riskScore: d.riskScore ?? null,
          riskLevel: d.riskLevel ?? null,
          summary: d.summary || 'Analysis report',
          topIndicators: d.topIndicators || (d.factors || []).slice(0, 3).map((f: { title?: string; code?: string }) => f.title || f.code),
        };
      });

      setItems(loaded);
    } catch (e: unknown) {
      setError((e instanceof Error && e.message) || 'Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    const featureCounts: Record<string, number> = {};

    for (const item of items) {
      if (item.riskLevel === 'CRITICAL') critical++;
      else if (item.riskLevel === 'HIGH') high++;
      else if (item.riskLevel === 'MEDIUM') medium++;
      else if (item.riskLevel === 'LOW') low++;

      featureCounts[item.featureType] = (featureCounts[item.featureType] || 0) + 1;
    }

    let mostUsedFeature: string | null = null;
    let maxCount = 0;
    for (const [feat, cnt] of Object.entries(featureCounts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        mostUsedFeature = feat.replace('_', ' ');
      }
    }

    return { total, critical, high, medium, low, mostUsedFeature };
  }, [items]);

  // Filtering and Sorting
  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedFeature !== 'all') {
      const target = selectedFeature === 'qr_payment' ? 'payment' : selectedFeature === 'what_if' ? 'whatif' : selectedFeature;
      result = result.filter((it) => it.featureType === target || it.featureType === selectedFeature);
    }

    return [...result].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [items, selectedFeature, sortOrder]);

  // Delete single item
  const handleDeleteOne = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
      } else {
        setError('Failed to delete report.');
      }
    } catch (e: unknown) {
      setError((e instanceof Error && e.message) || 'Failed to delete report.');
    }
  };

  // Clear all items
  const handleClearAll = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems([]);
        setConfirmClearOpen(false);
      } else {
        setError('Failed to clear history.');
      }
    } catch (e: unknown) {
      setError((e instanceof Error && e.message) || 'Failed to clear history.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn">
      {user?.isAnonymous && (
        <div className="mb-6">
          <GuestUpgradeBanner />
        </div>
      )}

      <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/20 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="icon-tile icon-tile-gradient w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
            <HistoryIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Investigation History</h1>
            <p className="text-xs sm:text-sm text-gray-300">Review past security scans, threat factors, and attack paths</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="btn-glass text-xs font-bold px-4 py-2 min-h-[44px] text-[#F43F5E] border-[#F43F5E]/30 hover:bg-[#F43F5E]/15 self-end sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-gray-400">Loading analysis reports...</span>
        </div>
      ) : (
        <>
          <StatTiles
            total={stats.total}
            critical={stats.critical}
            high={stats.high}
            medium={stats.medium}
            low={stats.low}
            mostUsedFeature={stats.mostUsedFeature}
          />

          <HistoryFilters
            selectedFeature={selectedFeature}
            onSelectFeature={setSelectedFeature}
            sortOrder={sortOrder}
            onToggleSort={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          />

          <HistoryList
            items={filteredItems}
            onDeleteOne={handleDeleteOne}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Clear All Analysis History?"
        message="This will permanently delete all your saved scans and associated What-If simulations from Firestore. This action cannot be undone."
        confirmText={actionLoading ? 'Deleting...' : 'Yes, Delete All'}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
}
