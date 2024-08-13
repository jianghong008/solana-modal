import { createSignal } from 'solid-js'
import './App.css'
import { SolanaModal } from './solana-modal'
const modal = new SolanaModal()
function App() {
  const [address, setAddress] = createSignal('')
  
  const connect = async () => {

    const address = await modal.openModal()
    if(address){
      setAddress(address)
    }else{
      setAddress('connect error')
    }
    
  }

  const disconnect = async () => {
    modal.disconnect()
  }

  return (
    <>
      <h1>solana modal</h1>
      <div class="card">
        <p class="mb-4">
          wallet: {address()}
        </p>
        <button onClick={() => connect()}>connect</button>
        <button onClick={() => disconnect()}>disconnect</button>
      </div>
      
    </>
  )
}

export default App
