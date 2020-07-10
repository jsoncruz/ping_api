import { logger } from '@adonisjs/ace'
import { IocContract } from '@adonisjs/fold'

import { EventsList } from '@ioc:Adonis/Core/Event'

import ScannersController from 'App/Controllers/Http/ScannersController'

export default class AppProvider {
  public $namespace = 'Ping/Scanner/Instance'
  private $singleton: ScannersController
  constructor (protected $container: IocContract) {
  }

  public register () {
    console.clear()
    logger.create('Singleton registrado')
    this.$container.singleton(this.$namespace, () => new ScannersController())
  }

  public boot () {
    logger.start('O provedor da aplicação está carregando')
    this.$singleton = this.$container.use(this.$namespace)
  }

  public async ready () {
    const { default: event } = await import('@ioc:Adonis/Core/Event')
    event.on('server:manager', async ({ action, dns = 'http://177.21.14.214:880/' }: EventsList['server:manager']) => {
      try {
        switch (action) {
          case 'start':
            this.$singleton.setup({
              request: `${dns}/webrunstudio/wsConsEquMonExt.rule?sys=SDK`,
              ticket: `${dns}/webrunstudio/wsMonExt.rule?sys=SDK`,
            })
            await this.$singleton.boot()
            await this.$singleton.ignitor()
            break
          case 'stop':
            this.$singleton.stop()
            break
          case 'restart':
            await this.$singleton.reboot()
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
