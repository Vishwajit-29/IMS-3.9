import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const SalesChart = ({ data, timeRange }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            // If a chart instance exists, destroy it before creating a new one
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Prepare data based on timeRange
            const labels = data.map(item => {
                if (timeRange === 'Weekly') return item.day;
                if (timeRange === 'Monthly') return item.day;
                if (timeRange === 'Yearly') return item.month;
                return '';
            });

            const salesData = data.map(item => item.sales || 0);
            const stockData = data.map(item => item.stockAdded || 0);

            // Get the context and create chart
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new ChartJS(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                            label: 'Sales',
                            data: salesData,
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: function(context) {
                                const chart = context.chart;
                                const { ctx, chartArea } = chart;

                                if (!chartArea) {
                                    return 'rgba(54, 162, 235, 0.8)';
                                }

                                const gradient = ctx.createLinearGradient(
                                    0, chartArea.bottom, 0, chartArea.top
                                );
                                gradient.addColorStop(0, 'rgba(54, 162, 235, 0)');
                                gradient.addColorStop(0.5, 'rgba(54, 162, 235, 0.3)');
                                gradient.addColorStop(1, 'rgba(54, 162, 235, 0.8)');

                                return gradient;
                            },
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: 'rgb(54, 162, 235)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            borderWidth: 3
                        },
                        {
                            label: 'Stock Added',
                            data: stockData,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgb(75, 192, 192)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: 'rgb(75, 192, 192)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#666'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.2)'
                            },
                            ticks: {
                                color: '#666',
                                callback: function(value) {
                                    if (value % 1 === 0) {
                                        // Use Indian Rupee symbol instead of dollar
                                        return '₹' + value;
                                    }
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#666',
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 6,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        // Use Indian Rupee symbol for the tooltip values
                                        label += '₹' + context.parsed.y + ' units';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    animations: {
                        tension: {
                            duration: 1000,
                            easing: 'linear',
                            from: 0.2,
                            to: 0.4
                        }
                    }
                }
            });
        }
    }, [data, timeRange]);

    return ( <
            div className = "chart-container" >
            <
            canvas ref = { chartRef } > < /canvas> {
            (!data || data.length === 0) && ( <
                div className = "no-data-message" >
                <
                p > No sales data available
                for this period < /p> < /
                div >
            )
        } <
        /div>
);
};

export default SalesChart;