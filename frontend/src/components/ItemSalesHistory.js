import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import dataService from '../services/DataService';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const ItemSalesHistory = ({ itemId, itemName }) => {
    const [salesHistory, setSalesHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalesHistory = async() => {
            try {
                setLoading(true);
                const history = await dataService.getItemSalesHistory(itemId);
                setSalesHistory(history);
            } catch (err) {
                setError('Failed to load sales history');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (itemId) {
            fetchSalesHistory();
        }
    }, [itemId]);

    // Prepare chart data
    const prepareChartData = () => {
        if (!salesHistory || salesHistory.length === 0) return null;

        // Group by date
        const groupedByDate = salesHistory.reduce((acc, record) => {
            const date = record.timestamp.split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    quantity: 0,
                    revenue: 0
                };
            }
            acc[date].quantity += record.quantity;
            acc[date].revenue += record.totalPrice;
            return acc;
        }, {});

        const chartData = Object.values(groupedByDate).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        return {
            labels: chartData.map(item => item.date),
            datasets: [{
                    label: 'Units Sold',
                    data: chartData.map(item => item.quantity),
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue (₹)',
                    data: chartData.map(item => item.revenue),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    yAxisID: 'y1'
                }
            ]
        };
    };

    const chartData = prepareChartData();

    if (loading) return ( <
        div className = "item-sales-history loading" >
        <
        div className = "loading-spinner" > < /div> <
        p > Loading sales history... < /p> <
        /div>
    );

    if (error) return ( <
        div className = "item-sales-history error" >
        <
        p className = "error-message" > Error: { error } < /p> <
        /div>
    );

    if (!salesHistory || salesHistory.length === 0) return ( <
        div className = "item-sales-history empty" >
        <
        p > No sales history available
        for this item < /p> <
        /div>
    );

    // Calculate totals
    const totalQuantity = salesHistory.reduce((sum, record) => sum + record.quantity, 0);
    const totalRevenue = salesHistory.reduce((sum, record) => sum + (record.totalPrice || 0), 0);
    const averagePrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;

    return ( <
        div className = "item-sales-history" >
        <
        h3 > { itemName || 'Item' }
        Sales History < /h3>

        <
        div className = "sales-summary" >
        <
        div className = "summary-card" >
        <
        div className = "summary-value" > { totalQuantity } < /div> <
        div className = "summary-label" > Total Units Sold < /div> <
        /div> <
        div className = "summary-card" >
        <
        div className = "summary-value" > { formatCurrency(totalRevenue) } <
        /div> <
        div className = "summary-label" > Total Revenue < /div> <
        /div> <
        div className = "summary-card" >
        <
        div className = "summary-value" > { formatCurrency(averagePrice) } <
        /div> <
        div className = "summary-label" > Average Price < /div> <
        /div> <
        /div>

        <
        div className = "sales-chart-container" > {
            chartData ? ( <
                Line data = { chartData }
                options = {
                    {
                        responsive: true,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Units Sold'
                                },
                                beginAtZero: true
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Revenue (₹)'
                                },
                                grid: {
                                    drawOnChartArea: false
                                },
                                beginAtZero: true
                            }
                        }
                    }
                }
                />
            ) : ( <
                div className = "no-chart-data" >
                <
                p > Not enough data to display chart < /p> <
                /div>
            )
        } <
        /div>

        <
        div className = "sales-table-container" >
        <
        h4 > Recent Transactions < /h4> <
        table className = "sales-table" >
        <
        thead >
        <
        tr >
        <
        th > Date < /th> <
        th > Quantity < /th> <
        th > Unit Price < /th> <
        th > Total < /th> <
        /tr> <
        /thead> <
        tbody > {
            salesHistory.map((record, index) => ( <
                tr key = { index } >
                <
                td > { formatDate(record.timestamp, true) } < /td> <
                td > { record.quantity }
                units < /td> <
                td > { formatCurrency(record.unitPrice) } < /td> <
                td > { formatCurrency(record.totalPrice) } < /td> <
                /tr>
            ))
        } <
        /tbody> <
        /table> <
        /div> <
        /div>
    );
};

export default ItemSalesHistory;