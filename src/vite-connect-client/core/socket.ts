/* eslint-disable */
import { ISocketMessage } from '@/types'
const WebSocket = require('websocket').w3cwebsocket;

interface ISocketTransportOptions {
  bridge: string
  callback: any
}

// -- SocketTransport ------------------------------------------------------ //

class SocketTransport {
  private _bridge: string
  public socket: WebSocket | null
  private _queue: ISocketMessage[]
  private _incoming: ISocketMessage[]
  private _pingInterval: any
  private _callback: any

  // -- constructor ----------------------------------------------------- //

  constructor (opts: ISocketTransportOptions) {
    this._bridge = ''
    this.socket = null
    this._queue = []
    this._incoming = []
    this._pingInterval = null
    this._callback = () => {
      // empty
    }

    if (!opts.bridge || typeof opts.bridge !== 'string') {
      throw new Error('Missing or invalid bridge field')
    }

    this._bridge = opts.bridge

    if (!opts.callback || typeof opts.callback !== 'function') {
      throw new Error('Missing or invalid callback field')
    }

    this._callback = opts.callback
  }

  // -- public ---------------------------------------------------------- //

  public open (queuedMessages?: ISocketMessage[]) {
    this._socketOpen(queuedMessages)
  }

  public send (socketMessage: ISocketMessage): void {
    if (this.socket && this.socket.readyState === 1) {
      this._socketSend(socketMessage)
    } else {
      this._setToQueue(socketMessage)
    }
  }

  public queue (socketMessage: ISocketMessage): void {
    this._setToQueue(socketMessage)
  }

  public pushIncoming () {
    this._pushIncoming()
  }

  public close () {
    if (this.socket && this.socket.readyState === 1) {
      clearInterval(this._pingInterval)
      this.socket.close()
    }
  }

  // -- private ---------------------------------------------------------- //

  private _socketOpen (queuedMessages?: ISocketMessage[]) {
    const bridge = this._bridge

    const url = bridge.startsWith('https')
      ? bridge.replace('https', 'wss')
      : bridge.startsWith('http')
        ? bridge.replace('http', 'ws')
        : bridge

      
    const socket = new WebSocket(url)
    this.socket = socket

    socket.onmessage = (event: MessageEvent) => this._socketReceive(event)

    socket.onopen = () => {

      if (queuedMessages && queuedMessages.length) {
        queuedMessages.forEach((msg: ISocketMessage) => this._setToQueue(msg))
      }

      this._pushQueue()
      this._toggleSocketPing()
    }
  }

  private _toggleSocketPing () {
    if (this.socket && this.socket.readyState === 1) {
      this._pingInterval = setInterval(
        () => {
          if (this.socket && this.socket.readyState === 1) {
            this.socket.send('ping')
          }
        },
        10000 // 10 seconds
      )
    } else {
      clearInterval(this._pingInterval)
    }
  }

  private _socketSend (socketMessage: ISocketMessage) {
    if (!this.socket) {
      throw new Error('Missing socket: required for sending message')
    }

    const message: string = JSON.stringify(socketMessage)

    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(message)
    } else {
      this._setToQueue(socketMessage)
      this._socketOpen()
    }
  }

  private async _socketReceive (event: MessageEvent) {
    let socketMessage: ISocketMessage

    if (event.data === 'pong') {
      return
    }

    try {
      socketMessage = JSON.parse(event.data)
    } catch (error) {
      throw error
    }

    if (this.socket && this.socket.readyState === 1) {
      this._callback(socketMessage)
    } else {
      this._incoming.push(socketMessage)
    }
  }

  private _setToQueue (socketMessage: ISocketMessage) {
    this._queue.push(socketMessage)
  }

  private _pushQueue () {
    const queue = this._queue

    queue.forEach((socketMessage: ISocketMessage) =>
      this._socketSend(socketMessage)
    )

    this._queue = []
  }

  private _pushIncoming () {
    const incoming = this._incoming

    incoming.forEach((socketMessage: ISocketMessage) =>
      this._callback(socketMessage)
    )

    this._incoming = []
  }
}

export default SocketTransport
