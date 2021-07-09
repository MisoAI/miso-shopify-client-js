const dotenv = require('dotenv')
const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')

dotenv.config()

const app = new Koa()
const router = new Router()

const store = {
  cart: {
    token: `the-cart-token-${Math.round(Math.random() * 1000)}`,
    items: []
  }
}

router
  .get('/products/:productId', (ctx, next) => {
    let id = ctx.params.productId

    if (id.endsWith('.js')) {
      id = id.slice(0, '.js'.length * -1)
    }
    const variant = `${id}-variant-0`
    ctx.body = {
      id,
      variants: [
        { id: variant, title: variant }
      ]
    }
  })
  .post('/cart/add', (ctx, next) => {
    const variantId = ctx.request.body.id || 'missing-variant-id'
    const quantity = ctx.request.body.quantity || 1
    const payload = {
      variant_id: variantId,
      quantity
    }

    // don't merge same variantId to simulate Shopify product line
    store.cart.items.push({ ...payload })

    payload.quantity = store.cart.items.reduce((sum, item) => {
      if (item.variant_id === variantId) {
        return sum + Number.parseInt(item.quantity) || 0
      }
      return sum
    }, 0)

    ctx.body = payload
  })
  .get('/cart.js', (ctx, next) => {
    ctx.body = store.cart
  })

app
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3001)
