import { isWalletAdapterCompatibleStandardWallet, WalletAdapter } from '@solana/wallet-adapter-base'
import { StandardWalletAdapter } from '@solana/wallet-standard-wallet-adapter-base'
import { getWallets, Wallets } from '@wallet-standard/core'
import { render } from 'solid-js/web'
import { Modal } from './Modal'
import { createSignal, Setter } from 'solid-js'
import { PublicKey } from '@solana/web3.js'

export enum ModalEventType {
    CONNECT,
    DISCONNECT,
}

export type ModalEventHndler = {
    callBack: (pk?: PublicKey) => void
    caller?: any
}

export class SolanaModal {
    private wallets: Wallets
    public options: Map<string, WalletAdapter> = new Map()
    private activeWallet?: string = 'Phantom'
    private root?: HTMLDivElement
    private rootId = 'web3-solana-modal-root'
    private setModalShow?: Setter<boolean>
    private setModalLoading?: Setter<boolean>
    private modalLoading = false
    private events: Map<ModalEventType, ModalEventHndler[]> = new Map()
    private error: Error | undefined
    constructor() {
        this.wallets = getWallets()
        this.refleshWallets()
        this.wallets.on('register', this.refleshWallets.bind(this))
        this.wallets.on('unregister', this.refleshWallets.bind(this))

        this.initModal()
    }
    private async onSelect(name: string) {
        this.activeWallet = name
        this.setModalLoading?.call(this, true)
        try {
            await this.connect(name)
            this.modalLoading = false
            this.setModalLoading?.call(this, false)
        } catch (error) {
            this.setModalLoading?.call(this, false)
            this.error = Error(String(error))
            this.modalLoading = false
        }
    }
    private initModal() {
        const el = document.getElementById(this.rootId)
        if (el) {
            this.root = el as HTMLDivElement

        } else {
            this.root = document.createElement('div')
            this.root.id = this.rootId
            document.body.appendChild(this.root)
        }
        const [modalShow, setModalShow] = createSignal(false)
        this.setModalShow = setModalShow
        const [modalLoading, setModalLoading] = createSignal(false)
        this.setModalLoading = setModalLoading
        render(() => <Modal loading={modalLoading} show={modalShow} closeModal={this.closeModal.bind(this)} options={this.options} onSelect={this.onSelect.bind(this)} />, this.root)
    }

    private refleshWallets() {
        this.wallets = getWallets()
        this.wallets.get().forEach((wallet: any) => {
            const isCompatible = isWalletAdapterCompatibleStandardWallet(wallet)
            if (isCompatible) {
                this.options.set(wallet.name, new StandardWalletAdapter({ wallet: wallet }))
            }
        })
        this.options.get('phantom')?.on('connect', (address) => {
            console.log(address.toBase58())
        })

    }

    public async connect(name: string) {
        this.error = undefined
        this.activeWallet = name
        const wallet = this.options.get(name)
        if (wallet) {
            await wallet.disconnect()
            await this.waiteTimeout(700)
            await wallet.connect()
        } else {
            throw new Error('wallet not found')
        }
        wallet.on('disconnect', () => {
            this.emit(ModalEventType.DISCONNECT)
            wallet.off('disconnect')
        })

        return wallet.publicKey?.toBase58()
    }

    public async disconnect() {
        if (!this.activeWallet) {
            throw new Error('active wallet not found')
        }
        const wallet = this.options.get(this.activeWallet)
        if (wallet) {
            await wallet.disconnect()
        } else {
            throw new Error('wallet not found')
        }
        console.log('disconnect')
    }

    private waiteTimeout(t = 1000) {
        return new Promise(resolve => setTimeout(resolve, t))
    }

    public async openModal() {
        this.modalLoading = true

        this.setModalShow?.call(this, true)
        while (this.modalLoading) {
            await this.waiteTimeout(300)
        }
        if (!this.activeWallet) {
            throw new Error('active wallet not found')
        }
        const wallet = this.options.get(this.activeWallet)
        if (!wallet) {
            throw new Error('wallet not found')
        }
        this.closeModal()
        if(this.error) {
            throw this.error
        }
        return wallet.publicKey?.toBase58()
    }

    private closeModal() {
        this.modalLoading = false
        this.setModalShow?.call(this, false)
        this.setModalLoading?.call(this, false)
        this.error = Error(' User rejected the request')
    }

    public on(event: ModalEventType, handler: (pk?: PublicKey) => void) {
        if (!this.events.has(event)) {
            this.events.set(event, [])
        }
        this.events.get(event)?.push({ callBack: handler })
    }

    public off(event: ModalEventType, handler: (pk?: PublicKey) => void) {
        if (!this.events.has(event)) {
            return
        }
        const handlers = this.events.get(event)
        if (!handlers) {
            return
        }
        const index = handlers.findIndex((h) => h.caller === handler)
        if (index !== -1) {
            handlers.splice(index, 1)
        }
    }

    private emit(event: ModalEventType, pk?: PublicKey) {
        if (!this.events.has(event)) {
            return
        }
        const handlers = this.events.get(event)
        if (!handlers) {
            return
        }
        handlers.forEach((h) => {
            h.callBack(pk)
        })
    }
}