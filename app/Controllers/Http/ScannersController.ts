import { logger } from '@adonisjs/ace'

import http2 from 'http2'
import isIp from 'is-ip'
import isReachable from 'is-reachable'
import ping from 'ping'

import ApisController from 'App/Controllers/Http/ApisController'

export interface RequestProps {
  Id: number;
  IpExt: string;
  PortaExt: number;
  IpInt: string;
  PortaInt: number;
  Tipo: number;
  Ativo: string;
  Localizacao: string;
  Intervalo: number;
  Qtd: number
}

export interface ReusableProps {
  id: number;
  ip: string;
  port: number;
  alive: boolean;
  maximum: number;
  duration: number;
  latency: string | unknown;
  enabled: boolean;
}

interface InMemoryCached {
  id: number;
  current: number;
  maximum: number;
}

interface ServicesProps {
  request: string;
  ticket: string;
}

export default class ScannersController {
  public intervals: Array<NodeJS.Timeout> = []
  protected servers: Array<RequestProps>
  private onAir: Array<InMemoryCached>
  private REST: ApisController
  private teste = 0

  constructor (protected webservice: ServicesProps) {
    // console.clear()
    this.REST = new ApisController()
  }

  public async boot (onStart = true): Promise<void> {
    if (onStart) {
      logger.start('Iniciando Ping API')
    }
    await this.REST.fetch(this.webservice.request)
      .then((data) => {
        try {
          if (!Array.isArray(data)) {
            throw new Error('Lista de servidores está vazia')
          }
          logger.success('API inicializada em modo de segundo plano')
          this.servers = data.filter(({ Ativo }) => Ativo === 'S')
        } catch (exception) {
          logger.fatal(exception)
        }
      })
      .catch((exception) => logger.error(exception))
  }

  public async ignitor (): Promise<void> {
    try {
      logger.start(`Inspecionando ${this.servers.length} servidor(es)`)
      const response: Array<ReusableProps> = []
      for (const {
        Id: id,
        IpExt: host,
        PortaExt: port = 80,
        Intervalo: duration,
        Qtd: maximum,
        ...rest
      } of this.servers) {
        const inspectorResponse = await this.inspector(host, port)
        response.push({ ...inspectorResponse, id, maximum, duration, enabled: rest.Ativo === 'S' })
      }
      this.onAir = response.map(({ id, maximum }) => ({ id, current: 0, maximum }))
      logger.create('Dados do(s) servidor(es) estão na memória')
      this.persistent(response)
    } catch (exception) {
      logger.fatal(exception)
    }
  }

  public async reboot () {
    logger.update('Reiniciando Ping API')
    await this.stop(false)
    await this.boot(false)
    await this.ignitor()
  }

  public async stop (onStart = true) {
    if (onStart) {
      logger.stop('Parando Ping API')
    }
    this.intervals.forEach((interval) => clearInterval(interval))
  }

  private async inspector (host: string, port: number): Promise<ReusableProps> {
    try {
      if (isIp(host)) {
        host.replace(/[http|https||:|\/]*/, '')
      } else if (/:\/\//.test(host) === false) {
      }
      // const client = http2.connect(`http://${host}`)
      // const alive = client.socket.connect({ host, port })
      const { avg: latency, host: ip } = await ping.promise.probe(host, { timeout: 2 })
      const factoryInspected: ReusableProps = { ip, port, latency } as ReusableProps
      factoryInspected.alive = await isReachable(`${host}:${port}`, { timeout: 3000 })
      factoryInspected.alive = true
      return factoryInspected
    } catch (exception) {
      throw new Error(exception)
    }
  }

  private persistent (server: Array<ReusableProps>): void {
    logger.watch('Teste persistente de serviços')
    server.forEach(({ id, ip, port, duration }) => {
      const interval = setInterval(async () => {
        const inspected = await this.inspector(ip, port)
        const onMemo = this.onAir.find(({ id: key }) => key === id) as InMemoryCached
        try {
          await this.assistant(id, inspected, onMemo, interval)
        } catch (exception) {
          logger.error(exception)
        }
      }, duration)
      this.intervals.push(interval)
    })
    logger.info('Ping API está em andamento!')
  }

  private async assistant (id: number, { alive }: ReusableProps, onAir: InMemoryCached, interval: NodeJS.Timeout) {
    await new Promise((resolve, reject) => {
      try {
        console.log(this.teste++)
        const client = http2.connect('https://www.google.com/')
        client.on('connect', async () => {
          if (alive) {
            if (onAir.current > 0) {
              onAir.current = 0
              logger.info(`Serviço #${id} ficou online`)
            }
          } else {
            if (onAir.current >= onAir.maximum) {
              await this.REST.support(this.webservice.ticket, id)
              logger.success(`Foi aberto um chamado para o serviço #${id}`)
              this.servers.splice(this.servers.findIndex(({ Id }) => Id === id), 1)
              this.onAir.splice(this.onAir.findIndex(({ id: Id }) => Id === id), 1)
              this.intervals.splice(this.intervals.findIndex((current) => current === interval))
              clearInterval(interval)
            } else {
              onAir.current++
              logger.error(`Serviço #${id} está offline`)
            }
          }
          resolve(id)
        })
        client.on('error', () => {
          const msg = 'Ping API não está conectada à internet'
          client.destroy()
          reject(msg)
        })
      } catch (exception) {
        reject(exception)
      }
    })
  }
}
