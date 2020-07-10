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
    event.on('server:manager', async (props: EventsList['server:manager']) => {
      const { action, dns, response } = props
      try {
        switch (action) {
          case 'start':
            if (dns) {
              this.$singleton.setup({
                request: `${dns}/webrunstudio/wsConsEquMonExt.rule?sys=SDK`,
                ticket: `${dns}/webrunstudio/wsMonExt.rule?sys=SDK`,
              })
              const boot = await this.$singleton.boot()
              if (boot.commit === 1) {
                await this.$singleton.ignitor()
              }
              response.json({ ...boot })
            } else {
              response.json({ message: 'Parametro DNS está pendente no corpo da requisição enviada' })
            }
            break
          case 'stop':
            const stop = this.$singleton.stop()
            response.json({ ...stop })
            break
          case 'restart':
            const reboot = await this.$singleton.reboot()
            response.json({ ...reboot })
            break
          default:
            response.json({ message: `Comando '${action}' não existe` })
        }
      } catch (exception) {
        logger.fatal(exception)
      }
    })
  }

  public shutdown () {
  }
}
