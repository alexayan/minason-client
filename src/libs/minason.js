import EventEmitter from 'wolfy87-eventemitter';
import _ from 'lodash';
import UUID from './uuid';
import wepy from 'wepy';

const defaultConfig = {
  ping: 10 * 1000 + 1000,
  remoteTimeout: 150 * 1000
};

const PROTOCOL = {
  REMOTE_CALL: 1,
  REMOTE_SUCCESS_RESULT: 2,
  REMOTE_ERROR_RESULT: 3,
  PING: 4,
  REFRESH: 5
};

class Minason extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = _.assign({}, defaultConfig, config);
    this.state = -1;
    console.log('new minason', config);
  }

  start() {
    if (this.state === 0) {
      return false;
    }
    this.state = 1;
    this.initSocket();
    return true;
  }

  send(data) {
    if (_.isObject(data)) {
      data = JSON.stringify(data);
    } else {
      data = '' + data;
    }
    this.socket.send({
      data: data
    });
  }

  destory() {
    this.state = 0;
    this.pingTimeout && clearTimeout(this.pingTimeout);
    this.pingTimeout = null;
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
      } finally {
        this.socket = null;
      }
    }
  }

  remote(method, options = {}) {
    return async (...args) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          console.log(`remote call ${method} timeout, args: `, ...args);
          reject(new Error(`remote call ${method} timeout`));
        }, this.config.remoteTimeout);
        const callProtocol = {
          id: new UUID(1).toString(),
          type: PROTOCOL.REMOTE_CALL,
          data: {
            method,
            args
          }
        };
        this.once(callProtocol.id, resp => {
          clearTimeout(timer);
          if (resp.type === PROTOCOL.REMOTE_SUCCESS_RESULT) {
            resolve(resp.data);
          } else {
            reject(new Error(resp.data));
          }
        });
        this.send(callProtocol);
      });
    };
  }

  async local(data) {
    try {
      const method = _.get(data, 'data.method', '');
      console.log(`call local method: ${method}`);
      if (!method || !wx[method]) {
        return this.send({
          id: data.id,
          type: PROTOCOL.REMOTE_ERROR_RESULT,
          data: `wx.${method} not found`
        });
      }
      const resp = await wepy[method].apply(null, _.get(data, 'data.args', []));
      return this.send({
        id: data.id,
        type: PROTOCOL.REMOTE_SUCCESS_RESULT,
        data: resp
      });
    } catch (e) {
      return this.send({
        id: data.id,
        type: PROTOCOL.REMOTE_ERROR_RESULT,
        data: e.message
      });
    }
  }

  heartbeat() {
    this.pingTimeout && clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
      try {
        this.socket && this.socket.close(1001, 'beartbeat fail');
      } catch (e) {
        console.error(e);
      }
    }, this.config.ping);
  }

  refresh(data) {
    this.emit('refresh', data.data);
  }

  initSocket() {
    if (this.state === 0) {
      return;
    }
    if (this.socket) {
      try {
        this.pingTimeout && clearTimeout(this.pingTimeout);
        this.pingTimeout = null;
        this.socket.close();
        this.socket = null;
      } catch (e) {
        console.error(e);
      }
    }
    const socket = wx.connectSocket({
      url: this.config.url
    });
    socket.onClose(res => {
      setTimeout(() => {
        this.start();
      }, 1000);
      console.log('minason: close', res);
      this.trigger('close');
    });
    socket.onError(err => {
      console.log('minason error', err);
    });
    socket.onOpen(res => {
      this.state = 2;
      this.heartbeat();
      console.log('minason: connected');
      this.trigger('open');
    });
    socket.onMessage(data => {
      console.log('minason: message', data.data);
      try {
        data = JSON.parse(data.data);
      } catch (e) {
        console.error(e);
      }
      switch (data.type) {
        case PROTOCOL.PING:
          this.heartbeat();
          break;
        case PROTOCOL.REMOTE_CALL:
          this.local(data);
          break;
        case PROTOCOL.REMOTE_ERROR_RESULT:
        case PROTOCOL.REMOTE_SUCCESS_RESULT:
          this.emit(data.id, data);
          break;
        case PROTOCOL.REFRESH:
          this.refresh(data);
          break;
        default:
          break;
      }
    });
    this.socket = socket;
  }
}

Minason.PROTOCOL = PROTOCOL;

export default Minason;
