import { logger } from '@adonisjs/ace'

import nodemailer, { Transporter } from 'nodemailer'

interface MailerProps {
  /**
   * Your email account
   */
  from: string;
  /**
   * Destiny email
   */
  to: string | Array<string>;
  /**
   * Subject -- email's title
   */
  subject: string;
  /**
   * Email's content
   */
  html: string;
}

export default class MailersController {
  private transporter: Transporter
  private service = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { ciphers:'SSLv3' },
  }

  constructor () {
    this.transporter = nodemailer.createTransport({...this.service })
  }

  public Send (parameters: MailerProps) {
    this.transporter.sendMail(parameters, (error, info) => {
      if (error) {
        logger.error(error.message)
      } else {
        logger.info(`Email sent ${info.response}`)
      }
    })
  }
}
