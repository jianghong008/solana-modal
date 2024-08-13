import { Adapter } from "@solana/wallet-adapter-base";
import './assets/modal.css'
import { Accessor, createEffect, createSignal } from "solid-js";
import loadingSvg from './assets/loading.svg'
type ModalOptions = {
    loading: Accessor<boolean>
    show: Accessor<boolean>
    options: Map<string, Adapter>
    closeModal: () => void
    onSelect: (name: string) => void
}
export function Modal(opt: ModalOptions) {
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
            closeModal()
        }
    }

    return <div ref={modal} class=" fixed left-0 top-0 w-screen h-screen z-[9999] bg-[rgba(85,85,85,0.2)] backdrop-blur flex justify-center items-center" style={show() ? 'display:flex' : 'display:none'} onclick={(e) => close(e.target as any)}>
        <div class=" px-6 pb-8 pt-4 border-2 border-[rgba(136,136,136,0.2)] rounded-xl bg-[#10141f] max-w-96">
            <p class=" mb-3 flex justify-end">
                <button class="p-2 focus:outline-0 border-none hover:outline-0 hover:border-none fill-slate-600 hover:fill-slate-300" onclick={() => closeModal()}>
                    <svg class="w-5 h-5 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14">
                        <path
                            d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z">
                        </path>
                    </svg>
                </button>
            </p>
            <h3 class=" text-2xl mb-5">
                Select your Solana wallet {show()}
            </h3>
            <ul class="flex flex-col gap-2 max-h-96 overflow-y-auto" style={loading() ? 'display:none' : 'display:block'}>
                {
                    wallets().map((wallet: Adapter) => <li>
                        <button class="w-full flex justify-between items-center focus:outline-0" onclick={() => onSelect(wallet.name)}>
                            <i class="flex items-center gap-2">
                                <img class=" w-7 h-7" src={wallet.icon} alt={wallet.name} />
                                <span>{wallet.name}</span>
                            </i>
                            <span class=" text-xs text-[#009688]">
                                Detected
                            </span>
                        </button>
                    </li>)
                }
            </ul>
            <p class=" justify-center py-4" style={loading() ? 'display:flex' : 'display:none'}>
                <img class=" w-12 h-12" src={loadingSvg} alt="loading" />
            </p>
        </div>
    </div>
}