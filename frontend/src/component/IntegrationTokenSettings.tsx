import React, { useEffect, useMemo, useState } from 'react';
import { integrationTokensApi, type IntegrationScopes, type IntegrationTokenRow } from '../api/integrationTokens';

const defaultScopes: IntegrationScopes = {
  projects: true,
  finance: false,
  reports: true,
  team: false,
  inventory: false,
};

const scopeKeys: Array<keyof IntegrationScopes> = ['projects', 'finance', 'reports', 'team', 'inventory'];

const parseScopes = (raw: string): IntegrationScopes => {
  try {
    const obj = JSON.parse(raw || '{}');
    return {
      projects: !!obj.projects,
      finance: !!obj.finance,
      reports: !!obj.reports,
      team: !!obj.team,
      inventory: !!obj.inventory,
    };
  } catch {
    return { ...defaultScopes };
  }
};

const IntegrationTokenSettings: React.FC = () => {
  const [rows, setRows] = useState<IntegrationTokenRow[]>([]);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<IntegrationScopes>({ ...defaultScopes });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [createdToken, setCreatedToken] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editScopes, setEditScopes] = useState<IntegrationScopes>({ ...defaultScopes });
  const [editActive, setEditActive] = useState(true);

  const canCreate = useMemo(() => name.trim().length > 0 && scopeKeys.some((k) => scopes[k]), [name, scopes]);

  const loadRows = async () => {
    setLoading(true);
    try {
      setRows(await integrationTokensApi.list());
    } catch {
      setMessage('Gagal memuat integration token.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const createToken = async () => {
    if (!canCreate) return;
    setMessage('');
    setCreatedToken('');
    try {
      const out = await integrationTokensApi.create(name.trim(), scopes);
      setCreatedToken(out.token);
      setName('');
      setScopes({ ...defaultScopes });
      setMessage('Integration token berhasil dibuat.');
      await loadRows();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal membuat integration token.';
      setMessage(String(msg));
    }
  };

  const toggleActive = async (row: IntegrationTokenRow) => {
    const currentScopes = parseScopes(row.scopes);
    try {
      await integrationTokensApi.update(row.id, row.name, currentScopes, !row.is_active);
      await loadRows();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal update status token.';
      setMessage(String(msg));
    }
  };

  const removeToken = async (row: IntegrationTokenRow) => {
    try {
      await integrationTokensApi.remove(row.id);
      await loadRows();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal hapus token.';
      setMessage(String(msg));
    }
  };

  const startEdit = (row: IntegrationTokenRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditScopes(parseScopes(row.scopes));
    setEditActive(!!row.is_active);
  };

  const saveEdit = async (row: IntegrationTokenRow) => {
    if (!scopeKeys.some((k) => editScopes[k])) {
      setMessage('Minimal pilih satu akses scope.');
      return;
    }
    try {
      await integrationTokensApi.update(row.id, editName.trim() || row.name, editScopes, editActive);
      setEditingId(null);
      setMessage('Akses token berhasil diupdate.');
      await loadRows();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal update akses token.';
      setMessage(String(msg));
    }
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Integration API Token</h2>
      <p className="text-gray-500 mb-4">Token untuk aplikasi lain (scope-based), terpisah dari Smart Nota API Key.</p>

      <div className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama token (contoh: SmartNota Sync)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {scopeKeys.map((key) => (
            <label key={key} className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={scopes[key]}
                onChange={(e) => setScopes((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
        <button
          onClick={createToken}
          disabled={!canCreate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Generate Token
        </button>
      </div>

      {createdToken && (
        <div className="p-3 mb-4 rounded-lg border border-amber-200 bg-amber-50">
          <div className="text-sm font-semibold text-amber-800 mb-1">Simpan token ini sekarang (hanya tampil sekali):</div>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 border rounded bg-white text-sm" readOnly value={createdToken} />
            <button
              onClick={() => navigator.clipboard.writeText(createdToken)}
              className="px-3 py-2 bg-amber-600 text-white rounded"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="text-sm font-semibold text-gray-700 mb-2">Daftar Token</div>
      {loading ? (
        <div className="text-sm text-gray-500">Memuat...</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const rowScopes = parseScopes(row.scopes);
            return (
              <div key={row.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-800">{row.name}</div>
                    <div className="text-xs text-gray-500">Prefix: {row.token_prefix} • Dibuat: {new Date(row.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(row)} className="px-3 py-1.5 text-xs rounded bg-amber-600 text-white">
                      Edit Access
                    </button>
                    <button onClick={() => toggleActive(row)} className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white">
                      {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => removeToken(row)} className="px-3 py-1.5 text-xs rounded bg-red-600 text-white">
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {scopeKeys.filter((k) => rowScopes[k]).map((k) => (
                    <span key={k} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">{k}</span>
                  ))}
                </div>
                {editingId === row.id && (
                  <div className="mt-3 border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {scopeKeys.map((key) => (
                        <label key={key} className="text-sm flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editScopes[key]}
                            onChange={(e) => setEditScopes((prev) => ({ ...prev, [key]: e.target.checked }))}
                          />
                          <span className="capitalize">{key}</span>
                        </label>
                      ))}
                    </div>
                    <label className="text-sm flex items-center gap-2">
                      <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                      <span>Token aktif</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveEdit(row)} className="px-3 py-1.5 text-xs rounded bg-green-600 text-white">
                        Simpan Perubahan
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs rounded bg-gray-500 text-white">
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {rows.length === 0 && <div className="text-sm text-gray-500">Belum ada token.</div>}
        </div>
      )}

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Dokumentasi Akses Token</h3>
        <div className="text-xs text-gray-700 space-y-1">
          <div><strong>Header:</strong> <code>X-Integration-Token: &lt;token&gt;</code> atau <code>Authorization: Bearer &lt;token&gt;</code></div>
          <div><strong>Scope projects:</strong> akses <code>GET /api/external/projects</code></div>
          <div><strong>Scope finance:</strong> akses <code>GET /api/external/finance</code></div>
          <div><strong>Scope reports:</strong> akses <code>GET /api/external/reports</code></div>
          <div><strong>Scope team:</strong> akses <code>GET /api/external/team</code></div>
          <div><strong>Scope inventory:</strong> disiapkan untuk endpoint inventory external berikutnya</div>
          <div className="pt-1"><strong>Response format:</strong> <code>{`{ status, data }`}</code>, error <code>{`{ status, message }`}</code></div>
        </div>
      </div>

      {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
    </div>
  );
};

export default IntegrationTokenSettings;

