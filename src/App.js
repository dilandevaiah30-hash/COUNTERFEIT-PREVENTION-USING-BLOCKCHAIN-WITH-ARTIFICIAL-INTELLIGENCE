import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

// Components
import Navigation from './components/Navigation'
import Home from './components/Home'
import VerifyProduct from './components/VerifyProduct'
import AddProduct from './components/AddProduct'
import GetContract from './components/GetContract'
import DeployContract from './components/DeployContract'

// ABIs
import CentralABI from './abis/Central_ABI.json'

// Config
import config from './config.json'

function App() {
  const [provider, setProvider] = useState(null)
  const [central, setCentral] = useState(null)
  const [account, setAccount] = useState(null)

  // Show a friendly MetaMask error message
  function showErrorMessage(error) {
    alert(
      `❌ An error occurred while connecting to MetaMask:\n${error.message}\n\nCheck if MetaMask is installed and unlocked.`
    )
  }

  // 👇 Connect Wallet only when user clicks
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask not detected. Please install it from metamask.io')
        return
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)

      // Request access to user accounts
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)

      // Use your direct contract address from config.json ✅
      const central = new ethers.Contract(
        config.centralContractAddress,
        CentralABI,
        signer
      )
      setCentral(central)

      console.log('✅ Connected to MetaMask:', address)
    } catch (error) {
      console.error(error)
      showErrorMessage(error)
    }
  }

  // 👇 Auto-check if wallet is already connected (no popup)
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          const signer = provider.getSigner()
          const address = await signer.getAddress()
          setAccount(address)
          setProvider(provider)

          // Load central contract using config.json address ✅
          const central = new ethers.Contract(
            config.centralContractAddress,
            CentralABI,
            signer
          )
          setCentral(central)

          console.log('🔄 Auto-connected to MetaMask:', address)
        }
      } catch (err) {
        console.error('Auto-connect failed:', err)
      }
    }

    checkConnection()
  }, [])

  // 👇 Refresh if user changes account or network
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload())
      window.ethereum.on('chainChanged', () => window.location.reload())
    }
  }, [])

  return (
    <Router>
      <Navigation
        account={account}
        provider={provider}
        central={central}
        setAccount={setAccount}
        connectWallet={connectWallet} // ✅ Passed to Navigation
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/createcontract"
          element={<DeployContract account={account} provider={provider} central={central} />}
        />
        <Route
          path="/getcontract"
          element={<GetContract account={account} provider={provider} central={central} />}
        />
        <Route
          path="/addproduct"
          element={<AddProduct account={account} provider={provider} central={central} />}
        />
        <Route
          path="/verify"
          element={<VerifyProduct account={account} provider={provider} central={central} />}
        />
      </Routes>
    </Router>
  )
}

export default App
