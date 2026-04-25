import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useBlockchain } from '../context/BlockchainContext';
import { ROLES } from '../utils/constants';

const AdminDashboard = () => {
  const { contract, account } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState({ address: '', role: 1 });
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, manufacturers: 0, distributors: 0, pharmacies: 0 });

  useEffect(() => {
    if (contract && account) {
      fetchRegisteredUsers();
    }
  }, [contract, account]);

  useEffect(() => {
    const s = {
      total: users.length,
      manufacturers: users.filter(u => u.role === 1).length,
      distributors: users.filter(u => u.role === 2).length,
      pharmacies: users.filter(u => u.role === 3).length
    };
    setStats(s);
  }, [users]);

  const fetchRegisteredUsers = async () => {
    try {
      setLoading(true);
      const filter = contract.filters.RoleAssigned();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const uniqueUsers = {};
      
      const adminAddr = await contract.admin();
      const adminRole = await contract.roles(adminAddr);
      uniqueUsers[adminAddr.toLowerCase()] = {
        address: adminAddr,
        role: Number(adminRole),
        joined: 'Genesis'
      };

      events.forEach(event => {
        const addr = event.args[0].toLowerCase();
        uniqueUsers[addr] = {
          address: event.args[0],
          role: Number(event.args[1]),
          joined: `Block #${event.blockNumber}`
        };
      });

      setUsers(Object.values(uniqueUsers));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    const targetAddress = roleData.address.trim();
    
    console.log("Attempting to assign role to:", targetAddress);

    try {
      setLoading(true);
      const tx = await contract.assignRole(targetAddress, roleData.role);
      await tx.wait();
      alert(`✅ Role assigned successfully!`);
      setRoleData({ address: '', role: 1 });
      fetchRegisteredUsers();
    } catch (error) {
      console.error('Contract Error:', error);
      alert('❌ Blockchain Error: ' + (error.reason || error.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Admin Terminal</h1>
          <p className="text-gray-500 mt-1">Manage network participants and supply chain roles.</p>
        </div>
        <div className="bg-primary-50 px-4 py-2 rounded-2xl border border-primary-100 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-primary-900 font-mono">
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats.total, icon: '👥', color: 'from-blue-500 to-indigo-600' },
          { label: 'Manufacturers', value: stats.manufacturers, icon: '🏭', color: 'from-emerald-500 to-teal-600' },
          { label: 'Distributors', value: stats.distributors, icon: '🚚', color: 'from-amber-500 to-orange-600' },
          { label: 'Pharmacies', value: stats.pharmacies, icon: '💊', color: 'from-rose-500 to-pink-600' },
        ].map((stat, i) => (
          <div key={i} className="relative group overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform`}></div>
            <div className="text-3xl mb-4">{stat.icon}</div>
            <div className="text-3xl font-black text-gray-900">{stat.value}</div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Modern Form Panel */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Authorize Participant</h2>
            <form onSubmit={handleAssignRole} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Wallet Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={roleData.address}
                    onChange={(e) => setRoleData({ ...roleData, address: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Network Role</label>
                <select
                  value={roleData.role}
                  onChange={(e) => setRoleData({ ...roleData, role: parseInt(e.target.value) })}
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-semibold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value={1}>Manufacturer</option>
                  <option value={2}>Distributor</option>
                  <option value={3}>Pharmacy</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transform hover:-translate-y-1 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Executing...
                  </span>
                ) : 'Grant Access'}
              </button>
            </form>
          </div>
        </div>

        {/* Modern List Panel */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Registry Ledger</h2>
              <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                LIVE UPDATES
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-medium">No records found.</div>
              ) : (
                users.map((user, index) => (
                  <div key={index} className="px-8 py-5 flex justify-between items-center hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                        {user.role === 1 ? '🏭' : user.role === 2 ? '🚚' : '💊'}
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-gray-800">{user.address.slice(0, 10)}...{user.address.slice(-8)}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{user.joined}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                      user.role === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      user.role === 2 ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {ROLES[user.role]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;