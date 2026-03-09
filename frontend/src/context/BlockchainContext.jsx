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
  const [role, setRole] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      setLoading(true);
      setError('');

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('Connected accounts:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // For ethers v6 - BrowserProvider instead of Web3Provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check network
      const network = await provider.getNetwork();
      console.log('Network:', network);
      
      // In ethers v6, chainId is a bigint
      const chainId = Number(network.chainId);
      console.log('Chain ID:', chainId);
      
      if (chainId !== 31337) {
        alert('Please switch to Hardhat Local network (Chain ID: 31337)');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7A69' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            alert('Please add Hardhat network manually');
          }
        }
        return;
      }

      // Create contract instance
      console.log('Creating contract with address:', CONTRACT_ADDRESS);
      const drugContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      
      setAccount(accounts[0]);
      setContract(drugContract);
      
      // Get user role
      try {
        const userRole = await drugContract.roles(accounts[0]);
        setRole(Number(userRole));
        console.log('Your role:', Number(userRole));
      } catch (roleError) {
        console.error('Error getting role:', roleError);
        setRole(0);
      }
      
      alert('✅ Wallet connected successfully!');
      
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Auto-connect if already have accounts
          connectWallet();
        }
      }
    };
    
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          window.location.reload();
        } else {
          setAccount('');
          setContract(null);
          setRole(0);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const value = {
    account,
    contract,
    role,
    loading,
    error,
    connectWallet
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};