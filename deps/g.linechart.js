/*global Raphael */
(function () {
  /**
   * 弹出气泡框
   */
  Raphael.fn.popup = function (X, Y, set, pos, ret) {
    pos = String(pos || "top-middle").split("-");
    pos[1] = pos[1] || "middle";
    var r = 5,
      bb = set.getBBox(),
      w = Math.round(bb.width),
      h = Math.round(bb.height);
    if (!isFinite(h)) {        //如果为""则getBBox()无法返回height
      bb = set[0].getBBox(),
        w = Math.round(bb.width),
        h = Math.round(bb.height);
    }
    var x = Math.round(bb.x) - r,
      y = Math.round(bb.y) - r,
      gap = Math.min(h / 2, w / 2, 5),
      shapes = {
        top: "M{x},{y}h{w4},{w4},{w4},{w4}a{r},{r},0,0,1,{r},{r}v{h4},{h4},{h4},{h4}a{r},{r},0,0,1,-{r},{r}l-{right},0-{gap},{gap}-{gap}-{gap}-{left},0a{r},{r},0,0,1-{r}-{r}v-{h4}-{h4}-{h4}-{h4}a{r},{r},0,0,1,{r}-{r}z",
        bottom: "M{x},{y}l{left},0,{gap}-{gap},{gap},{gap},{right},0a{r},{r},0,0,1,{r},{r}v{h4},{h4},{h4},{h4}a{r},{r},0,0,1,-{r},{r}h-{w4}-{w4}-{w4}-{w4}a{r},{r},0,0,1-{r}-{r}v-{h4}-{h4}-{h4}-{h4}a{r},{r},0,0,1,{r}-{r}z",
        right: "M{x},{y}h{w4},{w4},{w4},{w4}a{r},{r},0,0,1,{r},{r}v{h4},{h4},{h4},{h4}a{r},{r},0,0,1,-{r},{r}h-{w4}-{w4}-{w4}-{w4}a{r},{r},0,0,1-{r}-{r}l0-{bottom}-{gap}-{gap},{gap}-{gap},0-{top}a{r},{r},0,0,1,{r}-{r}z",
        left: "M{x},{y}h{w4},{w4},{w4},{w4}a{r},{r},0,0,1,{r},{r}l0,{top},{gap},{gap}-{gap},{gap},0,{bottom}a{r},{r},0,0,1,-{r},{r}h-{w4}-{w4}-{w4}-{w4}a{r},{r},0,0,1-{r}-{r}v-{h4}-{h4}-{h4}-{h4}a{r},{r},0,0,1,{r}-{r}z"
      },
//            offset = {
//                hx0: X - (x + r + w - gap * 2),
//                hx1: X - (x + r + w / 2 - gap),
//                hx2: X - (x + r + gap),
//                vhy: Y - (y + r + h + r + gap),
//                "^hy": Y - (y - gap)
//            },
      mask = [
        {
          x: x + r,
          y: y,
          w: w,
          w4: w / 4,
          h4: h / 4,
          right: 0,
          left: w - gap * 2,
          bottom: 0,
          top: h - gap * 2,
          r: r,
          h: h,
          gap: gap
        },
        {
          x: x + r,
          y: y,
          w: w,
          w4: w / 4,
          h4: h / 4,
          left: w / 2 - gap,
          right: w / 2 - gap,
          top: h / 2 - gap,
          bottom: h / 2 - gap,
          r: r,
          h: h,
          gap: gap
        },
        {
          x: x + r,
          y: y,
          w: w,
          w4: w / 4,
          h4: h / 4,
          left: 0,
          right: w - gap * 2,
          top: 0,
          bottom: h - gap * 2,
          r: r,
          h: h,
          gap: gap
        }
      ][pos[1] === "middle" ? 1 : (pos[1] === "top" || pos[1] === "left") * 2];
    var dx = 0,
      dy = 0,
      out = this.path(fill(shapes[pos[0]], mask)).insertBefore(set);
    switch (pos[0]) {
      case "top":
        dx = X - (x + r + mask.left + gap);
        dy = Y - (y + r + h + r + gap);
        break;
      case "bottom":
        dx = X - (x + r + mask.left + gap);
        dy = Y - (y - gap);
        break;
      case "left":
        dx = X - (x + r + w + r + gap);
        dy = Y - (y + r + mask.top + gap);
        break;
      case "right":
        dx = X - (x - gap);
        dy = Y - (y + r + mask.top + gap);
        break;
    }
    out.translate(dx, dy);
    if (ret) {
      ret = out.attr("path");
      out.remove();
      return {
        path: ret,
        dx: dx,
        dy: dy
      };
    }
    set.translate(dx, dy);
    return out;
  };

  var tokenRegex = /\{([^\}]+)\}/g,
    objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
    replacer = function (all, key, obj) {
      var res = obj;
      key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
        name = name || quotedName;
        if (res) {
          if (name in res) {
            res = res[name];
          }
          typeof res === "function" && isFunc && (res = res());
        }
      });
      res = (res === null || res === obj ? all : res) + "";
      return res;
    },
    fill = function (str, obj) {
      return String(str).replace(tokenRegex, function (all, key) {
        return replacer(all, key, obj);
      });
    };

  function shrink (values, dim) {
    var k = values.length / dim,
      j = 0,
      l = k,
      sum = 0,
      res = [];
    while (j < values.length) {
      l--;
      if (l < 0) {
        sum += values[j] * (1 + l);
        res.push(sum / k);
        sum = values[j++] * -l;
        l += k;
      } else {
        sum += values[j++];
      }
    }
    return res;
  }

  /**
   * 插值平滑曲线
   */
  function getAnchors (p1x, p1y, p2x, p2y, p3x, p3y) {
    var l1 = (p2x - p1x) / 2,
      l2 = (p3x - p2x) / 2,
      a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
      b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
    a = p1y < p2y ? Math.PI - a : a;
    b = p3y < p2y ? Math.PI - b : b;
    // 避免曲线超出x轴
    if (p2y === p1y) {
      l1 = 0;
    }
    if (p3y === p2y) {
      l2 = 0;
    }
    var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2;
    var dx1 = l1 * Math.sin(alpha + a),
      dy1 = l1 * Math.cos(alpha + a),
      dx2 = l2 * Math.sin(alpha + b),
      dy2 = l2 * Math.cos(alpha + b);
    return {
      x1: p2x - dx1,
      y1: p2y + dy1,
      x2: p2x + dx2,
      y2: p2y + dy2
    };
  }

  /****
   * @require gRaphael
   * @param opts {
   gutter 图线区域与周围边距
   colors [color] 每条曲线的对应颜色
   -labels [string] 每个x对应的刻度标注-
   background 主背景色
   fill 主要指文字颜色
   smooth 平滑曲线
   indep =false 为true时各曲线的y轴使用独立的缩放比例
   stroke 主前景色
   stroke-width 背景线条宽度
   symbol 数据点形状, 参见gRaphael
   shade =false 为true下方显示阴影
   nostroke =false  为true时将不画曲线只返回相应path
   }
   */
  var LineChart = function (x, y, width, height, valuesx, valuesy, opts) {
    var R = this;
    var defaults = {
      colors: ["#000"],
      stroke: null,
      'stroke-width': 1,
      fill: "#000",
      background: "#FFF",
      indep: false,
      gutter: 15,
      smooth: true,
      symbol: "",
      shade: false,
      nostroke: false,
      axis: "",
      axisxstep: 0,
      dash: "",
      labels: null,
      bound_lower: null,
      textAttr: {
        font: '12px Helvetica, Arial',
        fill: "#000"
      },
      lineAttr: {
        fill: "none",
        'stroke-width': opts['stroke-width'] || 3,
        'stroke-linejoin': "round",
        'stroke-linecap': "round"
      }
    };
    opts = $.extend(true, {}, defaults, opts);
    //各种缓存及数据预处理
    // 保存尺寸相关数据
    this.opts = opts;
    this.scale = {
      x: x,
      y: y,
      width: width,
      height: height,
      gutter: opts.gutter
    };
    this.valuesx = [];
    this.valuesy = [];    //由.drawLine()负责加入数据

    var gutter = opts.gutter,
      colors = opts.colors;
    if (!this.raphael.is(colors, "array")) {
      colors = opts.colors = [opts.colors];
    }
    if (!opts.stroke) {
      opts.stroke = colors[0];
    }
    if (!this.raphael.is(valuesx[0], "array")) {
      valuesx = [valuesx];
    }
    if (!this.raphael.is(valuesy[0], "array")) {
      valuesy = [valuesy];
    }
    var len = Math.max(valuesx[0].length, valuesy[0].length);
    for (var i = 1, l = valuesy.length; i < l; i++) {
      len = Math.max(len, valuesy[i].length);
    }
    if (len <= 0) {
      return;
    }
    this.shades = this.set();
    this.axis = this.set();
    this.lines = this.set();
    this.symbols = this.set();
    //gRaphael.line自带, 下方显示阴影
    for (var i = 0, ii = valuesy.length; i < ii; i++) {
      if (valuesy[i].length > width - 2 * gutter) {
        valuesy[i] = shrink(valuesy[i], width - 2 * gutter);
        len = width - 2 * gutter;
      }
      if (valuesx[i] && valuesx[i].length > width - 2 * gutter) {
        valuesx[i] = shrink(valuesx[i], width - 2 * gutter);
      }
    }
    var allx = [].concat.apply([], valuesx),
      ally = [].concat.apply([], valuesy),
    //计算绘图所需的比例, 最值等
      xdim = this.g.snapEnds(Math.min.apply(Math, allx), Math.max.apply(Math, allx), valuesx[0].length - 1),
      ydim = this.g.snapEnds(Math.min.apply(Math, ally), Math.max.apply(Math, ally), valuesy[0].length - 1),
      minx = xdim.from,
      maxx = xdim.to,
      miny = (opts.bound_lower !== null ? opts.bound_lower : ydim.from),
      maxy = ydim.to,
      kx = (width - gutter * 2) / ((maxx - minx) || 1),
      ky = (height - gutter * 2) / ((maxy - miny) || 1);
    $.extend(this.scale, {
      kx: kx,
      ky: ky,
      minx: minx,
      miny: miny,
      maxx: maxx,
      maxy: maxy,
      kys: [],
      minys: [],
      maxys: []
    });
    //对每组数据绘制曲线
    for (var i = 0, il = valuesy.length; i < il; i++) {
      this.drawLine((valuesx[i] || valuesx[0]), valuesy[i], {
        smooth: opts.smooth,
        nostroke: opts.nostroke,
        symbol: opts.symbol,
        color: (colors[i] || (colors[i] = colors[0]))
      });
    }
  };
  var LineChartProto = {};
  /**
   * 绘制单条曲线
   * 调用前确保数据在canvas可见尺寸内
   * @param valuex, valuey [number]
   * @param pts {
   nostroke 为true时只计算SVG路径并返回, 并不实际绘制
   }
   */
  LineChartProto.drawLine = function (valuex, valuey, opts) {
    var defaults = {
      smooth: false,
      nostroke: false,
      symbol: "",
      color: "#000",
      lineAttr: {}
    };
    opts = $.extend(true, {}, defaults, this.opts, opts);
    //过滤null值
    var rawx = valuex,
      rawy = valuey;
    valuex = [];
    valuey = [];
    for (var i = 0, ii = rawx.length; i < ii; i++) {
      if (rawx[i] !== null && rawy[i] !== null) {
        valuex.push(rawx[i]);
        valuey.push(rawy[i]);
      }
    }
    this.valuesx.push(valuex);
    this.valuesy.push(valuey);  //保存值
    var attr = opts.lineAttr,
      sc = this.scale,
      x = sc.x,
      y = sc.y,
      minx = sc.minx,
      maxy = sc.maxy,
      miny = sc.miny,
      kx = sc.kx,
      ky = sc.ky,
      width = sc.width,
      height = sc.height,
      gutter = sc.gutter,
      valuesx = this.valuesx,
      X, Y;
    attr.stroke = opts.color;
    attr.fill = "none";
    var path = [], line,
      sym = this.raphael.is(opts.symbol, 'array') ? opts.symbol[i] : opts.symbol,
      symset = this.set(),
      shade;
    if (opts.shade) {
      this.shades.push(shade = this.path().attr({
        stroke: "none",
        fill: (opts.color_fill ? opts.color_fill : opts.color),
        opacity: opts.nostroke ? 0.5 : 0.3
      }));
    }
    if (!opts.nostroke) {
      this.lines.push(line = this.path().attr(attr));
    }
    if (opts.indep) {
      var ydim = this.g.snapEnds(Math.min.apply(Math, valuey), Math.max.apply(Math, valuey), valuey.length - 1);
      miny = (opts.bound_lower !== null ? opts.bound_lower : ydim.from),
        maxy = ydim.to,
        ky = (sc.height - sc.gutter * 2) / ((maxy - miny) || 1);
      sc.maxys.push(maxy);
      sc.minys.push(miny);
      sc.kys.push(ky);
    }
    for (var j = 0, jj = valuey.length; j < jj; j++) {
      X = x + gutter + (valuex[j] - minx) * kx,
        Y = y + height - gutter - (valuey[j] - miny) * ky;
      (Raphael.is(sym, "array") ? sym[j] : sym) && symset.push(this.g[Raphael.fn.g.markers[this.raphael.is(sym, "array") ? sym[j] : sym]](X, Y, attr['stroke-width'] * 1.2).attr({
        'stroke-width': attr['stroke-width'] * 0.8,
        fill: opts.background,
        stroke: attr.stroke
      }));    //绘制数据点
      if (opts.smooth) {
        if (j && j !== jj - 1) {
          var X0 = x + gutter + (valuex[j - 1] - minx) * kx,
            Y0 = y + height - gutter - (valuey[j - 1] - miny) * ky,
            X2 = x + gutter + (valuex[j + 1] - minx) * kx,
            Y2 = y + height - gutter - (valuey[j + 1] - miny) * ky;
          var a = getAnchors(X0, Y0, X, Y, X2, Y2);
          path = path.concat([a.x1, a.y1, X, Y, a.x2, a.y2]);
        }
        if (j === 0) {
          path = ["M", x + gutter, Y, "H", X, "C", X, Y];
        }
      } else {
        if (j === 0) {
          path = ["M", x + gutter, Y];
        }
        path = path.concat(["L", X, Y]);
      }
    }
    if (opts.smooth) {
      path = path.concat([X, Y, X, Y]);
    }
    X = x + width - gutter;
    path = path.concat(["H", X]);
    this.symbols.push(symset);
    if (opts.shade) {
      shade.attr({path: path.concat(["L", X, y + height - gutter, "L", x + gutter + (rawx[0] - minx) * kx, y + height - gutter, "z"]).join(",")});
    }
    !opts.nostroke && line.attr({path: path.join(",")});
  };
  /****
   * 绘制图例
   */
  LineChartProto.drawLegend = function (names, options) {
    var opts = {
      x: null,
      y: null,
      size: 12
    };
    opts = $.extend(opts, options);
    var sc = this.scale,
      x = opts.x || sc.width + sc.gutter,
      y = opts.y || (sc.y + sc.gutter) - 30,
      size = opts.size,
      opts = this.opts,
      names = names || opts.names,
      textAttr = {
        fill: "#666",
        'font-size': size + "px",
        'font-weight': "bold",
        'text-anchor': "end"
      };
    if (this.legends) {
      this.legends.remove();
    }
    var legends = this.set(),
      s,
      lines = this.lines;
    if (!lines) {
      return;
    }
    for (var i = this.valuesy.length - 1; i >= 0; i--) {
      //textAttr.fill= opts.colors[i];
      x -= size;
      this.rect(x, y - size * 0.6, size, size).attr({
        stroke: "none",
        fill: opts.colors[i]
      });
      x -= 2;
      legends[i] = this.text(x, y, names[i]).attr(textAttr);
      x -= legends[i].getBBox().width + 15;
    }
    return (this.legends = legends);
  };
  /**
   * 绘制背景网格
   * @param wv 横向分隔数
   * @param hv 纵向分隔数
   * @param options {
   noborder =false ture时不显示边框
   }
   */
  LineChartProto.drawGrid = function (wv, hv, options) {
    var R = this;
    var opts = {
      stroke: "#000"
    };
    if (this.grid) {
      this.grid.remove();
    }
    var grid = this.set();
    $.extend(opts, this.opts, options);
    var sc = this.scale,
      x = sc.x + sc.gutter,
      y = sc.y + sc.gutter,
      w = sc.width - sc.gutter * 2,
      h = sc.height - sc.gutter * 2;
    var path = [],
      rowHeight = h / hv,
      columnWidth = w / wv;
    if (opts.noborder) {
      path = [];
    } else {
      path = ["M", Math.round(x) + 0.5, Math.round(y) + 0.5, "L", Math.round(x + w) + 0.5, Math.round(y) + 0.5,
        Math.round(x + w) + 0.5, Math.round(y + h) + 0.5, Math.round(x) + 0.5, Math.round(y + h) + 0.5,
        Math.round(x) + 0.5, Math.round(y) + 0.5];
    }
    for (var i = 1; i < hv; i++) {
      path = path.concat(["M", Math.round(x) + 0.5, Math.round(y + i * rowHeight) + 0.5, "H", Math.round(x + w) + 0.5]);
    }
    for (i = 1; i < wv; i++) {
      path = path.concat(["M", Math.round(x + i * columnWidth) + 0.5, Math.round(y) + 0.5, "V", Math.round(y + h) + 0.5]);
    }
    grid = R.path(path.join(",")).attr({stroke: opts.stroke}).toBack();
    return (this.grid = grid);
  };
  /**
   * 标注坐标轴
   * @param sectNum 区间数量
   * @param axis 需要标注的坐标轴名称, 为+x, -x, +y, -y
   * @param opts {
   round 需要保留的小数位数
   labels [] 与sectNum数量相符的标注值, 如为null则通过计算对应x\y值输出
   */
  LineChartProto.labelAxis = function (sectNum, axis, opts) {
    var defaults = {
      round: 2,
      labels: null,
      textAttr: {
        font: '12px Helvetica, Arial',
        fill: "#000",
        'text-anchor': (axis === "+y") ? "end" : "middle"
      }
    };
    opts = $.extend(true, {}, defaults, this.opts, opts);
    var attr = opts.textAttr,
      sc = this.scale,
      w = sc.width,
      h = sc.height,
      gutter = sc.gutter,
      x = sc.x + gutter * 0.5,
      y = sc.y + h - sc.gutter,
      vx = sc.maxx,
      stepx = 0,
      vy = sc.maxy,
      stepy = 0;
    attr.fill = opts.fill;
    var labels = opts.labels || [];
    var r = Math.pow(10, opts.round) || 1, d;
    if (axis === "x" || axis === "+x") {
      stepx = (w - gutter * 2) / (sectNum - 1);
      y += gutter * 0.5;
      d = sc.maxx / (sectNum - 1);
      if (!opts.labels) {
        labels.push(sc.minx);
      }
    } else if (axis === "y" || axis === "+y") {
      stepy = -(h - gutter * 2) / (sectNum - 1);
      d = sc.maxy / (sectNum - 1);
      if (!opts.labels) {
        labels.push(sc.miny);
      }
    }
    if (!opts.labels) {
      //计算每个刻度对应标注
      for (var i = 1; i < sectNum; i++) {
        labels[i] = labels[i - 1] + d;
      }
      for (var i = 0; i < sectNum; i++) {
        labels[i] = Math.round(labels[i] * r) / r;
      }
    }
    //跳过过长文本以免相互重叠
    var first = this.text(x, y, labels[0]).attr(attr);   //假定取第一个作为标准长度
    var lw = first.getBBox().width,
      num = Math.floor(w / lw),
      skip = Math.floor((sectNum - 1) / num) + 1;
    for (var i = skip; i < sectNum; i += skip) {
      x += stepx * skip,
        y += stepy * skip;
      this.text(x, y, labels[i]).attr(attr);
    }
    return this;
  };

  function createDots (f) {
    var sc = this.scale,
      valuesx = this.valuesx,
      valuesy = this.valuesy,
      minx = sc.minx,
      miny = sc.miny,
      x = sc.x,
      y = sc.y,
      height = sc.height,
      kx = sc.kx,
      ky = sc.ky,
      gutter = sc.gutter;
    var cvrs = f || this.set(),
      C;
    for (var i = 0, ii = valuesy.length; i < ii; i++) {
      if (this.opts.indep) {
        ky = sc.kys[i];
        miny = sc.minys[i];
      }
      for (var j = 0, jj = valuesy[i].length; j < jj; j++) {
        var X = x + gutter + ((valuesx[i] || valuesx[0])[j] - minx) * kx,
          nearX = x + gutter + ((valuesx[i] || valuesx[0])[j ? j - 1 : 1] - minx) * kx,
          Y = y + height - gutter - (valuesy[i][j] - miny) * ky;
        f ? (C = {}) : cvrs.push(C = this.circle(X, Y, Math.abs(nearX - X) / 2).attr({stroke: "none", fill: "#000", opacity: 0}));
        C.x = X;
        C.y = Y;
        C.value = valuesy[i][j];
        C.line = this.lines[i];
        C.shade = this.shades[i];
        C.symbol = this.symbols[i][j];
        C.symbols = this.symbols[i];
        C.axis = (valuesx[i] || valuesx[0])[j];
        f && f.call(C);
      }
    }
    !f && (this.dots = cvrs);

    return this;
  }

  /**
   * @return {
   x 坐标
   y []
   values [] 各y对应的数值
   lineID [] 各y对应的原始曲线id
   axis 当前指向第几条x
   }
   */
  function createColumns (f) {
    var sc = this.scale,
      valuesx = this.valuesx,
      valuesy = this.valuesy,
      minx = sc.minx,
      miny = sc.miny,
      x = sc.x,
      y = sc.y,
      width = sc.width,
      height = sc.height,
      kx = sc.kx,
      ky = sc.ky,
      gutter = sc.gutter;
    // unite Xs together
    var Xs = [];
    for (var i = 0, ii = valuesx.length; i < ii; i++) {
      Xs = Xs.concat(valuesx[i]);
    }
    Xs.sort(function (l, r) {
      return l - r;
    });
    // remove duplicates
    var Xs2 = [],
      xs = [];
    for (i = 0, ii = Xs.length; i < ii; i++) {
      Xs[i] !== Xs[i - 1] && Xs2.push(Xs[i]) && xs.push(x + gutter + (Xs[i] - minx) * kx);
    }
    Xs = Xs2;
    ii = Xs.length;
    var cvrs = f || this.set();
    for (i = 0; i < ii; i++) {
      var X = xs[i] - (xs[i] - (xs[i - 1] || x)) / 2,
        w = ((xs[i + 1] || x + width) - xs[i]) / 2 + (xs[i] - (xs[i - 1] || x)) / 2,
        C = null,
        lineID = [];
      f ? (C = {}) : cvrs.push(C = this.rect(X - 1, y, Math.max(w + 1, 1), height).attr({stroke: "none", fill: "#000", opacity: 0}));
      C.values = [];
      C.symbols = this.set();
      C.y = [];
      C.x = xs[i];
      C.axis = Xs[i];
      for (var j = 0, jj = valuesy.length; j < jj; j++) {
        if (this.opts.indep) {
          ky = sc.kys[j];
          miny = sc.minys[j];
        }
        Xs2 = valuesx[j] || valuesx[0];
        for (var k = 0, kk = Xs2.length; k < kk; k++) {
          if (Xs2[k] === Xs[i]) {
            lineID.push(j);
            C.values.push(valuesy[j][k]);
            C.y.push(y + height - gutter - (valuesy[j][k] - miny) * ky);
            C.symbols.push(this.symbols[j][k]);
          }
        }
      }
      C.lineID = lineID;
      f && f.call(C);
    }
    !f && (this.columns = cvrs);
  }

  LineChartProto.each = function (f) {
    createDots.call(this, f);
    return this;
  };
  LineChartProto.eachColumn = function (f) {
    createColumns.call(this, f);
    return this;
  };
  LineChartProto.getDots = function () {
    !this.dots && createDots.call(this);
    return this.dots;
  };
  LineChartProto.getColumns = function () {
    !this.columns && createColumns.call(this);
    return this.columns;
  };
  //fn下的函数仅从属于该对象而非其原型
  Raphael.fn.drawLineChart = function (x, y, width, height, valuesx, valuesy, options) {
    if (!this.LineChart) {
      this.LineChart = LineChart;
      this.LineChart.prototype = this;
      $.extend(this.LineChart.prototype, LineChartProto);
    }
    return new this.LineChart(x, y, width, height, valuesx, valuesy, options);
  };
}());