<style lang="less">
  @import "../components/wxParse/wxParse.wxss";
  .container{
    overflow-y: scroll;
  }
</style>
<template>
  <view class="container" bindtap="onTap">
    <import src="../components/wxParse/wxParse.wxml"/>
    <template is="wxParse" data="{{wxParseData: content.nodes}}"/>
  </view>
</template>

<script>
import wepy from 'wepy';
import Minason from '../libs/minason';
import diffpatch from '../libs/diffpatch';
const WxParse = require('../components/wxParse/wxParse.js');

export default class Index extends wepy.page {
  config = {
  };

  data = {
  };

  methods = {
    onInputConfirm(e) {
      this.handleInputEvent(e, 'confirm');
    },
    onInputInput(e) {
      this.handleInputEvent(e, 'input');
    },
    onInputBlur(e) {
      this.handleInputEvent(e, 'blur');
    },
    onInputFocus(e) {
      this.handleInputEvent(e, 'focus');
    },
    onTap(e) {
      let data = e.target.dataset.data;
      if (!data) {
        return;
      }
      try {
        data = JSON.parse(decodeURI(data));
        const method = data.tap;
        if (method) {
          let args = [];
          try {
            args = JSON.parse(decodeURI(data.args));
          } catch (e) {}
          this.minason.remote(method)(...args);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  handleInputEvent(e, m) {
    let data = e.target.dataset.data;
    if (!data) {
      return;
    }
    try {
      data = JSON.parse(decodeURI(data));
      const method = data[m];
      if (method) {
        let args = [];
        try {
          args = JSON.parse(decodeURI(data.args));
        } catch (e) {}
        args.unshift(e.detail.value);
        this.minason.remote(method)(...args);
      }
    } catch (e) {
      console.error(e);
    }
  }

  onUnload() {
    this.minason && this.minason.destory();
    this.minason = null;
  }

  onShow() {
    if (this.loaded) {
      this.onLoad();
    }
  }

  onHide() {
    this.minason && this.minason.destory();
    this.minason = null;
  }

  onLoad(options) {
    this.minason && this.minason.destory();
    const service = this.$parent.globalData.service;
    if (!service) {
      return wx.navigateBack();
    }
    wx.setNavigationBarTitle({
      title: decodeURIComponent(service.name)
    })
    this.loaded = false;
    console.log('on load', service)
    const minason = new Minason({
      url: decodeURIComponent(service.id)
    });
    minason.on('open', async () => {
      this.minason.remote('init')({
      });
    });
    minason.on('refresh', resp => {
      if (resp.type === 'full') {
        this._templateId = resp.id;
        this._template = resp.content;
        WxParse.wxParse('content', 'html', resp.content, this, 10);
      } else if (resp.type === 'patch') {
        if (resp.oid !== this._templateId || this._template === undefined) {
          return this.minason.send({
            type: Minason.PROTOCOL.REFRESH
          })
        }
        try {
          const result = diffpatch.patch_apply(resp.patches, this._template);
          if (!result[1][0]) {
            throw new Error('patch fail')
          }
          this._templateId = resp.nid;
          this._template = result[0];
          WxParse.wxParse('content', 'html', result[0], this, 10);
        } catch (e) {
          console.error(e);
          return this.minason.send({
            type: Minason.PROTOCOL.REFRESH
          })
        }
      }
    });
    minason.start();
    this.minason = minason;
    this.loaded = true;
  }
}
</script>
