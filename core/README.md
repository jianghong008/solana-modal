## solana modal
A modal connection tool based on the official Solana package, simple and easy to use.

🫠😬***Sorry, v0.0.5 is incorrect and cannot be used. It was a mistake I uploaded.***

*Please use version **v0.0.6** or higher!*

### preview

dark

![dark](https://jianghong008.github.io/solana-modal/screen-dark.png)

light

![dark](https://jianghong008.github.io/solana-modal/screen-light.png)

[demo](https://jianghong008.github.io/solana-modal/)

### Usage

```bash
$ npm install solana-modal
```
```typescript
import { SolanaModal } from 'solana-modal'
const modal = SolanaModal.init({
  rpc: 'https://api.devtnet.solana.com',
  autoConnect: true,
})

// connect
const address = await modal.openModal()
// event
modal.on('DISCONNECT', () => {
    console.log('disconnect')
})
```
Very simple, And the theme automatically follows the system.