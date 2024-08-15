## solana modal

使用官方库简单制作的solana连接模态框，官方只有react版的，此库不限框架。

### preview

dark
![dark](./core/public/screen-dark.png)

light
![dark](./core/public/screen-light.png)

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