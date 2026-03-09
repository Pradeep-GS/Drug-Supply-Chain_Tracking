import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { ROLES } from '../utils/constants';

const AdminDashboard = () => {
  const { contract, account } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState({ address: '', role: 1 });
  const [users, setUsers] = useState([]);
  const [adminAddress, setAdminAddress] = useState('');

  const roles = [
    { value: 1, label: 'Manufacturer' },
    { value: 2, label: 'Distributor' },
    { value: 3, label: 'Pharmacy' }
  ];

  useEffect(() => {
    if (contract && account) {
      checkAdmin();
      fetchAllUsers();
    }
  }, [contract, account]);

  const checkAdmin = async () => {
    try {
      const admin = await contract.admin();
      setAdminAddress(admin);
    } catch (error) {
      console.error('Error checking admin:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would need to maintain a list of all users
      // For now, we'll just show users that have been assigned roles
      // This would typically come from events or a separate tracking mechanism
      
      // Since we can't fetch all users from the contract directly,
      // we'll just show a message or keep it empty until roles are assigned
      setUsers([]);
      
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (!roleData.address) {
        alert('Please enter an address');
        return;
      }
      
      console.log('Assigning role to:', roleData.address, 'role:', roleData.role);
      
      const tx = await contract.assignRole(roleData.address, roleData.role);
      await tx.wait();
      
      alert(`✅ Role assigned successfully!`);
      setRoleData({ address: '', role: 1 });
      
      // After assigning, add this user to the list
      setUsers([...users, {
        address: roleData.address,
        role: roleData.role,
        joined: new Date().toLocaleDateString()
      }]);
      
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('❌ Error assigning role: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is admin
  if (account && adminAddress && account.toLowerCase() !== adminAddress.toLowerCase()) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only the admin can access this page</p>
        <p className="text-sm text-gray-500 mt-4">Admin address: {adminAddress}</p>
        <p className="text-sm text-gray-500">Your address: {account}</p>
      </div>
    );
  }

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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">🏭</div>
          <div className="text-2xl font-bold">
            {users.filter(u => u.role === 1).length}
          </div>
          <div className="text-gray-600">Manufacturers</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">🚚</div>
          <div className="text-2xl font-bold">
            {users.filter(u => u.role === 2).length}
          </div>
          <div className="text-gray-600">Distributors</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">💊</div>
          <div className="text-2xl font-bold">
            {users.filter(u => u.role === 3).length}
          </div>
          <div className="text-gray-600">Pharmacies</div>
        </div>
      </div>

      {/* Assign Role Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Role to User</h2>
        <form onSubmit={handleAssignRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Address
            </label>
            <input
              type="text"
              value={roleData.address}
              onChange={(e) => setRoleData({ ...roleData, address: e.target.value })}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={roleData.role}
              onChange={(e) => setRoleData({ ...roleData, role: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Assigning...' : 'Assign Role'}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Registered Users</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {users.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No users have been assigned roles yet.</p>
              <p className="text-sm mt-2">Use the form above to assign roles.</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono text-sm">{user.address}</p>
                    <p className="text-xs text-gray-500">Joined: {user.joined}</p>
                  </div>
                  <div>
                    <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {ROLES[user.role]}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;