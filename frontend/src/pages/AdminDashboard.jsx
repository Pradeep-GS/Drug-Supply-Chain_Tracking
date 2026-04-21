import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useBlockchain } from '../context/BlockchainContext';
import { ROLES } from '../utils/constants';

const AdminDashboard = () => {
  const { contract, account } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState({ address: '', role: 1 });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (contract && account) {
      fetchRegisteredUsers();
    }
  }, [contract, account]);

  const fetchRegisteredUsers = async () => {
    try {
      setLoading(true);
      const filter = contract.filters.RoleAssigned();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const uniqueUsers = {};
      
      // Manually add the admin in case no event was recorded
      const adminAddr = await contract.admin();
      const adminRole = await contract.roles(adminAddr);
      uniqueUsers[adminAddr.toLowerCase()] = {
        address: adminAddr,
        role: Number(adminRole),
        joined: 'Contract Creator'
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
    if (!ethers.isAddress(roleData.address)) {
      alert('Invalid Ethereum address');
      return;
    }
    try {
      setLoading(true);
      const tx = await contract.assignRole(roleData.address, roleData.role);
      await tx.wait();
      alert(`✅ Role assigned successfully!`);
      setRoleData({ address: '', role: 1 });
      fetchRegisteredUsers();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error assigning role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold">{users.length}</div>
          <div className="text-gray-600">Total Users</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold">{users.filter(u => u.role === 1).length}</div>
          <div className="text-sm text-gray-500">Manufacturers</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold">{users.filter(u => u.role === 2).length}</div>
          <div className="text-sm text-gray-500">Distributors</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold">{users.filter(u => u.role === 3).length}</div>
          <div className="text-sm text-gray-500">Pharmacies</div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Role to User</h2>
        <form onSubmit={handleAssignRole} className="space-y-4">
          <input
            type="text"
            value={roleData.address}
            onChange={(e) => setRoleData({ ...roleData, address: e.target.value })}
            placeholder="User Wallet Address (0x...)"
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <select
            value={roleData.role}
            onChange={(e) => setRoleData({ ...roleData, role: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value={1}>Manufacturer</option>
            <option value={2}>Distributor</option>
            <option value={3}>Pharmacy</option>
          </select>
          <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">
            {loading ? 'Processing...' : 'Assign Role'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Registered Users</h2>
        </div>
        <div className="divide-y">
          {users.map((user, index) => (
            <div key={index} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-mono text-sm">{user.address}</p>
                <p className="text-xs text-gray-400">{user.joined}</p>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {ROLES[user.role]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;