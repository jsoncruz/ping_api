import { logger } from '@adonisjs/ace'
import { IocContract } from '@adonisjs/fold'

import { EventsList, EmitterContract } from '@ioc:Adonis/Core/Event'

import ScannersController from 'App/Controllers/Http/ScannersController'

export default class AppProvider {
  public $namespace = 'Ping/Scanner/Instance'
  private $singleton: ScannersController
  private Event: EmitterContract<EventsList>
  constructor (protected $container: IocContract) {
  }

  public async register () {
    console.clear()
    logger.create('Singleton registrado')
    this.$container.singleton(this.$namespace, () => new ScannersController())
    this.Event = (await import('@ioc:Adonis/Core/Event')).default
  }

  public boot () {
    logger.start('O provedor da aplicação está carregando')
    this.$singleton = this.$container.use(this.$namespace)
  }

  public async ready () {
    this.Event.on('server:manager', async ({ action, dns, response }: EventsList['server:manager']) => {
      try {
        switch (action) {
          case 'start':
            if (dns) {
              this.$singleton.setup(dns)
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
          case 'air':
          case 'original':
            const incoming = this.$singleton.fetchAirData(action)
            if (incoming) {
              response.json({ ...JSON.parse(incoming) })
            } else {
              response.json({ message: 'O serviço não possui dados na memória até o momento' })
            }
            break
          default:
            response.json({ message: `Comando '${action}' não existe` })
        }
      } catch (exception) {
        return response.send(exception)
      }
    })
  }

  public shutdown () {
  }
}
