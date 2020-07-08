import Event from '@ioc:Adonis/Core/Event'

Event.on('server:manager', 'Server.handleServer')
