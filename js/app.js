(function () {
  const el = document.getElementById('trendsChart');
  if (!el) return;

  const TOKENS = {
    blue: '#3366FF',
    gray: '#C5C9D5',
    tick: '#9CA3AF',
    grid: 'rgba(15,23,42,0.06)',
    fillTop: 'rgba(76,111,255,0.20)',
    fillBottom: 'rgba(76,111,255,0.00)',
    pointOuter: 'rgba(51,102,255,0.20)',
  };

  // x축 0~22 유지
  const labels = Array.from({ length: 23 }, (_, i) => i);

  // 원본 데이터
  const today = [6,12,17,16,15,14,18,33,22,16,11,8,6,12,28,38,41,39,36,32,28,25,22];
  const yday  = [10,12,14,13,12,11,16,24,26,22,18,14,12,18,24,36,33,28,26,24,26,30,32];

  // 19에서 그래프 종료
  const CUTOFF = 19;
  const todayMasked = today.map((v, i) => (i <= CUTOFF ? v : null));
  const ydayMasked  = yday.map((v, i) => (i <= CUTOFF ? v : null));

  // 포커스 포인트
  const focusIndex = 15;

  // 포인트 가이드 + 외부 툴팁
  const GuideAndRing = {
    id: 'GuideAndRing',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      const pt = chart.getDatasetMeta(0).data[focusIndex];
      if (!pt) return;

      // 세로 가이드
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pt.x, chartArea.top);
      ctx.lineTo(pt.x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();

      // 링
      ctx.save();
      ctx.fillStyle = TOKENS.pointOuter;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = TOKENS.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // 외부 툴팁
      const value = today[focusIndex];
      const padX = 10, boxH = 30;
      const text = String(value);
      ctx.save();
      ctx.font = '600 14px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      const w = ctx.measureText(text).width + padX * 2;
      const x = pt.x - w / 2;
      const y = pt.y - 28 - boxH;

      ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;

      roundRect(ctx, x, y, w, boxH, 6); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pt.x - 8, y + boxH); ctx.lineTo(pt.x + 8, y + boxH); ctx.lineTo(pt.x, y + boxH + 9);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#111827'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x + padX, y + boxH / 2);
      ctx.restore();

      function roundRect(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y,     x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x,     y + h, radius);
        ctx.arcTo(x,     y + h, x,     y,     radius);
        ctx.arcTo(x,     y,     x + w, y,     radius);
        ctx.closePath();
      }
    }
  };

  // y축 숫자를 그리드선 "조금 위"에 직접 그려주는 플러그인 (겹침/잘림 방지)
  const YTickAbove = {
    id: 'YTickAbove',
    afterDraw(chart) {
      const y = chart.scales.y;
      if (!y) return;
      const ctx = chart.ctx;

      ctx.save();
      ctx.fillStyle = TOKENS.tick;
      ctx.font = '12px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';

      const lift = 6;          // 수평선보다 위로 올리는 픽셀
      const x = y.right - 12;  // 우측 안쪽으로 살짝 이동(잘림 방지)

      y.ticks.forEach((t, i) => {
        // 최상단 라벨은 살짝만(= 2px) 내려서 클리핑 방지
        const isTop = (i === 0);
        const py = y.getPixelForTick(i) - (isTop ? 2 : lift);
        ctx.fillText(t.value, x, py);
        });
      ctx.restore();
    }
  };

  new Chart(el, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Today',
          data: todayMasked,
          borderColor: TOKENS.blue,
          backgroundColor: (ctxArg) => {
            const area = ctxArg.chart.chartArea;
            if (!area) return TOKENS.fillTop;        // 초기 렌더 보호
            const g = ctxArg.chart.ctx.createLinearGradient(area.left, 0, area.right, 0); // 좌→우
            g.addColorStop(0, TOKENS.fillTop);
            g.addColorStop(1, TOKENS.fillBottom);
            return g;
          },
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 0,
          fill: true,
          spanGaps: false
        },
        {
          label: 'Yesterday',
          data: ydayMasked,
          borderColor: TOKENS.gray,
          borderWidth: 1.5,
          borderDash: [],         // 범례/그래프 모두 실선
          tension: 0.4,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 16, right: 44, bottom: 6, left: 6 } }, // 우측 라벨 여유
      plugins: {
        legend: { display: false }, // 범례는 HTML로
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: TOKENS.tick,
            font: { size: 12, family: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }
          }
        },
        y: {
          position: 'right',
          min: 0,
          max: 60,
          ticks: { display: false },     // 기본 라벨은 숨김 (플러그인으로 그림)
          grid: {
            color: TOKENS.grid,
            lineWidth: 1,
            drawBorder: false           // 세로축 라인 제거
          },
          border: { display: false }     // 추가로 보더 차단
        }
      },
      elements: {
        line: { borderJoinStyle: 'round', borderCapStyle: 'round' }
      },
      animation: false
    },
    plugins: [GuideAndRing, YTickAbove]
  });
})();
