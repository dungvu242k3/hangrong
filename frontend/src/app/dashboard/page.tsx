"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "../../shared/lib/apiClient";
import Link from "next/link";

interface AdminPlayer {
  id: string;
  username: string;
  displayName: string;
  level: number;
  coins: number;
  gems: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  // Edit modal state
  const [editPlayer, setEditPlayer] = useState<AdminPlayer | null>(null);
  const [coinsInput, setCoinsInput] = useState<number>(0);
  const [gemsInput, setGemsInput] = useState<number>(0);
  const [levelInput, setLevelInput] = useState<number>(1);
  const [updating, setUpdating] = useState<boolean>(false);

  // Delete modal state
  const [deleteConfirmPlayer, setDeleteConfirmPlayer] = useState<AdminPlayer | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    const res = await apiClient<AdminPlayer[]>("/admin/players");
    if (res.success && res.data) {
      setPlayers(res.data);
    } else {
      setError(res.error?.message || "Không thể tải danh sách người chơi.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleOpenEdit = (player: AdminPlayer) => {
    setEditPlayer(player);
    setCoinsInput(player.coins);
    setGemsInput(player.gems);
    setLevelInput(player.level);
  };

  const handleSaveEdit = async () => {
    if (!editPlayer) return;
    setUpdating(true);
    const res = await apiClient(`/admin/players/${editPlayer.id}`, {
      method: "PUT",
      body: JSON.stringify({
        coins: coinsInput,
        gems: gemsInput,
        level: levelInput,
      }),
    });
    if (res.success) {
      // Update local state
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === editPlayer.id
            ? { ...p, coins: coinsInput, gems: gemsInput, level: levelInput }
            : p
        )
      );
      setEditPlayer(null);
    } else {
      alert(res.error?.message || "Lỗi khi cập nhật thông tin.");
    }
    setUpdating(false);
  };

  const handleDeletePlayer = async () => {
    if (!deleteConfirmPlayer) return;
    setDeleting(true);
    const res = await apiClient(`/admin/players/${deleteConfirmPlayer.id}`, {
      method: "DELETE",
    });
    if (res.success) {
      setPlayers((prev) => prev.filter((p) => p.id !== deleteConfirmPlayer.id));
      setDeleteConfirmPlayer(null);
    } else {
      alert(res.error?.message || "Lỗi khi xóa tài khoản.");
    }
    setDeleting(false);
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalPlayers = players.length;
  const totalCoins = players.reduce((sum, p) => sum + p.coins, 0);
  const totalGems = players.reduce((sum, p) => sum + p.gems, 0);
  const averageLevel =
    players.length > 0
      ? (players.reduce((sum, p) => sum + p.level, 0) / players.length).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 p-6 md:p-12 font-sans selection:bg-cyan-500 selection:text-slate-900" style={{ backgroundColor: "#090d16" }}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Quản Trị Hàng Rong
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Trang quản lý tài khoản người chơi (Cấp độ, Xu, Ngọc và Xóa tài khoản)
            </p>
          </div>
          <Link href="/stall" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition border border-slate-700 flex items-center gap-2 self-start md:self-auto">
            <span>← Quay lại Game</span>
          </Link>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tổng người chơi</p>
            <p className="text-2xl font-bold text-cyan-400 mt-2">{loading ? "..." : totalPlayers}</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tổng xu lưu hành</p>
            <p className="text-2xl font-bold text-amber-500 mt-2">{loading ? "..." : totalCoins.toLocaleString()} 💰</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tổng ngọc lưu hành</p>
            <p className="text-2xl font-bold text-emerald-400 mt-2">{loading ? "..." : totalGems.toLocaleString()} 💎</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cấp độ trung bình</p>
            <p className="text-2xl font-bold text-indigo-400 mt-2">Lv {loading ? "..." : averageLevel}</p>
          </div>
        </div>

        {/* Search & Actions block */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
          </div>
          <button
            onClick={fetchPlayers}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition border border-slate-700"
          >
            Làm mới danh sách
          </button>
        </div>

        {/* Players List Table */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <span className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mr-3 align-middle"></span>
              Đang tải danh sách người chơi...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400 text-sm">
              Lỗi: {error}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Không tìm thấy tài khoản người chơi nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Tài khoản</th>
                    <th className="px-6 py-4">Tên hiển thị</th>
                    <th className="px-6 py-4">Cấp độ</th>
                    <th className="px-6 py-4 text-amber-500">Xu</th>
                    <th className="px-6 py-4 text-emerald-400">Ngọc</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-900/30 transition">
                      <td className="px-6 py-4 font-mono text-cyan-300 font-semibold">{player.username}</td>
                      <td className="px-6 py-4 text-slate-300">{player.displayName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-semibold rounded-full">
                          Lv {player.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-amber-500">{player.coins.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-400">{player.gems.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(player.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(player)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition border border-slate-700"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirmPlayer(player)}
                          className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded transition border border-red-900/50"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Stats Modal */}
      {editPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Chỉnh sửa tài khoản: <span className="text-cyan-400 font-mono">{editPlayer.username}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Thay đổi cấp độ, xu và ngọc của người chơi này</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Cấp độ (Level)</label>
                <input
                  type="number"
                  min="1"
                  value={levelInput}
                  onChange={(e) => setLevelInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Số lượng Xu</label>
                <input
                  type="number"
                  min="0"
                  value={coinsInput}
                  onChange={(e) => setCoinsInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Số lượng Ngọc</label>
                <input
                  type="number"
                  min="0"
                  value={gemsInput}
                  onChange={(e) => setGemsInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setEditPlayer(null)}
                disabled={updating}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition border border-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updating}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-900 text-sm font-bold rounded-lg transition disabled:opacity-50"
              >
                {updating ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-900/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-red-400">Xóa tài khoản này?</h3>
              <p className="text-sm text-slate-300 mt-2">
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <span className="text-cyan-400 font-mono font-bold">{deleteConfirmPlayer.username}</span>?
              </p>
              <p className="text-xs text-red-400/80 font-medium bg-red-950/40 border border-red-900/40 p-3 rounded-lg mt-3">
                ⚠️ Hành động này sẽ xóa sạch toàn bộ sạp hàng, ví tiền, kho đồ và dữ liệu lịch sử liên quan. Không thể hoàn tác!
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmPlayer(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition border border-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeletePlayer}
                disabled={deleting}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-slate-100 text-sm font-bold rounded-lg transition disabled:opacity-50"
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
