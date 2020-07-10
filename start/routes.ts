/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes/index.ts` as follows
|
| import './cart'
| import './customer'
|
*/

import Event from '@ioc:Adonis/Core/Event'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { message: 'API em execução' }
})

Route.group(() => {
  Route.post('/', async ({ request, response }: HttpContextContract) => {
    await Event.emit('server:manager', { ...request.only(['action', 'dns']), response })
  }).middleware('Authentication')
  Route.get('/:type', async ({ params: { type }, response }: HttpContextContract) => {
    await Event.emit('server:manager', { action: type, response })
  })
}).prefix('server')
