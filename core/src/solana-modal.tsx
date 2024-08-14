import { StandardWalletAdapter } from '@solana/wallet-standard-wallet-adapter-base'
import { getWallets, Wallets } from '@wallet-standard/core'
import { render } from 'solid-js/web'
import { WalletModal } from './WalletModal'
import { createSignal, Setter } from 'solid-js'
import { PublicKey, Transaction, Connection, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { base58 } from '@scure/base';
import {
    isWalletAdapterCompatibleStandardWallet,
    WalletAdapter,
    SignerWalletAdapter,
    MessageSignerWalletAdapter
} from '@solana/wallet-adapter-base'

export type ModalEventTypeMap = {
    CONNECT: PublicKey
    DISCONNECT: undefined
}

type EventKeys = keyof ModalEventTypeMap;

type EventMap = {
    [key in EventKeys]?: ((arg: ModalEventTypeMap[key]) => void)[]
}
/**
 * modal options
 */
export interface SolanaModalOptions {
    rpc: string
    /**
     * rpc http headers
     */
    httpHeaders?: Record<string, string>
    autoConnect?: boolean
}
export class SolanaModal {
    private static _instance?: SolanaModal
    private options?: SolanaModalOptions
    private wallets: Wallets
    public walletsOptions: Map<string, WalletAdapter> = new Map()
    private activeWallet: string = ''
    private root?: HTMLDivElement
    private rootId = 'web3-solana-modal-root'
    private setModalShow?: Setter<boolean>
    private setModalLoading?: Setter<boolean>
    private modalLoading = false
    private events: EventMap = {}
    private error: Error | undefined
    private connect_cache_key = 'solana_modal_connect_cache_key'
    public connection?: Connection
    /**
     * init solana modal
     * @param options modal options
     */
    constructor(options?: SolanaModalOptions) {

        this.wallets = getWallets()

        this.wallets.on('register', this.refleshWallets.bind(this))
        this.wallets.on('unregister', this.refleshWallets.bind(this))

        if (options) {
            this.options = options
            this.connection = new Connection(this.options.rpc, {
                httpHeaders: this.options.httpHeaders
            })
        }

        this.refleshWallets()
        this.initModal()
    }
    /**
     * init global solana modal
     * @param options 
     * @returns 
     */
    static init(options?: SolanaModalOptions) {
        if (!SolanaModal._instance) {
            SolanaModal._instance = new SolanaModal(options)
        }
        return SolanaModal._instance
    }
    /**
     * get global solana modal
     */
    static get instance() {
        if (!SolanaModal._instance) {
            throw new Error('solana modal not init')
        }
        return SolanaModal._instance
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
        render(() => <WalletModal loading={modalLoading} show={modalShow} closeModal={this.closeModal.bind(this)} options={this.walletsOptions} onSelect={this.onSelect.bind(this)} />, this.root)
    }


    private async refleshWallets() {
        this.wallets = getWallets()
        this.wallets.get().forEach((wallet: any) => {
            const isCompatible = isWalletAdapterCompatibleStandardWallet(wallet)
            if (isCompatible) {
                this.walletsOptions.set(wallet.name, new StandardWalletAdapter({ wallet: wallet }))
            }
        })

        const cache_key = localStorage.getItem(this.connect_cache_key)
        if (cache_key && this.walletsOptions.has(cache_key)) {
            this.activeWallet = cache_key
        }

        const wallet = this.walletsOptions.get(this.activeWallet)
        if (!wallet) {
            return
        }

        if (!wallet.publicKey && this.options?.autoConnect) {
            await wallet.connect()
            if (!wallet.publicKey) {
                throw new Error('wallet connect failed')
            }
            wallet.on('disconnect', () => {
                this.emit('DISCONNECT', undefined)
                wallet.off('disconnect')
            })
            this.emit('CONNECT', wallet.publicKey)
        }
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
    /**
     * connect
     * @param name wallet name
     * @returns 
     */
    public async connect(name: string) {
        this.error = undefined
        this.activeWallet = name
        const wallet = this.walletsOptions.get(name)
        if (wallet) {
            await wallet.disconnect()
            await this.waiteTimeout(700)
            await wallet.connect()
            await this.waiteTimeout(400)
        } else {
            throw new Error('wallet not found')
        }

        if (!wallet.publicKey) {
            throw new Error('wallet connect failed')
        }

        localStorage.setItem(this.connect_cache_key, name)

        wallet.on('disconnect', () => {
            this.emit('DISCONNECT', undefined)
            wallet.off('disconnect')
        })

        this.emit('CONNECT', wallet.publicKey)

        return wallet.publicKey.toBase58()
    }
    /**
     * disconnect
     */
    public async disconnect() {
        const wallet = this.walletsOptions.get(this.activeWallet)
        if (wallet) {
            await wallet.disconnect()
        } else {
            throw new Error('wallet not found')
        }
    }
    /**
     * if message is string,return string.if message is Uint8Array,return Uint8Array
     * @param message string | Uint8Array
     * @returns string | Uint8Array
     */
    public async signMessage<T>(message: string | Uint8Array): Promise<T> {
        const wallet = this.walletsOptions.get(this.activeWallet)
        if (!wallet) {
            throw new Error('wallet not found')
        }
        if (!wallet.connected) {
            throw new Error('wallet not connected')
        }
        const signer = wallet as MessageSignerWalletAdapter

        if (typeof message === 'string') {
            const encodedMessage = new TextEncoder().encode(message)
            const signature = await signer.signMessage(encodedMessage)
            return base58.encode(signature) as T
        } else {
            const signature = await signer.signMessage(message)
            return signature as T
        }
    }
    /**
     * sign transaction
     * @param transaction 
     * @returns Transaction
     */
    public async signTransaction(transaction: Transaction) {
        const wallet = this.walletsOptions.get(this.activeWallet)
        if (!wallet) {
            throw new Error('wallet not found')
        }
        if (!wallet.connected) {
            throw new Error('wallet not connected')
        }
        const signer = wallet as SignerWalletAdapter
        return await signer.signTransaction(transaction)
    }
    /**
     * sign and send transaction
     * @param transaction Transaction
     * @returns txid string
     */
    public async signAndSendTransaction(transaction: Transaction) {
        const wallet = this.walletsOptions.get(this.activeWallet)
        if (!wallet) {
            throw new Error('wallet not found')
        }
        if (!wallet.connected) {
            throw new Error('wallet not connected')
        }
        if (!this.connection) {
            throw new Error('need set rpc')
        }
        const signer = wallet as SignerWalletAdapter
        const tx = await signer.signTransaction(transaction)
        const txid = await signer.sendTransaction(tx, this.connection)
        return txid
    }
    /**
     * sign all transactions
     * @param transactions Transaction[]
     * @returns Transaction[]
     */
    public async signAllTransactions(transactions: Transaction[]) {
        const wallet = this.walletsOptions.get(this.activeWallet)
        if (!wallet) {
            throw new Error('wallet not found')
        }
        if (!wallet.connected) {
            throw new Error('wallet not connected')
        }
        const signer = wallet as SignerWalletAdapter
        return await signer.signAllTransactions(transactions)
    }

    private waiteTimeout(t = 1000) {
        return new Promise(resolve => setTimeout(resolve, t))
    }
    /**
     * open modal and return public key
     * @returns PublicKey | undefined
     */
    public async openModal() {
        this.modalLoading = true

        this.setModalShow?.call(this, true)
        while (this.modalLoading) {
            await this.waiteTimeout(300)
        }

        const wallet = this.walletsOptions.get(this.activeWallet)
        if (!wallet) {
            throw new Error('wallet not found')
        }
        this.closeModal()
        if (this.error) {
            throw this.error
        }

        return wallet.publicKey
    }
    /**
     * close modal
     * @param isErr is error
     */
    public closeModal(isErr = false) {
        this.modalLoading = false
        this.setModalShow?.call(this, false)
        this.setModalLoading?.call(this, false)
        if (isErr) {
            this.error = Error(' User rejected the request')
        }

    }
    /**
     * add event
     * @param event 
     * @param handler 
     */
    public on<T extends EventKeys>(event: T, handler: (arg: ModalEventTypeMap[T]) => void) {
        if (!this.events[event]) {
            this.events[event] = []
        }
        this.events[event].push(handler)
    }
    /**
     * remove event
     * @param event 
     * @param handler 
     * @returns 
     */
    public off<T extends EventKeys>(event: EventKeys, handler: (arg: ModalEventTypeMap[T]) => void) {
        if (!this.events[event]) {
            return
        }
        const handlers = this.events[event]
        if (!handlers) {
            return
        }
        const index = handlers.findIndex((h) => h.caller === handler)
        if (index !== -1) {
            handlers.splice(index, 1)
        }
    }

    private emit<T extends EventKeys>(event: T, arg: ModalEventTypeMap[T]) {
        if (!this.events[event]) {
            return
        }
        const handlers = this.events[event]
        if (!handlers) {
            return
        }
        handlers.forEach((h) => h(arg))
    }
    /**
     * send solana for wallet
     * @param to 
     * @param amount 
     * @returns solana txid
     */
    public async transferSolanaForWallet(to: string, amount: number) {
        if (!this.connection) {
            throw new Error('need set rpc')
        }
        const wallet = this.walletsOptions.get(this.activeWallet)
        if (!wallet) {
            throw new Error('wallet not found')
        }
        if (!wallet.publicKey) {
            throw new Error('wallet not connected')
        }
        const sendSolInstruction = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(to),
            lamports: amount * LAMPORTS_PER_SOL,
        });
        const transaction = new Transaction();
        transaction.add(sendSolInstruction)
        transaction.feePayer = wallet.publicKey
        transaction.recentBlockhash = (await this.connection.getLatestBlockhash('confirmed')).blockhash
        return await this.signAndSendTransaction(transaction)
    }
}