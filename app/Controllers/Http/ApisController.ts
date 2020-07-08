import { logger } from '@adonisjs/ace'

import axios from 'axios'
import CliTable3 from 'cli-table3'

import { RequestProps } from './ScannersController'

export default class ApisController {
  public fetch (webservice: string): Promise<RequestProps[]> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.pending('Obtendo dados de servidor')
        const { data: servers }: { data: Array<RequestProps> } = await axios.post(webservice, {}, {
          headers: {
            'content-type': 'application/json',
            'token': process.env.EXTERNAL_API,
          },
        })
        logger.complete('Dados recebidos da API REST')
        const table = new CliTable3({ head: ['Id', 'Host', 'Intervalo', 'Quantidade', 'Ativo'] })
        table.push(...servers.map(({ Id, IpExt, PortaExt, Intervalo, Qtd, Ativo }) => {
          return [Id, `${IpExt}:${PortaExt}`, `${Intervalo / 1000}s`, Qtd, Ativo === 'S' ? 'Sim' : 'Não']
        }))
        console.log(table.toString())
        resolve(servers)
      } catch (exception) {
        reject(exception)
      }
    })
  }
  public async support (webservice: string, servico: number) {
    await axios.post(webservice, JSON.stringify({ servico }), {
      headers: {
        'content-type': 'application/json',
        'token': process.env.EXTERNAL_API,
      },
    })
  }
}
