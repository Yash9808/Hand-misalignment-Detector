import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HandData } from '../types/HandData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CorrelationChartProps {
  handData?: HandData;
  handIndex: number;
}

const CorrelationChart: React.FC<CorrelationChartProps> = ({ handData, handIndex }) => {
  // 🧠 Combine finger and inter-finger angles
  const chartData = useMemo(() => {
    if (!handData) return { labels: [], datasets: [] };

    const fingerNames = Object.keys(handData.fingerAngles);
    const fingerValues = Object.values(handData.fingerAngles);

    const pairNames = handData.fingerPairAngles
      ? Object.keys(handData.fingerPairAngles)
      : [];
    const pairValues = handData.fingerPairAngles
      ? Object.values(handData.fingerPairAngles)
      : [];

    return {
      labels: [...fingerNames, ...pairNames],
      datasets: [
        {
          label: 'Angles (Bend + Spread)',
          data: [...fingerValues, ...pairValues],
          borderColor: handIndex === 0 ? '#3b82f6' : '#10b981',
          backgroundColor: handIndex === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4
        }
      ]
    };
  }, [handData, handIndex]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            return `${context.label}: ${Math.round(context.parsed.y)}°`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(107, 114, 128, 0.3)' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        beginAtZero: true,
        max: 180,
        grid: { color: 'rgba(107, 114, 128, 0.3)' },
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => `${value}°`
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      intersect: false
    }
  };

  // 📊 Prepare angle matrix for list display
  const correlationMatrix = useMemo(() => {
    if (!handData) return null;

    const fingers = Object.entries(handData.fingerAngles).map(([key, angle]) => ({
      label: key,
      angle,
      normalized: angle / 180
    }));

    const pairs = handData.fingerPairAngles
      ? Object.entries(handData.fingerPairAngles).map(([key, angle]) => ({
          label: key.replace('_', '–'),
          angle,
          normalized: angle / 180
        }))
      : [];

    return [...fingers, ...pairs];
  }, [handData]);

  if (!handData) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">👋</div>
          <p>No hand detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* 📈 Line Chart */}
      <div className="h-32 mb-4">
        <Line data={chartData} options={options} />
      </div>

      {/* 🧠 Angle Matrix */}
      {correlationMatrix && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Current Angles</h4>
          <div className="grid grid-cols-1 gap-1">
            {correlationMatrix.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-2 rounded-full"
                    style={{
                      backgroundColor: `hsl(${(1 - item.normalized) * 120}, 70%, 50%)`
                    }}
                  />
                  <span className="text-xs text-gray-300 w-8 text-right">
                    {Math.round(item.angle)}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrelationChart;
