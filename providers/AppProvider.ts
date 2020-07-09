import { logger } from '@adonisjs/ace'
import { IocContract } from '@adonisjs/fold'

import { EventsList } from '@ioc:Adonis/Core/Event'

import ScannersController from 'App/Controllers/Http/ScannersController'

export default class AppProvider {
  public $namespace = 'Ping/Scanner/Instance'
  constructor (protected $container: IocContract) {
  }

  public register () {
    console.clear()
    logger.create('Webservices criados')
    this.$container.singleton(this.$namespace, () => new ScannersController({
      request: 'http://177.21.14.214:880/webrunstudio/wsConsEquMonExt.rule?sys=SDK',
      ticket: 'http://177.21.14.214:880/webrunstudio/wsMonExt.rule?sys=SDK',
    })
    )
  }

  public boot () {
    logger.start('O provedor do aplicativo está sendo inicializado')
  }

  public async ready () {
    logger.complete('Estamos prontos')
    const singleton = this.$container.use(this.$namespace)
    const { default: event } = await import('@ioc:Adonis/Core/Event')

    let serverStatus = 0
    event.on('server:manager', async ({ action }: EventsList['server:manager']) => {
      try {
        switch (action) {
          case 'start':
            if (serverStatus !== 1) {
              await singleton.boot()
              await singleton.ignitor()
              serverStatus = 1
            } else {
              logger.warn('O serviço já está em andamento')
            }
            break
          case 'stop':
            if (serverStatus !== 0) {
              await singleton.stop()
              serverStatus = 0
            } else {
              logger.warn('O serviço já está desligado')
            }
            break
          case 'restart':
            await singleton.reboot()
            serverStatus = 2
            break
        }
      } catch (exception) {
        logger.fatal(exception)
      }
    })
  }

  public shutdown () {
  }
}
