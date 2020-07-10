import { logger } from '@adonisjs/ace'

import http2 from 'http2'
import net from 'net'

import ApisController, { RequestProps } from 'App/Controllers/Http/ApisController'

interface ReusableProps {
  id: number;
  ip: string | undefined;
  port: number | undefined;
  alive: boolean | unknown;
  latency: string | unknown;
  maximum: number;
  duration: number;
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

interface ResponseMessage {
  message: string;
  commit: 0 | 1
}

export default class ScannersController {
  public status: 'start' | 'stop' = 'stop'
  public intervals: Array<NodeJS.Timeout> = []
  protected servers: Array<RequestProps>
  protected webservice: ServicesProps
  private onAir: Array<InMemoryCached>
  private restful: ApisController

  constructor () {
    this.restful = new ApisController()
  }

  public setup ({ request, ticket }: ServicesProps) {
    this.webservice = { request, ticket }
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
        Ativo: enabled,
      } of this.servers) {
        const tester = await this.inspector(host, port)
        response.push({ ...tester, id, maximum, duration, enabled: enabled === 'S' })
      }
      this.onAir = response.map(({ id, maximum }) => ({ id, current: 0, maximum }))
      logger.create('Dados do(s) servidor(es) estão na memória')
      this.persistent(response)
    } catch (exception) {
      logger.fatal(exception)
    }
  }

  private persistent (server: Array<ReusableProps>): void {
    logger.watch('Teste persistente de serviços')
    try {
      server.forEach(({ id, ip, port, duration }) => {
        const interval = setInterval(async () => {
          const inspected = await this.inspector(ip as string, port as number)
          const onMemo = this.onAir.find(({ id: key }) => key === id) as InMemoryCached
          await this.assistant(id, inspected, onMemo, interval)
        }, duration)
        this.intervals.push(interval)
      })
    } catch (exception) {
      logger.error(exception)
    }
    logger.info('Ping API está em andamento!')
  }

  private async inspector (host: string, port: number): Promise<ReusableProps> {
    return new Promise((resolve, reject) => {
      const timing = process.hrtime()
      const socket = new net.Socket().setTimeout(3000)
      const client = socket.connect({ host, port })
      const usable = {
        ip: undefined,
        alive: false,
        latency: 'unknown',
        port,
      } as ReusableProps
      socket.on('connect', () => {
        const diff = process.hrtime(timing)
        usable.ip = client.remoteAddress
        usable.latency = (diff[1] / 1000000).toFixed(2).concat('ms')
        usable.alive = true
        socket.end()
      })
      socket.on('error', ({ message: exception }) => reject(exception))
      socket.on('end', () => {
        resolve(usable)
        socket.destroy()
      })
    })
  }

  private async assistant (id: number, { alive }: ReusableProps, onAir: InMemoryCached, interval: NodeJS.Timeout): Promise<void> {
    await new Promise((resolve, reject) => {
      try {
        const client = http2.connect('https://www.google.com/')
        client.setTimeout(1000)
        client.on('connect', async () => {
          if (alive) {
            if (onAir.current > 0) {
              onAir.current = 0
              logger.info(`Serviço #${id} ficou online`)
            }
          } else {
            if (onAir.current >= onAir.maximum) {
              await this.restful.support(this.webservice.ticket, id)
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
          client.destroy()
          reject('Ping API não está conectada à internet')
        })
      } catch (exception) {
        reject(exception)
      }
    })
  }

  public async boot (onStart = true): Promise<ResponseMessage> {
    if (this.status === 'stop') {
      if (onStart) {
        logger.start('Iniciando Ping API')
      }
      try {
        const data = await this.restful.fetch(this.webservice.request)
        if (!Array.isArray(data)) {
          return { message: 'O webservice retornou uma lista vazia de servidores', commit: 0 }
        }
        logger.success('API inicializada em modo de segundo plano')
        this.servers = data.filter(({ Ativo }) => Ativo === 'S')
        this.status = 'start'
        return { message: 'O serviço foi inicializado', commit: 1 }
      } catch (exception) {
        logger.error(exception)
        return { message: exception, commit: 0 }
      }
    } else {
      return { message: 'O serviço está em funcionamento', commit: 0 }
    }
  }

  public stop (onStart = true): ResponseMessage {
    if (this.status === 'start') {
      if (onStart) {
        logger.stop('Ping API desligada')
      }
      this.intervals.forEach((interval) => clearInterval(interval))
      this.status = 'stop'
      return { message: 'O serviço foi paralisado', commit: 1 }
    } else {
      return { message: 'O serviço está paralisado', commit: 0 }
    }
  }

  public async reboot (): Promise<ResponseMessage> {
    if (this.status === 'start') {
      logger.update('Reiniciando Ping API')
      const { commit } = this.stop(false)
      if (commit === 1) {
        await this.boot(false)
        await this.ignitor()
        return { message: 'O serviço foi reinicializado', commit: 1 }
      } else {
        return { message: 'O serviço não pôde ser reiniciado', commit: 0 }
      }
    } else {
      return { message: 'O serviço não pode ser reiniciado, porque ainda não foi iniciado', commit: 0 }
    }
  }
}
