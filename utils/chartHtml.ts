export const chartHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<script src="https://code.highcharts.com/stock/highstock.js"></script>
<script src="https://code.highcharts.com/stock/modules/drag-panes.js"></script>
<script src="https://code.highcharts.com/stock/modules/annotations.js"></script>
<script src="https://code.highcharts.com/stock/indicators/indicators.js"></script>
<script src="https://code.highcharts.com/stock/indicators/volume-by-price.js"></script>
<script src="https://code.highcharts.com/stock/indicators/bollinger-bands.js"></script>
<script src="https://code.highcharts.com/stock/indicators/ema.js"></script>
<script src="https://code.highcharts.com/stock/indicators/macd.js"></script>
<script src="https://code.highcharts.com/stock/indicators/rsi.js"></script>
<style>
body {
  margin: 0;
  padding: 0;
  background-color: #000000;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
  touch-action: pan-y;
}
#container {
  width: 100%;
  height: 100vh;
}
.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  color: white;
  font-size: 16px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #0078FF;
  animation: spin 1s ease-in-out infinite;
  margin-right: 12px;
}
.price-line {
  stroke-width: 1px;
  stroke-dasharray: 3, 3;
}
.price-label {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}
.custom-candle-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.85);
  color: #FFFFFF;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  pointer-events: none;
  display: none;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
  border: 1px solid #444;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.tooltip-price {
  font-weight: bold;
  color: #fff;
}
.tooltip-volume {
  color: #aaa;
}
.chart-overlay-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.overlay-button {
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid #333;
  border-radius: 4px;
  margin-bottom: 5px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
</style>
</head>
<body>
<div id="container"></div>
<div id="loading" class="loading">
<div class="spinner"></div>
<div>Loading chart data...</div>
</div>

<script>
// Performance optimization: Use requestAnimationFrame for smoother rendering
let animationFrameId;
let pendingCandles = [];
let lastRenderTime = 0;
const RENDER_THROTTLE = 500; // ms between renders



// Chart initialization with better defaults
let chart;
let seriesData = [];
let volumeData = [];
let isInitialDataLoaded = false;
let currentChartType = 'candlestick';
let showIndicators = false;
let currentPrice = null;
let priceLineId = 'current-price-line';
let highlightedPrice = null;

// Chart theme and configuration
Highcharts.theme = {
  colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
  chart: {
    backgroundColor: '#000000',
    borderColor: '#222222',
    borderWidth: 0,
    className: 'dark-container',
    plotBackgroundColor: '#000000',
    plotBorderWidth: 0,
    plotShadow: false,
  },
  title: {
    style: {
      color: '#FFFFFF',
      font: '16px "Trebuchet MS", Verdana, sans-serif'
    }
  },
  subtitle: {
    style: {
      color: '#CCCCCC',
      font: '12px "Trebuchet MS", Verdana, sans-serif'
    }
  },
  xAxis: {
    gridLineColor: '#222222',
    gridLineWidth: 1,
    labels: {
      style: {
        color: '#777777'
      }
    },
    lineColor: '#222222',
    tickColor: '#222222',
    title: {
      style: {
        color: '#999999',
        fontWeight: 'bold',
        fontSize: '12px'
      }
    }
  },
  yAxis: {
    gridLineColor: '#222222',
    labels: {
      style: {
        color: '#777777'
      }
    },
    lineColor: '#222222',
    minorTickInterval: null,
    tickColor: '#222222',
    tickWidth: 1,
    title: {
      style: {
        color: '#999999',
        fontWeight: 'bold',
        fontSize: '12px'
      }
    }
  },
  legend: {
    itemStyle: {
      color: '#CCCCCC'
    },
    itemHoverStyle: {
      color: '#FFFFFF'
    },
    itemHiddenStyle: {
      color: '#444444'
    }
  },
  credits: {
    enabled: false
  },
  labels: {
    style: {
      color: '#CCCCCC'
    }
  },
  navigation: {
    buttonOptions: {
      symbolStroke: '#DDDDDD',
      theme: {
        fill: '#222222'
      }
    }
  },
  navigator: {
    handles: {
      backgroundColor: '#444444',
      borderColor: '#777777'
    },
    outlineColor: '#222222',
    maskFill: 'rgba(16, 16, 16, 0.5)',
    series: {
      color: '#777777',
      lineColor: '#777777'
    },
    xAxis: {
      gridLineColor: '#222222'
    }
  },
  scrollbar: {
    barBackgroundColor: '#222222',
    barBorderColor: '#444444',
    buttonArrowColor: '#777777',
    buttonBackgroundColor: '#222222',
    buttonBorderColor: '#444444',
    rifleColor: '#777777',
    trackBackgroundColor: '#000000',
    trackBorderColor: '#222222'
  }
};

// Apply the theme
Highcharts.setOptions(Highcharts.theme);

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing chart");
  try {
    // Create the chart with improved configuration
    chart = Highcharts.stockChart("container", {
      chart: {
        animation: false,
        events: {
          load: function() {
            setTimeout(() => {
              document.getElementById('loading').style.display = 'none';
              // Initialize touch events after loading
              initializeTouchEvents();
            }, 300);
          },
          click: function(event) {
            // Send click event to React Native
            const xValue = this.xAxis[0].toValue(event.chartX);
            const yValue = this.yAxis[0].toValue(event.chartY);
            
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ 
                type: "chartInteraction",
                action: "click",
                x: xValue,
                y: yValue
              })
            );
          }
        },
        panning: {
          enabled: true,
          type: 'x'
        },
        pinchType: 'x',
        zoomType: 'x',
        marginRight: 10
      },
      rangeSelector: {
        enabled: false
      },
      navigator: {
        adaptToUpdatedData: false, // For better performance
        enabled: true,
        height: 40
      },
      scrollbar: {
        enabled: true,
        barBackgroundColor: '#222',
        barBorderRadius: 5,
        barBorderWidth: 0,
        buttonBackgroundColor: '#222',
        buttonBorderWidth: 0,
        buttonArrowColor: '#777',
        buttonBorderRadius: 5,
        rifleColor: '#777',
        trackBackgroundColor: '#111',
        trackBorderRadius: 5,
        trackBorderWidth: 0
      },
      title: { 
        text: "BTC/USDT Chart",
        style: {
          fontSize: '16px'
        }
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          hour: '%H:%M',
          day: '%m-%d',
          week: '%m-%d',
          month: '%Y-%m',
          year: '%Y'
        },
        lineColor: '#222',
        tickColor: '#222',
        labels: {
          style: {
            color: '#777'
          }
        },
        crosshair: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.3)',
          dashStyle: 'shortdot'
        }
      },
      yAxis: [{
        labels: {
          align: 'right',
          x: -3,
          style: {
            color: '#777'
          },
          formatter: function() {
            // Highlight current price on y-axis
            if (currentPrice && Math.abs(this.value - currentPrice) < currentPrice * 0.0005) {
              return '<span style="color: #F9335D; font-weight: bold;">' + this.value.toFixed(1) + '</span>';
            }
            return this.value.toFixed(1);
          }
        },
        height: '70%',
        lineWidth: 1,
        resize: {
          enabled: true
        },
        gridLineColor: 'rgba(50, 50, 50, 0.25)',
        title: {
          text: 'Price'
        },
        crosshair: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.3)',
          dashStyle: 'shortdot'
        }
      }, {
        labels: {
          align: 'right',
          x: -3,
          style: {
            color: '#777'
          }
        },
        top: '72%',
        height: '28%',
        offset: 0,
        lineWidth: 1,
        gridLineColor: 'rgba(50, 50, 50, 0.25)',
        title: {
          text: 'Volume'
        }
      }],
      tooltip: {
        split: false,
        shared: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderColor: '#444',
        borderWidth: 1,
        borderRadius: 4,
        shadow: false,
        style: {
          color: '#fff'
        },
        valueDecimals: 2,
        xDateFormat: '%Y-%m-%d %H:%M',
        shape: 'callout',
        formatter: function() {
          const points = this.points;
          let tooltip = '<b>' + Highcharts.dateFormat('%Y-%m-%d %H:%M', this.x) + '</b><br/>';
          
          if (currentChartType === 'candlestick' && points[0].point) {
            const point = points[0].point;
            tooltip += '<span class="tooltip-price">Open: ' + point.open.toFixed(2) + '</span><br/>';
            tooltip += '<span class="tooltip-price">High: ' + point.high.toFixed(2) + '</span><br/>';
            tooltip += '<span class="tooltip-price">Low: ' + point.low.toFixed(2) + '</span><br/>';
            tooltip += '<span class="tooltip-price">Close: ' + point.close.toFixed(2) + '</span><br/>';
          } else {
            tooltip += '<span class="tooltip-price">Price: ' + points[0].y.toFixed(2) + '</span><br/>';
          }
          
          // Add volume if available
          if (points.length > 1 && points[1].series.name === 'Volume') {
            tooltip += '<span class="tooltip-volume">Volume: ' + points[1].y.toFixed(2) + '</span><br/>';
          }
          
          // Add indicators
          for (let i = 2; i < points.length; i++) {
            tooltip += '<span style="color:' + points[i].series.color + '">' + 
                       points[i].series.name + ': ' + points[i].y.toFixed(2) + '</span><br/>';
          }
          
          return tooltip;
        }
      },
      plotOptions: {
        candlestick: {
          color: '#FF4D4F', // Bearish candle
          upColor: '#4ADE80', // Bullish candle
          lineColor: '#FF4D4F',
          upLineColor: '#4ADE80',
          pointWidth: 8
        },
        line: {
          lineWidth: 2,
          states: {
            hover: {
              lineWidth: 3
            }
          },
          marker: {
            enabled: false
          }
        },
        column: {
          borderWidth: 0,
          color: function(point) {
            // Color volume bars based on price change
            if (point.point.index > 0) {
              const prevIndex = point.point.index - 1;
              const prevCandle = seriesData[prevIndex];
              const currentCandle = seriesData[point.point.index];
              
              if (currentCandle && prevCandle) {
                return currentCandle[4] >= prevCandle[4] ? 
                  'rgba(74, 222, 128, 0.3)' : 'rgba(249, 51, 93, 0.3)';
              }
            }
            return 'rgba(62, 71, 84, 0.5)';
          }
        },
        series: {
          point: {
            events: {
              click: function() {
                // Send the selected price to React Native
                if (currentChartType === 'candlestick') {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({ 
                      type: "priceSelected", 
                      price: this.close,
                      timestamp: this.x
                    })
                  );
                } else {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({ 
                      type: "priceSelected", 
                      price: this.y,
                      timestamp: this.x
                    })
                  );
                }
              }
            }
          }
        }
      },
      series: [
        {
          type: 'candlestick',
          name: 'BTC/USDT',
          id: 'btcusdt',
          data: seriesData,
          tooltip: {
            valueDecimals: 2
          }
        },
        {
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: volumeData,
          yAxis: 1
        },
        {
          type: 'bb',
          linkedTo: 'btcusdt',
          name: 'Bollinger Bands',
          params: {
            period: 20,
            standardDeviation: 2
          },
          color: '#0078FF',
          lineWidth: 1,
          visible: false,
          id: 'bb'
        }
      ],
      time: { useUTC: false },
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      }
    });
    
    // Notify React Native that the chart is ready
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "ready" })
    );
  } catch (e) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "error", message: e.message })
    );
  }
});

// Add a price line to highlight the current price
function addPriceLine(price) {
  if (!chart) return;
  
  // Remove existing price line
  removePriceLine();
  
  // Add new price line
  chart.yAxis[0].addPlotLine({
    id: priceLineId,
    value: price,
    width: 1,
    color: '#F9335D',
    dashStyle: 'dash',
    label: {
      text: price.toFixed(1),
      style: {
        color: '#F9335D',
        fontWeight: 'bold'
      },
      align: 'right'
    },
    zIndex: 5
  });
  
  currentPrice = price;
}

// Remove the current price line
function removePriceLine() {
  if (chart) {
    chart.yAxis[0].removePlotLine(priceLineId);
  }
}

// Change chart type between candlestick and line
function changeChartType(newType) {
  if (!chart || newType === currentChartType) return;
  
  // Update the series type
  chart.series[0].update({
    type: newType
  }, false);
  
  // Update color settings based on type
  if (newType === 'line') {
    chart.series[0].update({
      color: '#0078FF',
      lineWidth: 2
    }, true);
  } else {
    chart.series[0].update({
      color: '#FF4D4F',
      upColor: '#4ADE80',
      lineColor: '#FF4D4F',
      upLineColor: '#4ADE80'
    }, true);
  }
  
  currentChartType = newType;
}

// Toggle technical indicators
function toggleIndicators(show) {
  if (!chart) return;
  
  // Set visibility for all indicators
  chart.series.forEach(series => {
    if (['ema21', 'bb', 'rsi', 'macd'].includes(series.options.id)) {
      series.setVisible(show, false);
    }
  });
  
  chart.redraw();
  showIndicators = show;
}

// Highlight a specific price on the chart
function highlightPrice(price) {
  if (!chart) return;
  
  // Add price line
  addPriceLine(price);
  
  // Store highlighted price
  highlightedPrice = price;
  
  // Send price to React Native
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ 
      type: "priceSelected", 
      price: price
    })
  );
  
  // Scroll to visible range if needed
  const extremes = chart.yAxis[0].getExtremes();
  if (price < extremes.min || price > extremes.max) {
    const padding = (extremes.max - extremes.min) * 0.1;
    chart.yAxis[0].setExtremes(price - padding, price + padding);
  }
}

// Select current market price
function selectMarketPrice() {
  if (!chart || !seriesData.length) return;
  
  // Get the last candle's close price
  const lastCandle = seriesData[seriesData.length - 1];
  const lastPrice = lastCandle[4]; // Close price
  
  // Highlight this price
  highlightPrice(lastPrice);
}

// Zoom chart in/out with improved scaling
function zoomChart(zoomIn) {
  if (!chart) return;
  
  const extremes = chart.xAxis[0].getExtremes();
  const range = extremes.max - extremes.min;
  const center = (extremes.max + extremes.min) / 2;
  
  let newRange;
  if (zoomIn) {
    newRange = range * 0.6; // Zoom in by 40%
  } else {
    newRange = range * 1.5; // Zoom out by 50%
  }
  
  const newMin = center - newRange / 2;
  const newMax = center + newRange / 2;
  
  // Apply the new zoom level
  chart.xAxis[0].setExtremes(newMin, newMax);
  
  // Update y-axis to fit the visible data points
  autoScaleYAxis();
}

// Auto-scale y-axis to fit visible data
function autoScaleYAxis() {
  if (!chart || !seriesData.length) return;
  
  const extremes = chart.xAxis[0].getExtremes();
  let min = Infinity;
  let max = -Infinity;
  
  // Find min/max values in the visible range
  for (let i = 0; i < seriesData.length; i++) {
    const point = seriesData[i];
    if (point[0] >= extremes.min && point[0] <= extremes.max) {
      // For candlestick, check all OHLC values
      min = Math.min(min, point[2], point[3]); // high, low
      max = Math.max(max, point[2], point[3]); // high, low
    }
  }
  
  // Add padding (10%)
  const padding = (max - min) * 0.1;
  min = min - padding;
  max = max + padding;
  
  // Apply new y-axis extremes if we found valid values
  if (min !== Infinity && max !== -Infinity && min < max) {
    chart.yAxis[0].setExtremes(min, max);
  }
}

// Optimize message handling
window.addEventListener("message", (event) => {
  try {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
      case "initialize": {
        // Initialize chart with specified settings
        if (data.chartType) {
          changeChartType(data.chartType);
        }
        toggleIndicators(!!data.showIndicators);
        break;
      }
        
      case "addCandle": {
        const timestamp = data.timestamp;
        const candle = [
          timestamp,
          data.open,
          data.high,
          data.low,
          data.close
        ];
        const volume = [timestamp, data.volume || Math.random() * 100]; // Fallback volume if not provided
        
        // Add to pending candles for batch update
        pendingCandles.push({ candle, volume });
        
        // Update current price
        if (data.close) {
          addPriceLine(data.close);
        }
        
        // Throttle rendering for better performance
        const now = Date.now();
        if (now - lastRenderTime > RENDER_THROTTLE) {
          renderPendingCandles();
          lastRenderTime = now;
        } else if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(renderPendingCandles);
        }
        break;
      }
      
      case "setData": {
        if (chart) {
          // Process candles and volume
          seriesData = data.candles.map(c => [
            c.timestamp,
            c.open,
            c.high,
            c.low, 
            c.close
          ]);
          
          // Generate volume data if not provided
          volumeData = data.candles.map(c => [
            c.timestamp,
            c.volume || Math.abs(c.close - c.open) * (Math.random() * 100 + 50)
          ]);
          
          // Update chart with batch data
          chart.series[0].setData(seriesData, false);
          chart.series[1].setData(volumeData, false);
          
          // Add current price line
          if (seriesData.length > 0) {
            const lastCandle = seriesData[seriesData.length - 1];
            addPriceLine(lastCandle[4]); // Last close price
          }
          
          // Auto-fit the data to the viewport
          if (seriesData.length > 0) {
            // Determine start and end points based on the timeframe
            let timeframe = data.timeframe || chart.title.textStr.split(' ')[1];
            let visiblePoints;
            
            // Calculate how many candles to show based on timeframe
            switch(timeframe) {
              case '15m': visiblePoints = 96; break; // 24 hours
              case '1h': visiblePoints = 72; break; // 3 days
              case '4h': visiblePoints = 60; break; // 10 days
              case '1d': visiblePoints = 45; break; // 45 days
              case '3m': visiblePoints = 60; break; // Default: ~3 days
              default: visiblePoints = Math.min(60, seriesData.length);
            }
            
            // Calculate points to show - focus on most recent data
            const startIndex = Math.max(0, seriesData.length - visiblePoints);
            
            // Set x-axis extremes
            if (seriesData.length > 0) {
              const startTime = seriesData[startIndex][0];
              const endTime = seriesData[seriesData.length - 1][0];
              
              // Add 10% padding on the right for new candles
              const paddingTime = (endTime - startTime) * 0.1;
              chart.xAxis[0].setExtremes(startTime, endTime + paddingTime);
              
              // Auto-scale y-axis
              autoScaleYAxis();
            }
          }
          
          chart.redraw();
          isInitialDataLoaded = true;
          
          // Set chart type if provided
          if (data.chartType) {
            changeChartType(data.chartType);
          }
        }
        break;
      }
      
      case "changeChartType": {
        changeChartType(data.chartType);
        // Re-scale after changing chart type for better visualization
        setTimeout(autoScaleYAxis, 100);
        break;
      }
      
      case "toggleIndicators": {
        toggleIndicators(data.show);
        // Re-scale after toggling indicators for better fit
        setTimeout(autoScaleYAxis, 100);
        break;
      }
      
      case "clear": {
        seriesData = [];
        volumeData = [];
        if (chart) {
          chart.series[0].setData([], false);
          chart.series[1].setData([], false);
          removePriceLine();
          chart.redraw();
        }
        break;
      }
      
      case "zoomIn": {
        zoomChart(true);
        break;
      }
      
      case "zoomOut": {
        zoomChart(false);
        break;
      }
      
      case "highlightPrice": {
        highlightPrice(data.price);
        break;
      }
      
      case "selectMarketPrice": {
        selectMarketPrice();
        break;
      }
      
      case "setTheme": {
        if (data.theme === 'light') {
          document.body.style.backgroundColor = '#FFFFFF';
          if (chart) {
            chart.update({
              chart: {
                backgroundColor: '#FFFFFF',
                plotBackgroundColor: '#FFFFFF'
              },
              xAxis: {
                gridLineColor: '#EEEEEE',
                lineColor: '#CCCCCC',
                tickColor: '#CCCCCC'
              },
              yAxis: [{
                gridLineColor: '#EEEEEE'
              }, {
                gridLineColor: '#EEEEEE'
              }]
            });
          }
        } else {
          // Reset to dark theme
          document.body.style.backgroundColor = '#000000';
          if (chart) {
            chart.update({
              chart: {
                backgroundColor: '#000000',
                plotBackgroundColor: '#000000'
              },
              xAxis: {
                gridLineColor: '#222222',
                lineColor: '#222222',
                tickColor: '#222222'
              },
              yAxis: [{
                gridLineColor: 'rgba(50, 50, 50, 0.25)'
              }, {
                gridLineColor: 'rgba(50, 50, 50, 0.25)'
              }]
            });
          }
        }
        break;
      }
    }
  } catch (e) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "error", message: e.message })
    );
  }
});

// Batch render for better performance
function renderPendingCandles() {
  animationFrameId = null;
  
  if (pendingCandles.length === 0 || !chart) return;
  
  // Get the last candle for adding point
  const lastItem = pendingCandles[pendingCandles.length - 1];
  
  // Update price candles
  chart.series[0].addPoint(lastItem.candle, false, seriesData.length > 150);
  
  // Update volume
  chart.series[1].addPoint(lastItem.volume, false, volumeData.length > 150);
  
  // Redraw chart once for all updates
  chart.redraw();
  
  // Clear pending candles
  seriesData.push(lastItem.candle);
  volumeData.push(lastItem.volume);
  pendingCandles = [];
  
  lastRenderTime = Date.now();
}

// Optimize for mobile devices
let mc = null;
try {
  // Add hammer.js for better touch handling if available
  if (typeof Hammer !== 'undefined') {
    mc = new Hammer(document.getElementById('container'));
    mc.get('pinch').set({ enable: true });
    mc.on('pinchstart', function() {
      chart.pointer.reset();
    });
  }
} catch (e) {
  console.log('Hammer.js not available');
}

// Memory management - clean up when page is hidden/unloaded
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    pendingCandles = [];
  }
});

// Prevent scroll-through on mobile
document.body.addEventListener('touchmove', function(e) {
  if (e.target.closest('#container')) {
    e.preventDefault();
  }
}, { passive: false });

// Handle WebView resize
window.addEventListener('resize', function() {
  if (chart) {
    chart.reflow();
  }
});
</script>
</body>
</html>`;
