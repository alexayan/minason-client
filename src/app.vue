<script>
import wepy from 'wepy';
import 'wepy-async-function';

export default class extends wepy.app {
  config = {
    pages: ['pages/index', 'pages/minason'],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'Minason',
      navigationBarTextStyle: 'black'
    },
    cloud: true
  };

  globalData = {
    userInfo: null
  };

  constructor() {
    super();
    this.use('requestfix');
    this.use('promisify');
  }

  async systemInfo() {
    let systemInfo = this.globalData.systemInfo;
    if (!systemInfo) {
      systemInfo = await wepy.getSystemInfo();
      this.globalData.systemInfo = systemInfo;
    }
    return systemInfo;
  }

  onLaunch() {
    // wx.cloud.init();
  }
}
</script>
