import { Adapter } from "@solana/wallet-adapter-base";
import { Accessor, createEffect, createSignal } from "solid-js";
import './assets/modal.css'
import loadingSvg from './assets/loading.svg'
type ModalOptions = {
    loading: Accessor<boolean>
    show: Accessor<boolean>
    options: Map<string, Adapter>
    closeModal: (isErr ?: boolean) => void
    onSelect: (name: string) => void
}
export function WalletModal(opt: ModalOptions) {
    const { loading,show, options, closeModal, onSelect } = opt

    let modal: any

    const [wallets,setWallets] = createSignal<Adapter[]>([])

    const update = ()=>{
        const ar:Adapter[] = []
        options.forEach((wallet: Adapter) => {
            ar.push(wallet)
        })
        setWallets(ar)
    }

    createEffect(() => {
        update()
    },[show])

    const close = (el: HTMLDivElement) => {
        if (el === modal) {
            closeModal(true)
        }
    }

    return <div ref={modal} class="web3-solana-modal modal-mask" style={show() ? 'display:flex' : 'display:none'} onclick={(e) => close(e.target as any)}>
        <div class="modal-container">
            <p class="close-btn">
                <button onclick={() => closeModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14">
                        <path
                            d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z">
                        </path>
                    </svg>
                </button>
            </p>
            <h3 class="title">
                Select your Solana wallet {show()}
            </h3>
            <ul class="list" style={loading() ? 'display:none' : 'display:block'}>
                {
                    wallets().map((wallet: Adapter) => <li class="my-2">
                        <button class="wallet-item" onclick={() => onSelect(wallet.name)}>
                            
                            {/* <span class=" text-xs text-[#009688]">
                                Detected
                            </span> */}
                            <span>{wallet.name}</span>
                            <i class="flex items-center gap-2">
                                <img class=" w-7 h-7" src={wallet.icon} alt={wallet.name} />
                                
                            </i>
                        </button>
                    </li>)
                }
            </ul>
            <p class="spinner" style={loading() ? 'display:flex' : 'display:none'}>
                <img src={loadingSvg} alt="loading" />
            </p>
        </div>
    </div>
}