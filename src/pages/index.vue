<style lang="less">
  page {
    background: #f1f1f1;
  }
  .container{
    padding: 20px 15px;
    .empty, .wifi-tip{
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: rgba(0,0,0,0.6);
    }
    .services{
      display: flex;
      flex-wrap: wrap;
      .service{
        flex: 0 0 33%;
        height: 115px;
        margin-bottom: 15px;
        .content{
          height: 100%;
          margin: 5px;
          padding: 10px;
          background: #fff;
          box-shadow: 0px 0px 17px 0 rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          box-sizing: border-box;
          &.highlight{
            transform: scale(0.9);
            transition: transform 0.25s ease;
          }
          .name {
            font-size: 15px;
            color: rgba(0, 0, 0, 0.9);
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
          }
          .desc{
            margin-top: 10px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            color: rgba(0,0,0,0.6);
            font-size: 14px;
          }
        }
      }
    }
  }
</style>
<template>
  <view class="container">
    <view class="wifi-tip" wx:if="{{networkType !== 'wifi'}}">
      请连接 Wifi
    </view>
    <view class="empty" wx:elif="{{services.length === 0}}">
      找不到可用的服务，请下拉刷新
    </view>
    <view class="services" wx:else>
      <view class="service" wx:for="{{services}}" wx:key="id">
        <view class="content" hover-class="highlight" @tap="goToService({{item}})">
          <view class="name">{{item.name}}</view>
          <view class="desc">{{item.desc}}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import wepy from 'wepy';
import _ from 'lodash';
import {Base64} from 'js-base64';

export default class Index extends wepy.page {
  config = {
    enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  };

  data = {
    services: [],
    networkType: ''
  };

  methods = {
    goToService(service) {
      wx.navigateTo({
        url: `/pages/minason?id=${encodeURIComponent(service.id)}&name=${encodeURIComponent(service.name)}`
      })
    }
  };

  onShareAppMessage() {
    return {
      title: 'Minason',
      path: '/pages/index'
    }
  }

  stopDiscover() {
    wx.offLocalServiceFound();
    wx.offLocalServiceLost();
    wx.stopLocalServiceDiscovery();
  }

  discover(cb) {
    wx.getNetworkType({
      success: (res) => {
        this.networkType = res.networkType;
        this.$apply();
      }
    })
    this.stopDiscover();
    wx.onLocalServiceFound((res) => {
      if (!_.get(res, 'attributes.minason', null)) {
        return;
      }
      console.log('found service', res);
      const service = {
        id: 'ws://' + res.ip + ':' + res.port,
        desc: Base64.decode(wx.arrayBufferToBase64(res.attributes.desc)),
        name: Base64.decode(wx.arrayBufferToBase64(res.attributes.name)),
        _name: res.serviceName
      }
      const isExist = _.find(this.services, (s) => {
        return s.id === service.id && s._name === service._name
      })
      if (isExist) {
        return;
      }
      console.log('found service', service);
      this.services.push(service);
      this.$apply();
    });
    wx.onLocalServiceLost((res) => {
      this.services = this.services.filter((s) => {
        return s._name !== res.serviceName
      });
      this.$apply();
      console.log('lost', res);
    })
    wx.startLocalServiceDiscovery({
      serviceType: '_http._tcp',
      success: () => {
        this.services = [];
        this.$apply();
        cb && cb();
      },
      fail: () => {
        cb && cb();
      }
    })
  }

  onPullDownRefresh() {
    this.discover(() => {
      wx.stopPullDownRefresh();
    });
  }

  onShow() {
    this.discover();
    wx.setNavigationBarTitle({
      title: 'Minason'
    })
  }

  onHide() {
    this.stopDiscover();
  }

  onLoad() {
    wx.onNetworkStatusChange((res) => {
      this.networkType = res.networkType;
      this.$apply();
      if (this.networkType === 'wifi') {
        this.discover();
      }
    })
  }
}
</script>
