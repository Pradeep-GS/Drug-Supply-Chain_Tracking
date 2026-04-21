import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../utils/constants';
import contractABI from '../utils/contractABI.json';

const BlockchainContext = createContext();

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState(null); // null means still loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const drugContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      
      const [userRole, adminAddress] = await Promise.all([
        drugContract.roles(accounts[0]),
        drugContract.admin()
      ]);

      setAccount(accounts[0]);
      setContract(drugContract);
      setRole(Number(userRole));
      setIsAdmin(accounts[0].toLowerCase() === adminAddress.toLowerCase());
      
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        } else {
          setLoading(false);
          setHasChecked(true);
        }
      } else {
        setLoading(false);
        setHasChecked(true);
      }
    };
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  const value = { account, contract, role, isAdmin, loading, hasChecked, error, connectWallet };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};
