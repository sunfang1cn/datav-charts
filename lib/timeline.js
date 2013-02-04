/**
 * DataV-Charts 0.0.1
 * @require JQuery, Jquery.tooltip, Raphael, date.js, Underscore, g.linechart.js
 * timeline support at most 3 lines
 * @author kate.sf@alibaba-inc.com in TBEDP
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */

(function (exports) {

  var Timeline = exports.Timeline = function (container, options) {
    this.R = container;
    this.width = $(this.R).width() || 600;
    this.height = $(this.R).height() || 300;
    if (this.width < 400) {
      this.width = 400;
    }
    if (this.height < 250) {
      this.height = 250;
    }
    var defaults = {
      lineColors: ["#3391d4", "#fe8f00", "#4d4d4d"],
      gridColor: '#cccccc',
      backgroundColor: '#f2f2f2',
      start: 1,
      end: 0,
      gridDash: '--'
    };
    this.options = $.extend(defaults, options);
    this.tooltip = null;
  };

  /**
   * draw grid of
   * @param x
   * @param y
   * @param width
   * @param height
   * @param rows
   */
  Timeline.prototype.drawBigGrid = function (x, y, width, height, rows, color, bgcolor, gridDash) {
    color = color || "#cccccc";
    bgcolor = bgcolor || '#f2f2f2';
    gridDash = gridDash || '--';
    var r = this.paper;
    // fill background
    r.rect(x, y, width, height).attr({stroke: null, 'stroke-width': 0, fill: bgcolor});
    var rowHeight = height / rows;
    // draw cow
    var attr;
    var path;
    for (var i = 0; i <= rows; i++) {
      path = ["M", Math.round(x) + 0.5, Math.round(y + i * rowHeight) + 0.5, "H", Math.round(x + width) + 0.5];
      if (i === rows || i === 0) {
        attr = {stroke: color};
      } else {
        attr = {stroke: color, 'stroke-dasharray': gridDash};
      }
      r.path(path).attr(attr);
    }
    // first row
    r.path(["M", 0, Math.round(y) + 0.5, "V", Math.round(y + height) + 0.5]).attr({stroke: color});
    // last row
    r.path(["M", width, Math.round(y) + 0.5, "V", Math.round(y + height) + 0.5]).attr({stroke: color});
  };

  /** time line grid
   * @param x 左起坐标
   * @param y 上起坐标
   * @param w 宽
   * @param h 高
   * @param wv 栏数
   * @param color 线框颜色
   * @param dx 横向偏移
   */
  Timeline.prototype.drawSmallGrid = function (columnCount, gridColor) {
    var color = gridColor || "#cccccc";
    var r = this.paper;
    var x = 12;
    var y = this.height - 55;
    var w = this.width - 24;
    var h = 50;
    var hv = 1;
    var rowHeight = h / hv,
      columnWidth = w / columnCount;
    var path = [];
    for (var i = 0; i <= hv; i++) {
      path = path.concat(["M", Math.round(x) + 0.5, Math.round(y + i * rowHeight) + 0.5, "H", Math.round(x + w) + 0.5]);
    }
    r.path(path.join(",")).attr({stroke: color});
    path = [];
    for (i = 0; i <= columnCount; i++) {
      var _x = Math.round(x + i * columnWidth) + 0.5;
      path = path.concat(["M", _x, Math.round(y) + 0.5, "V", Math.round(y + h) + 0.5]);
    }
    r.path(path.join(",")).attr({stroke: color});
  };

  //显示时间范围
  Timeline.prototype.drawTimeRange = function () {
    var r = this.paper;
    var valueX = this.shortTrend.valueX;
    if (typeof _.first(valueX) === 'string') {
      var text = _.first(valueX).replace(/-/ig, '.');
      if (typeof _.last(valueX) === 'string') {
        text = [text, _.last(valueX).replace(/-/ig, '.')].join(" - ");
      }
      r.text(100, 25, text).attr({'fill': '#666666', 'font-size': '12px', 'font-weight': 'bold'});
    }
  };

  Timeline.prototype.initCanvas = function () {
    // 初始化舞台
    if (!this.paper) {
      this.paper = Raphael(this.R, this.width, this.height);
    }
    this.paper.clear();
    // 绘制背景网格
    this.drawBigGrid(0, 0, this.width - 1, this.height - 80, 8);
  };
  /**
   * @param data: {valuex[][], valuey[][], valuezx[][], valuezy[][], labelm[], labelz[]}
   */
  Timeline.prototype.render = function (data, options) {
    // 初始化画布
    this.initCanvas();
    if (data) {
      this.data = data;
    }
    data = this.data;
    this.options = $.extend(this.options, options);

    //不到一个月数据时
    if (this.getMonthCount() <= 1) {
      this.options.start = 1;
      this.options.end = 0;
    }
    this.shortTrend = Timeline.getShortTrend(this.data, this.options.start, this.options.end);

    var shortTrend = this.shortTrend;

    //显示短周期时间范围
    this.drawTimeRange();
    // 栏宽
    var dx = 0;
    var i, j, l;
    var range = this.calculateRange();
    this.drawAxisY(range);
    var view = this;
    var r = this.paper;
    // 相邻点之间横向距离
    var ndp = (this.width - 5) / (shortTrend.valueX.length - 1);
    // 提取横向刻度并绘制
    this.drawAxisX(this.buildLabels(), ndp);
    this.shortTrend._valueY = [];

    for (var tid = 0, tl = shortTrend.valueY.length; tid < tl; tid++) {
      // 转换横坐标实际值
      // 只有一个指数纬度的时候取第一个值
      var min = range.mins.length > 1 ? range.mins[tid] : range.mins[0];
      var max = range.maxs.length > 1 ? range.maxs[tid] : range.maxs[0];
      var diff = max - min;
      var valueX = this.shortTrend._valueX = [];
      for (i = 0, l = shortTrend.valueX.length; i < l; i++) {
        valueX[i] = ndp * i + 2;
      }
      //y
      var valueY = [];
      for (i = 0; i < shortTrend.valueY[tid].length; i++) {
        // 获取纵坐标实际值
        var value = shortTrend.valueY[tid][i] || min;
        valueY[i] = this.height - 80 - (value - min) / diff * (this.height - 80);
      }
      this.shortTrend._valueY[tid] = valueY;
      //画图
      var tags = data.tags[tid];
      var path = [];
      var circles = [];
      for (i = 0, l = valueX.length - 1; i < l; i++) {
        // 划线
        path.push('M' + valueX[i] + ' ' + valueY[i] + 'L' + valueX[i + 1] + ' ' + valueY[i + 1]);
        // 画事件标识
        for (var m = 0; m < tags.length; m++) {
          if (tags[m] && shortTrend.valueX[i - 1] === tags[m].date) {
            circles.push([valueX[i - 1], valueY[i - 1], 5]);
          }
        }
      }
      r.path(path.join(",")).attr({stroke: this.options.lineColors[tid], 'stroke-width': 2});
      var circle;
      for (i = 0, l = circles.length; i < l; i++) {
        circle = circles[i];
        r.circle(circle[0], circle[1], circle[2]).attr({fill: '#ffffff', stroke: this.options.lineColors[tid], opacity: 1});
      }
    }

    // 如果有打开的tooltip，先关掉
    if (this.tooltip) {
      this.tooltip.hide();
    }

    var tooltip = this.tooltip = $.tooltip({
      container: this.R,
      position: "middle-right",
      opacity: 0,
      offset: 20
    });
    this.circles = [];
    this.options.hit_area = r.rect(0, 0, this.width - 1, this.height - 80).attr({stroke: null, 'stroke-width': 0, fill: '#f2f2f2', opacity: 0.01});
    if (this.options.hit_area.handler) {
      // unbind event
      this.options.hit_area.unmousemove(this.options.hit_area.handler);
      this.options.hit_area.handler = null;
    }
    this.options.hit_area.handler = function (evt) {
      view.tooltipHandler(evt);
    };
    this.options.hit_area.mousemove(this.options.hit_area.handler);

    $(this.R).unbind("mouseleave").mouseleave(function () {
      view.tooltip.hide();
      for (var m = 0; m < view.shortTrend.valueY.length; m++) {
        if (view.circles[m] && view.circles[m].node && view.circles[m].node.parentNode) {
          view.circles[m].remove();
        }
        view.circles[m] = null;
      }
    });

    // hit_drawed = true;
    // 绘制下方长周期图
    this.renderSmall();
  };

  Timeline.prototype.tooltipHandler = function (evt) {
    var r = this.paper;
    var view = this;
    var opts = view.options;
    var valueX = view.shortTrend._valueX;
    var valueY = view.shortTrend._valueY;
    //要检测出究竟是位于哪个点上
    var baseLeft = $(view.R).offset().left;
    var hitarea_width = (view.width - 1) / valueX.length;
    if (hitarea_width <= 2) {
      hitarea_width = 2;
    }
    var i, l;
    for (i = 0, l = valueX.length; i < l; i++) {
      if (Math.abs(evt.clientX - baseLeft - valueX[i]) <= hitarea_width / 2) {
        break;
      }
    }
    var tooltip = view.tooltip;
    var tooltipY = valueY[0][i] + $(view.R).offset().top;
    for (var m = 0; m < view.circles.length; m++) {
      var circle = view.circles[m];
      if (circle) {
        circle.remove();
      }
    }

    var $tip = $('<div>');
    // 准备数据
    // 没有值，直接返回
    if (!view.shortTrend.valueX[i]) {
      return;
    }
    var tipDate = Date.parseExact(view.shortTrend.valueX[i], "yyyy-MM-dd");
    var weeks = ["日", "一", "二", "三", "四", "五", "六"];
    var addon = '（周' + weeks[tipDate.getDay()] + '）';

    var innerHtml = '';
    innerHtml = '<div id="tip_time">' + view.shortTrend.valueX[i] + addon;

    //增加时间轴事件tooltip
    var tags = view.data.tags;
    var filtered = [];
    // 抽取当天事件
    var k, kl;
    for (k = 0, kl = tags.length; k < kl; k++) {
      for (var n = 0, nl = tags[k].length; n < nl; n++) {
        var val = tags[k][n];
        if (view.shortTrend.valueX[i] === val.date) {
          filtered.push(val);
        }
      }
    }
    // 抽取事件名称并去重
    var names = _.union(_.pluck(filtered, "name"));
    _.each(names, function (name, index) {
      innerHtml += '<p>“' + name + '”</p>';
    });
    innerHtml += '</div>';
    for (k = 0, kl = valueY.length; k < kl; k++) {
      if (view.data.queries.length > 1) {
        innerHtml += '<p style="font-weight: bold; padding-top: 5px; color:' + opts.lineColors[k] + '">' +
          view.data.queries[k].cut(15) + ' ' + fmoney(view.shortTrend.valueY[k][i]) + '</p>';
      } else {
        innerHtml += '<p style="font-weight: bold; padding-top: 5px; color:' + opts.lineColors[k] + '">' +
          view.data.types[k].cut(15) + ' ' + fmoney(view.shortTrend.valueY[k][i]) + '</p>';
      }
    }
    $tip[0].innerHTML = innerHtml;

    //调整位置
    var p = valueX.length > 7 ? 10 : 2;
    var tooltipXOffset = addon.length > 1 ? 10 : 10;

    if (i > valueX.length / 2 + 7) {
      tooltipXOffset = -tooltipXOffset;
      tooltip.setPos("middle-left");
    } else {
      tooltip.setPos("middle-right");
    }
    if (valueX.length < 15) {
      tooltip.setPos("middle-left");
    }

    if (valueX[i]) {
      tooltip.render($tip).show(valueX[i] + $(view.R).offset().left + tooltipXOffset, tooltipY);
    }
    $tip.parent().css({
      background: '#fff',
      opacity: 0.95,
      'boder-radius': '3px',
      'width': '130px',
      padding: '5px',
      color: 'black',
      border: 'none',
      'font-size': '12px',
      'font-weight': 'bold'
    });
    $('.tooltip-corner').css({border: 'none'});
    if (addon === '') {
      $tip.parent().css('width', 85);
    }
    for (var j = 0; j < valueY.length; j++) {
      var y = valueY[j][i] || this.height - 80;
      view.circles[j] = r.circle(valueX[i], y, 5).attr({fill: opts.lineColors[j], stroke: opts.lineColors[j], opacity: 1});
    }
  };

  /**
   * 根据数据和列宽提取横向坐标刻度
   * @param data 横向数据
   * @param columnWeight 列宽
   * @return 横向标签刻度
   */
  Timeline.prototype.buildLabels = function () {
    var labels = [];
    var valueX = this.shortTrend.valueX;
    var columnWeight = this.width / 8;
    // 横向步长
    var step = Math.round(valueX.length / 31) * 4;
    var i, count;
    for (i = valueX.length - 3, count = 7; count >= 0; i -= step) {
      labels[count] = valueX[i];
      count--;
    }
    //剔除undefined的数据
    return _.compact(labels);
  };

  /**
   * 获取今日至数据起始日的月数，依赖全局的lastday变量
   */
  Timeline.prototype.getMonthCount = function () {
    var lastDay = this.getLastDay();
    var baseDay = Timeline.getStartDate(this.data);
    var result = lastDay.getMonth() - baseDay.getMonth() + 12 * (lastDay.getYear() - baseDay.getYear());
    if (result < 1) { //不到一个月时
      return 0;
    }

    return this.data.lastDate ? result + 1 : result;
  };
  /**
   * 获取数据起始日的日期，依赖全局的lastday变量
   */
  Timeline.getStartDate = function (data) {
    var realLength = 0;
    var trend = data.trends[0];
    for (var i = 0, l = trend.length; i < l; i++) {
      if (trend[i] || trend[i] === 0) {
        realLength++;
      }
    }
    var day = new Date(data.lastDate || Date.today().addDays(-1).getTime());
    day.addDays(-realLength + 1);

    return day;
  };

  /*
   * @param data: {valuezx[][], valuezy[][], labelz[]}
   */
  Timeline.prototype.renderSmall = function () {
    var width = this.width;
    var columnCount = this.getMonthCount();
    if (columnCount < 1) {
      return;
    }
    // 绘制时间网格
    this.drawSmallGrid(columnCount);
    // 绘制月份
    lastMonth = new Date(this.data.dates[this.data.dates.length - 1]).getMonth() + 1;
    this.drawAxisZ(12, this.height - 30, width - 24, columnCount, lastMonth);
    // 绘制长周期
    this.drawLongTrend();
    // 绘制选择块
    var columnWidth = (width - 25) / columnCount;
    this.drawScrollTips(1, 0, 12, this.height - 55, 0, 50, columnWidth, columnCount);

  };

  Timeline.prototype.getLastDay = function () {
    var lastDay = this.data.lastDate || Date.today().addDays(-1).getTime(); // 模板中没有服务器端lastday就只能取本地时间
    return new Date(lastDay);
  };

  Timeline.prototype.drawLongTrend = function () {
    var data = this.data;
    //根据本月已过的时间处理dx。横向偏移
    var lastDay = this.getLastDay();
    var days = Date.getDaysInMonth(lastDay.getFullYear(), lastDay.getMonth());
    var dx = (days - lastDay.getDate()) / days * 45;
    //标准化坐标
    var ppx = 32 + 1.8 * dx + (this.width - 2 * dx) / data.dates.length;
    var trend = data.trends[0];
    var max = _.max(trend);
    var min = _.min(trend);
    var coe = (max === min) ? 1 : max - min;
    var ppy = (this.height) - 25 / coe * 0.9;
    var valueX = [], valueY = [];
    var i, l;
    for (i = 0, l = trend.length; i < l; i++) {
      valueX[i] = ppx * i;
    }
    for (i = 0, l = trend.length; i < l; i++) {
      valueY[i] = (trend[i] - min) * ppy;
    }
    var opts = {
      // gutter:30,
      symbol: "",
      bound_lower: 0,
      shade: true,
      name: [],
      smooth: false,
      lineColors: ["#3391d4"],
      color_fill: "#bbbbbb",
      'stroke-width': 0.5
    };
    this.paper.drawLineChart(0, this.height - 40, this.width - dx, 50, valueX, valueY, opts);
  };

  //大标签在前边,跟着实际数据坐标走
  /**
   * @param width 宽度
   * @param labels 标签们
   */
  Timeline.prototype.drawAxisX = function (labels, pointWidth) {
    var r = this.paper;
    var y = this.height - 70;
    var valueX = this.shortTrend.valueX;
    for (var i = 0, l = labels.length; i < l; i++) {
      for (var j = 0, jl = valueX.length; j < jl; j++) {
        if (valueX[j] === labels[i]) {
          var dx = j * pointWidth;
          r.path("M" + dx + ' ' + 0.5 + "L" + dx + ' ' + (this.height - 79.5).toString()).attr({stroke: '#cccccc', 'stroke-dasharray': '--'});
          var yyyymmdd = labels[i].split('-');
          r.text(dx, Math.round(y) + 0.5, yyyymmdd[1] + "-" + yyyymmdd[2]);
        }
      }
    }
  };

  /**
   * 绘制时间文字
   * @param x 绘制x起点
   * @param y 绘制y起点
   * @param width 宽度
   * @param count 栏数
   */
  Timeline.prototype.drawAxisZ = function (x, y, width, count, lastMonth) {
    var r = this.paper;
    var columnWidth = width / count;
    var current = lastMonth || this.getLastDay().getMonth() + 1;
    var text;
    for (var j = 0; j < count; j++) {
      text = current + '月';
      current = (current === 1 ? 12 : current - 1);
      r.text(Math.round(x + (count - j - 1) * columnWidth) + 16.5, Math.round(y) + 0.5, text).attr({'font-size': '11px'});
    }
  };

  function toTens (num, max) {
    var str = num.toString();
    var ret = '';
    for (var i = 1; i < str.length; i++) {
      ret += str[i] === '.' ? '.' : '0';
    }
    if (max) {
      if (str.substr(0, 1) !== '9') {
        ret = (parseInt(str.substr(0, 1), 10) + 1).toString() + ret;
      } else {
        ret = '10' + ret;
      }
    } else {
      ret = str.substr(0, 1) + ret;
    }
    ret = parseInt(ret, 10);
    if (ret - num > 0.6 * num) {
      ret -= 0.5 * num;
    }
    return ret;
  }

  /**
   * 计算坐标轴步长和区间
   */
  Timeline.prototype.calculateRange = function () {
    var count = 7;
    var valueY = this.shortTrend.valueY;
    var maxs = [], mins = [];
    for (var i = 0, l = valueY.length; i < l; i++) {
      mins[i] = _.min(valueY[i]) * 0.9;
      maxs[i] = _.max(valueY[i]) * 1.1;
      // 如果最大值为0,设置为7
      maxs[i] = maxs[i] < 7 ? 7 : maxs[i];
    }
    // 一种指数类型时，合并
    if (this.data.types.length === 1) {
      mins = [_.min(mins)];
      maxs = [_.max(maxs)];
    }
    return {mins: mins, maxs: maxs};
  };

  /**
   * 绘制纵坐标刻度
   * @return 返回最小值和步长
   */
  Timeline.prototype.drawAxisY = function (range) {
    var x = this.width - 12;
    var y = 0;
    var axis = [12, Math.round(x)];
    var valueY = this.shortTrend.valueY;
    var height = this.height - 80;
    var r = this.paper;
    // 8行，7个间行
    var count = 7;
    var rowHeight = height / (count + 1);
    var colors = this.data.queries.length > 1 ? ["#000000"] : this.options.lineColors;
    var anchors = ["start", "end"];
    for (var i = 0, l = range.mins.length; i < l; i++) {
      var step = (range.maxs[i] - range.mins[i]) / 8;
      for (var j = count; j >= 1; j--) {
        var txt = Math.round(range.mins[i] + j * step);
        var txtNode = r.text(axis[axis.length - 1 - i], Math.round(height - (y + j * rowHeight)) + 0.5, fmoney(txt));
        txtNode.attr({'fill': colors[i], 'text-anchor': anchors[axis.length - 1 - i]});
      }
    }
  };

  Timeline.prototype.drawScrollTips = function (start, end, x, y, dx, h, cw, cc) {
    var view = this;
    var data = data;
    var r = this.paper;
    var options = this.options;
    var lx, rx;
    var maxMonth = this.getMonthCount();
    if (start && start > maxMonth) {
      start = maxMonth;
    }
    if (end && end > maxMonth - 1) {
      end = 0;
    }
    if (options.start && options.start > maxMonth) {
      options.start = maxMonth;
    }
    if (options.end && options.end > maxMonth - 1) {
      options.end = 0;
    }
    if (!options.start) {
      //first time
      options.start = start;
      options.end = end;
      lx = x + cw * (cc - start) + dx - 11;
      rx = x + cw * (cc - end) + (end === 0 ? -dx : 0);
    } else {
      start = options.start;
      end = options.end;
      lx = x + cw * (cc - start) + dx - 11;
      rx = x + cw * (cc - end) + (end === 0 ? -dx : 0);
    }
    var leftButton = r.image('../images/scroll_tips_r.png', lx, y, 12, h);
    var rightButton = r.image('../images/scroll_tips_l.png', rx, y, 12, h);
    var rect = r.rect(lx + 12, y, rx - lx - 12, h).attr({stroke: '#d2d2d2', fill: '#d2d2d2', opacity: '0.4'});
    leftButton.attr({cursor: 'w-resize'});
    rightButton.attr({cursor: 'w-resize'});

    //left
    var ox, st;
    leftButton.drag(function (dx, dy) {
        st = Math.round(dx / cw);
        if (start - st > cc) {
          st = start - cc;
        }
        if (st > 0 && start - st <= end) {
          st = start - end - 1;
        }
        if (Math.abs(dx) <= 16) {
          st = 0;
        }
        this.attr({
          x: ox + st * cw
        });
        rect.attr({
          x: ox + st * cw + 12,
          width: rx - (ox + st * cw) - 12
        });
      },
      function () {
        ox = this.attr("x");
      },
      function () {
        if (!st || Math.abs(st) < 1) {
          return;
        }
        start = start - st;
        options.start = start;
        // r.clear();

        if (view.tooltip) {
          view.tooltip.hide();
        }
        $(view.R).trigger("changeRange", {from: options.start, to: options.end});
        view.render();
      });
    //right
    rightButton.drag(function (dx, dy) {
        st = Math.round(dx / cw);
        if (end - st < 0) {
          st = -end;
        }
        if (st < 0 && end - st >= start) {
          st = end - start + 1;
        }
        if (Math.abs(dx) <= 16) {
          st = 0;
        }
        this.attr({
          x: ox + st * cw
        });
        rect.attr({
          width: (ox + st * cw) - lx - 12
        });
      },
      function () {
        ox = this.attr("x");
      },
      function () {
        if (!st || Math.abs(st) < 1) {
          return;
        }
        end -= st;
        options.end = end;
        $(view.R).trigger("changeRange", {from: options.start, to: options.end});
        view.render();
      });
  };

  /**
   * 根据起始时间和结束时间，从长周期中获取短周期数据
   * @param data 长周期数据
   * @param start 起始月份，从昨天倒数第几个月
   * @param end 结束月份，从昨天倒数第几个月.start必须大于end值加1.
   * @retrun 返回值，valueX是短周期的坐标点的横向坐标值；valueY是短周期坐标点的纵向坐标值。
   * 由于横向坐标相同，所以是单一数组；纵坐标按趋势数量分组
   */
  Timeline.getShortTrend = function (data, start, end) {
    //build 初始 valuex valuey
    if (start <= end) {
      throw new Error("错误的起始和结束参数");
    }
    var first, last;
    // 一切以前一天作为基准
    var lastDay = data.lastDate || Date.today().addDays(-1).getTime(); // 模板中没有服务器端lastday就只能取本地时间
    lastDay = new Date(lastDay);
    if (end === 0) {
      last = lastDay;
    } else {
      // 如果非当前月，则为该月最后一天
      last = lastDay.clone().addMonths(-1 * end).moveToLastDayOfMonth();
    }
    first = lastDay.clone().addMonths(-1 * start + 1).moveToFirstDayOfMonth();
    // 数据的起始值动态判断
    var ref = Timeline.getStartDate(data).getTime();
    var startIndex = Math.round((first.getTime() - ref) / 24 / 3600 / 1000);
    var endIndex = Math.round((last.getTime() - ref) / 24 / 3600 / 1000);
    var days = endIndex - startIndex + 1;

    var i, l, count;
    var valueX = [];
    var valueY = [];
    var dates = data.dates;
    if (days <= 31 && days > dates.length) { //数据只有一个月的处理
      days = dates.length;
    }
    for (i = 0, l = data.trends.length; i < l; i++) {
      valueY[i] = [];
      valueX[i] = [];
      var trend = data.trends[i];
      var xCount = 0;
      for (var k = 0; k < days; k++) {
        if (!dates[startIndex + k]) {
          continue;
        }
        valueY[i].push(trend[startIndex + k]);
        valueX[xCount] = dates[startIndex + k];
        xCount++;
      }
    }

    return {"valueX": valueX, "valueY": valueY, "startIndex": startIndex, "days": days};
  };

  function fmoney (s, n) {
    s = parseFloat((s + "").replace(/[^\d\.\-]/g, ""));
    if (isNaN(s)) {
      return s;
    }
    var lr = (s.toFixed(n || 0) + '').split('.');
    var l = lr[0].split('').reverse();
    var t = [];
    for (var i = 0, len = l.length, last = len - 1; i < len; i++) {
      t.push(l[i]);
      if ((i + 1) % 3 === 0 && i !== last) {
        t.push(',');
      }
    }
    t = t.reverse();
    if (lr[1]) {
      t.push('.');
      t.push(lr[1]);
    }
    return t.join('');
  }

  String.prototype.cut = function (len) {
    return this.length > len ? this.substring(0, len) + '...' : this;
  }

}(window.shuCharts = window.shuCharts || {}));
