import { createSignal, onMount } from 'solid-js'
import './App.css'
import { SolanaModal } from './solana-modal'
const modal = SolanaModal.init({
  rpc: 'https://api.devtnet.solana.com',
  autoConnect: true,
})
function App() {
  const [address, setAddress] = createSignal('')
  const [msg, setMsg] = createSignal('')
  const connect = async () => {

    try {
      const address = await modal.openModal()
      if (address) {
        setAddress(address.toBase58())
      } else {
        setMsg('connect error')
      }
    } catch (error) {
      setMsg(String(error))
    }

  }

  const disconnect = async () => {
    modal.disconnect()
  }

  const signMessage = async () => {
    try {
      const result = await modal.signMessage<string>("hello world")
      setMsg(result)
    } catch (error) {
      setMsg(String(error))
    }
  }

  const sendTransaction = async () => {
    try {
      const tid = await modal.transferSolanaForWallet("Ea3kV4jREfYBk8CJAYKNvhjoqZ1UateGtyjEo1cPZLQE", 0.01)
      setMsg(tid)
    } catch (error) {
      setMsg(String(error))
    }
  }

  onMount(() => {
    modal.on('CONNECT', (pk) => {
      console.log('connect')
      setAddress(pk.toBase58())
    })
    modal.on('DISCONNECT', () => {
      console.log('disconnect')
      setAddress('')
    })


  })

  return (
    <>
      <h1>solana modal</h1>
      <div class="card">
        <p class="mb-4">
          wallet: {address()}
        </p>
        <div class="flex gap-4 flex-wrap justify-center">
          <button onClick={() => connect()}>connect</button>
          <button onClick={() => disconnect()}>disconnect</button>
          <button onClick={() => signMessage()}>signMessage</button>
          <button onClick={() => sendTransaction()}>sendTransaction</button>
        </div>
        <p class="msg mt-6 mx-auto bg-slate-900 rounded-xl border-gray-400 border-[1px] p-4 min-h-16 max-w-96 break-words">
          {msg()}
        </p>
      </div>

    </>
  )
}

export default App
