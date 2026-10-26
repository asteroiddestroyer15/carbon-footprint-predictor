
let chartInstance = null;
let latestAssessment = null;

async function submitAssessment() {
    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const payload = {
        car_km: parseFloat(document.getElementById('car_km').value) || 0,
        electricity: parseFloat(document.getElementById('electricity').value) || 0,
        meat_meals: parseFloat(document.getElementById('meat_meals').value) || 0,
        flights: parseFloat(document.getElementById('flights').value) || 0
    };

    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('API communication error');
        }

        const data = await response.json();

        // Store the latest assessment for the detailed report
        latestAssessment = { ...data, inputs: payload };

        document.getElementById('resultsContainer').style.display = 'block';
        document.getElementById('currentTotal').innerText =
            `${data.current_total} kg CO₂e`;
        document.getElementById('futureTotal').innerText =
            `${data.future_prediction} kg CO₂e`;
        document.getElementById('aiPlan').innerText =
            data.ai_recommendations;

        renderChart(data.breakdown);

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to calculate emissions. Check your Flask backend and API key.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-leaf fa-sm"></i> Run AI Assessment';
    }
}


// Draw the emission breakdown chart
function renderChart(breakdownData) {
    const canvas = document.getElementById('emissionChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(breakdownData),
            datasets: [{
                data: Object.values(breakdownData),
                backgroundColor: [
                    '#e74a3b',
                    '#f6c23e',
                    '#1cc88a',
                    '#36b9cc'
                ],
                hoverBorderColor: 'rgba(234, 236, 244, 1)'
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });
}


// Open the detailed AI overview
function openDetailedOverview() {
    if (!latestAssessment) {
        alert('Run AI Assessment first to generate your detailed overview.');
        return;
    }

    const data = latestAssessment;
    const total = Number(data.current_total) || 0;
    const forecast = Number(data.future_prediction) || 0;

    // Sort categories from highest emissions to lowest
    const categories = Object.entries(data.breakdown || {})
        .map(([name, value]) => ({
            name,
            value: Number(value) || 0,
            share: total > 0
                ? ((Number(value) || 0) / total) * 100
                : 0
        }))
        .sort((a, b) => b.value - a.value);

    const hotspot = categories[0] || {
        name: 'Not available',
        value: 0,
        share: 0
    };

    document.getElementById('overviewCurrent').textContent =
        `${total.toFixed(2)} kg CO₂e`;

    document.getElementById('overviewForecast').textContent =
        `${forecast.toFixed(2)} kg CO₂e`;

    document.getElementById('overviewHotspot').textContent =
        hotspot.name;

    document.getElementById('overviewHotspotShare').textContent =
        `${hotspot.share.toFixed(1)}% of the current monthly total`;


    // Build category breakdown and progress bars
    const breakdown = document.getElementById('overviewBreakdown');
    breakdown.replaceChildren();

    categories.forEach(category => {
        const row = document.createElement('div');
        row.className = 'mb-3';

        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between mb-1';

        const name = document.createElement('span');
        name.className = 'font-weight-bold';
        name.textContent = category.name;

        const value = document.createElement('span');
        value.textContent =
            `${category.value.toFixed(2)} kg CO₂e · ${category.share.toFixed(1)}%`;

        header.append(name, value);

        const progress = document.createElement('div');
        progress.className = 'progress';
        progress.style.height = '10px';

        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.style.width =
            `${Math.min(100, Math.max(0, category.share))}%`;

        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuenow', category.share.toFixed(1));
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
        bar.setAttribute('aria-label', `${category.name} share`);

        progress.appendChild(bar);
        row.append(header, progress);
        breakdown.appendChild(row);
    });


    // Explain the difference between current and predicted emissions
    const change = forecast - total;
    const changePercent = total > 0
        ? (change / total) * 100
        : 0;

    const insights = document.getElementById('overviewInsights');
    insights.replaceChildren();

    const summary = document.createElement('p');

    if (change > 0) {
        summary.textContent =
            `The model forecasts an increase of ${change.toFixed(2)} kg CO₂e ` +
            `(${changePercent.toFixed(1)}%) next month compared with your current estimate.`;
    } else if (change < 0) {
        summary.textContent =
            `The model forecasts a decrease of ${Math.abs(change).toFixed(2)} kg CO₂e ` +
            `(${Math.abs(changePercent).toFixed(1)}%) next month compared with your current estimate.`;
    } else {
        summary.textContent =
            'The model forecasts roughly the same emissions next month.';
    }

    insights.appendChild(summary);


    // Show the lifestyle inputs used for the assessment
    const inputs = data.inputs || {};
    const inputList = document.createElement('ul');

    const inputItems = [
        `Daily car commute: ${inputs.car_km ?? 0} km`,
        `Monthly electricity: ${inputs.electricity ?? 0} kWh`,
        `Meat meals per week: ${inputs.meat_meals ?? 0}`,
        `Flights per year: ${inputs.flights ?? 0}`
    ];

    inputItems.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        inputList.appendChild(li);
    });

    insights.appendChild(inputList);


    // Highlight the largest category
    const priority = document.createElement('p');
    priority.className = 'mb-0';

    priority.textContent =
        `Suggested first focus: review your ${hotspot.name.toLowerCase()} emissions, ` +
        'since this is the largest category in the current estimate.';

    insights.appendChild(priority);


    // Reuse the recommendations already generated by Gemini
    document.getElementById('overviewAiPlan').textContent =
        data.ai_recommendations ||
        'No AI recommendations were returned for this assessment.';

    // Open the Bootstrap modal
    $('#overviewModal').modal('show');
}


// Download the detailed report as a text file
function downloadDetailedOverview() {
    if (!latestAssessment) return;

    const data = latestAssessment;
    const total = Number(data.current_total) || 0;
    const forecast = Number(data.future_prediction) || 0;

    const categories = Object.entries(data.breakdown || {})
        .map(([name, value]) => {
            const amount = Number(value) || 0;
            const percentage = total > 0
                ? ((amount / total) * 100).toFixed(1)
                : '0.0';

            return `${name}: ${amount.toFixed(2)} kg CO2e (${percentage}%)`;
        })
        .join('\n');

    const inputs = data.inputs || {};

    const report = [
        'DETAILED AI CARBON FOOTPRINT OVERVIEW',
        '=====================================',
        `Current monthly emissions: ${total.toFixed(2)} kg CO2e`,
        `Next-month model forecast: ${forecast.toFixed(2)} kg CO2e`,
        '',
        'CATEGORY BREAKDOWN',
        categories,
        '',
        'LIFESTYLE INPUTS',
        `Daily car commute: ${inputs.car_km ?? 0} km`,
        `Monthly electricity: ${inputs.electricity ?? 0} kWh`,
        `Meat meals per week: ${inputs.meat_meals ?? 0}`,
        `Annual flights: ${inputs.flights ?? 0}`,
        '',
        'GEMINI AI RECOMMENDATIONS',
        data.ai_recommendations || 'No recommendations returned.',
        '',
        'Note: Estimates depend on the emission factors and model used by this project.'
    ].join('\n');

    const blob = new Blob([report], {
        type: 'text/plain;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'carbon-footprint-overview.txt';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
