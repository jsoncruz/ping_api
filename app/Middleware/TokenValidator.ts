import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

export default class TokenValidator {
  public async handle ({ request, response }: HttpContextContract, next: () => Promise<void>) {
    const headers = request.headers()
    if ('token' in headers) {
      if (headers.token === Env.get('APP_KEY') as string) {
        await next()
      } else {
        response.json({ error: 'Token invalido' })
      }
    } else {
      response.json({ error: 'Não existe token no cabeçalho da requisição' })
    }
  }
}
