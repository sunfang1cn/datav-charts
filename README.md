DataV-Charts 0.0.1
==========

摘要
----------
本项目是一个基于[Raphaeljs](http://raphaeljs.com/)和JQuery的可视化组件库。
目前主要提供了长周期的多维度时间轴，以及按省区分的中国地图两个组件。
本项目不使用Flash，并且可以在IE >= 6.0, Chrome, Safari (Mobile Safari), Firefox等现代浏览器上很好的运行。
本组件库是[DataV](https://github.com/TBEDP/datavjs)的一个子项目。
本组件库目前在[淘宝指数](http://shu.taobao.com)中得到了广泛的应用。
本项目由[阿里巴巴集团数据平台](http://www.alidata.org)开发维护。

依赖
----------
本项目公共依赖有：
* [Raphaeljs](http://raphaeljs.com/) >= 1.5.6
* [JQuery](http://jquery.com/) >= 1.6.0
* jquery.tooltip by zolunX10

除此之外，TimeLine组件还依赖：
* [g.Raphael](http://g.raphaeljs.com) >= 0.5.0
* [datejs](http://www.datejs.com/) 1.0 Alpha-1
* [underscore](http://underscorejs.org/) >= 1.3.3

组件说明
----------

### TimeLine

本组件是带长周期小时间轴的TimeLine组件，最多支持三条曲线同时显示，具有非常丰富的功能和配置。

#### 数据格式
```js
    {
      "trends": [
        [41701, 41398, 42516, .......,  30307, 31078, 32483, 33962, 34363, 33021, 32563, 30821, 30711],
        [556, 525, 653, ......, 580, 549, 541, 602, 646, 610, 728, 674, 533]
      ],
      "dates": ["2012-01-01", "2012-01-02", "2012-01-03", ......, "2012-05-23", "2012-05-24", "2012-05-25", "2012-05-26",
        "2012-05-27", "2012-05-28", "2012-05-29", "2012-05-30", "2012-05-31"],
      "lastDate": 1338422400000,
      "tags": [
        [
          {"name": "春节", "global": true, "keyword": null, "date": "2012-01-23"},
          {"name": "3.8妇女节", "global": true, "keyword": null, "date": "2012-03-08"}
        ],
        [
          {"name": "春节", "global": true, "keyword": null, "date": "2012-01-23"},
          {"name": "3.8妇女节", "global": true, "keyword": null, "date": "2012-03-08"}
        ]
      ],
      "queries": ["ipad"],
      "types": ["A指数", "B指数"]
    };
```
其中：
* trends为实际的数据，是一个二维数组，其中第一维表示不同种类的数据，最多为三项。第二维是实际的数据值，时间间隔为天；
* dates为横坐标中的日期项，格式为yyyy-MM-dd，从逻辑上，trends的每一维度的数据长度和dates的数据长度应该都是相同的；
* lastDate为数据中的最后一天的绝对时间，目前必须传入，一般可直接传入 new Date(dates[dates.length - 1])；
* tags为可选参数，传入后会在所设置的上用一个原点来提示该日有需要注意的事项，鼠标hover上去之后的tip中会表明其name;
* queries和types均为用于标志数据类型的两个参数，其中的一个参数的长度必须为1，另外一个应该与trends的第一维长度相等。
  如果传入query多个(<=3)，types为1个，则纵坐标的数据轴只会有一个；如果传入query为1个，types有多个(<=2)，则会显示两个纵坐标
  的数据轴分别表示不同type的数据的大小。这两个参数的含义为：queries为同一个指标下的不同项的数据，types为不同类指标，因此
  后者存在两个时会使用不同的时间轴。

#### 配置项及其默认值
```js
    lineColors = ["#3391d4", "#fe8f00", "#4d4d4d"] // 三条曲线的颜色
    gridColor = '#cccccc'                          // 坐标线的颜色
    backgroundColor = '#f2f2f2'                    // 图表背景色
    start = 1                                      // 短周期数据起始月数 (到长周期数据最后一个月的月数差)
    end = 0                                        // 短周期数据终止月数 (到长周期数据最后一个月的月数差)
    gridDash = '--'                                // 网格线的类型，为null时是直线，'.' '--'等为不同的虚线
```
#### 使用方法
```js
      $(function () {
        var map = new window.shuCharts.Timeline($('.timelinebox')[0]); // 组件的大小会根据容器大小自适应，但TimeLine组件不应小于400*250px
        // 数据
        var data =
        {"trends": [
          [......],
          [......]
        ],
          "dates": [......],
          "lastDate": 1338422400000,
          "tags": [
            [
              {"name": "春节", "global": true, "keyword": null, "date": "2012-01-23"},
              ......
            ],
            [
              {"name": "淘宝双12大促", "global": true, "keyword": null, "date": "2011-12-12"},
              ......
            ]
          ],
          "queries": ["ipad"],
          "types": ["搜索指数", "成交指数"]};
        // 配置项
        var opt = {start: 3, end: 0};
        map.render(data, opt);
      });
```
详见examples/timeline.html

#### 效果图

![TimeLine](http://img02.taobaocdn.com/tps/i2/T1Dd6LXcxoXXa03TE4-766-392.png)

### Map

本组件是利用不用省份的颜色深浅不同来表述各个省区的数据大小。

#### 数据格式
```js
    [{"name": "广东", "value": 152166, "rate": 11.46825740760978, "rank": 1},
    .........
    {"name": "内蒙古", "value": 23, "rate": 0.00000002342, "rank": 35}]
```

其中：
* name为省份名称，为了在项目中的统一，请均使用中文名，并不要加上‘省’或‘市’的字样；
* value为省份的值的绝对数；
* rate为占比；
* rank为排名；

#### 配置项及其默认值
```js
   hoverColor = "#cabee9"  // 鼠标移到省份上时的显示
   maxColor = '#007aff'    // 省份颜色的最大值
   minColor = '#cfebf7'    // 省份颜色的最小值
   colorNum = 7            // 省份颜色的分级
```
#### 使用方法
```js
    $(function () {
        var map = new window.shuCharts.Map($('.mapbox')[0]); // 组件的大小会根据容器大小自适应，但Map组件不应小于350*350px
        // 数据
        var data = [
          {"name": "广东", "value": 152166, "rate": 11.46825740760978, "rank": 1},
          {"name": "浙江", "value": 133696, "rate": 10.076233471128882, "rank": 2},
          {"name": "江苏", "value": 131292, "rate": 9.895051795801319, "rank": 3},
          ...... // 本处省略各省份，若不传入某省份，则该省份颜色按照最小值显示，并且鼠标hover时无效果
          {"name": "西藏", "value": 1118, "rate": 0.08426003037280165, "rank": 33},
          {"name": "澳门", "value": 506, "rate": 0.03813557725280647, "rank": 34},
          {"name": "内蒙古", "value": 0, "rate": 0, "rank": 35}
        ];
        // 配置
        var opts = {colorNum: 8};
        map.render(data, opts);
    });
```
详见examples/map.html

#### 效果图

![Map](http://img03.taobaocdn.com/tps/i3/T1m22LXc0nXXbNj_3g-388-345.png)



样式定制
----------

鼠标hover时的Tooltip样式在css/tooltip.css中定义。

