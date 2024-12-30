document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('dropdown');
    const graphContainer = document.getElementById('graphContainer');
    const tableContainer = document.getElementById('tableContainer');
    const statsContainer = document.getElementById('statsContainer');
    let dataset = [];

    // Hide all components except the dropdown initially
    graphContainer.classList.add('hidden');
    tableContainer.classList.add('hidden');
    statsContainer.classList.add('hidden');

    // Load the CSV file on page load
    const loadCSV = () => {
        fetch('Data2.csv') // Replace 'DATA.csv' with your actual CSV filename
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        dataset = results.data;
                        populateDropdown();
                    },
                });
            })
            .catch(error => console.error('Error loading CSV:', error));
    };

    // Populate the dropdown with FuelType options
    const populateDropdown = () => {
        const fuelTypes = [...new Set(dataset.map(row => row.FuelType))];
        dropdown.innerHTML = '<option value="" disabled selected>Select FuelType</option>';
        fuelTypes.forEach(fuelType => {
            const option = document.createElement('option');
            option.value = fuelType;
            option.textContent = fuelType;
            dropdown.appendChild(option);
        });
    };
    

    // Calculate and display average mileage and CO2 emission
    const calculateStats = (filteredData) => {
        // Calculate average mileage
        const avgMileage = (filteredData.reduce((sum, row) => sum + parseFloat(row.Mileage), 0) / filteredData.length).toFixed(2);

        // Calculate average emission
        const avgEmission = (filteredData.reduce((sum, row) => sum + parseFloat(row.Emission), 0) / filteredData.length).toFixed(2);

        // Display the stats in the statsContainer
        statsContainer.innerHTML = `
            <h3>AVG EFFICIENCY: ${avgMileage} km/L</h3>
            <h3>AVG CO2 EMISSION: ${avgEmission} g/km</h3>
        `;
        statsContainer.classList.remove('hidden');
    };

    // Find the optimal value for a given parameter
    const findOptimalValue = (filteredData, key) => {
        const counts = filteredData.reduce((acc, row) => {
            acc[row[key]] = (acc[row[key]] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
    };

    // Populate the table
    const populateTable = (filteredData) => {
        const table = document.getElementById('optimumTable');
        table.innerHTML = ''; // Clear previous table content

        const rows = [
            { label: 'Displacement', key: 'Displacement' },
            { label: 'Cylinders', key: 'Cylinders' },
            { label: 'BodyType', key: 'BodyType' },
        ];

        rows.forEach(row => {
            const tr = document.createElement('tr');
            const tdLabel = document.createElement('td');
            tdLabel.textContent = row.label;
            tr.appendChild(tdLabel);

            const tdValue = document.createElement('td');
            tdValue.textContent = findOptimalValue(filteredData, row.key);
            tr.appendChild(tdValue);

            table.appendChild(tr);
        });

        // Calculate the average mileage for the AVG MILEAGE row
        const avgMileageRow = document.createElement('tr');
        const tdAvgLabel = document.createElement('td');
        tdAvgLabel.textContent = 'AVG MILEAGE';
        avgMileageRow.appendChild(tdAvgLabel);

        const tdAvgValue = document.createElement('td');
        const avgMileage = (filteredData.reduce((sum, row) => sum + parseFloat(row.Mileage), 0) / filteredData.length).toFixed(2);
        tdAvgValue.textContent = `${avgMileage} km/L`;
        avgMileageRow.appendChild(tdAvgValue);

        table.appendChild(avgMileageRow);

        // Find the optimal displacement
        const optimalDisplacement = findOptimalValue(filteredData, 'Displacement');
        
        // Find the corresponding emission for the optimal displacement
        const correspondingEmission = filteredData.find(row => row.Displacement === optimalDisplacement)?.Emission || 'N/A';
        
        // Add the CO2 Emission row
        const co2EmissionRow = document.createElement('tr');
        const tdCo2Label = document.createElement('td');
        tdCo2Label.textContent = 'CO2 Emission';
        co2EmissionRow.appendChild(tdCo2Label);

        const tdCo2Value = document.createElement('td');
        tdCo2Value.textContent = `${correspondingEmission} g/km`; 
        co2EmissionRow.appendChild(tdCo2Value);

        table.appendChild(co2EmissionRow);
    };

    // Plot graphs based on selected FuelType
    const plotGraphs = (fuelType) => {
        const filteredData = dataset.filter(row => row.FuelType === fuelType);

        // Calculate and display average stats
        calculateStats(filteredData);

        // Prepare data for Displacement vs Mileage
        Plotly.newPlot('graph1', [{
            x: filteredData.map(row => parseFloat(row.Displacement)),
            y: filteredData.map(row => parseFloat(row.Mileage)),
            type: 'box',
            name: 'Displacement vs Mileage',
        }], {
            title: 'Displacement vs Efficiency(km/L)',
            xaxis: { title: '<---Displacement--->' },
            yaxis: { title: '<---Efficiency--->' },
        });

        // Prepare data for Cylinders vs Mileage
        const xCylinders = [...new Set(filteredData.map(row => parseInt(row.Cylinders)))];
        const yCylinders = xCylinders.map(x =>
            filteredData.find(row => parseInt(row.Cylinders) === x)?.Mileage || 0
        );

        Plotly.newPlot('graph2', [{
            x: xCylinders,
            y: yCylinders,
            mode: 'lines+markers+text',
            line: { shape: 'linear', color: 'green' },
            marker: { size: 8, symbol: 'circle', color: 'blue' },
            name: 'Cylinders vs Mileage',
            text: yCylinders,
            textposition: 'top center',
        }], {
            title: 'Cylinders vs Efficiency(km/L)',
            xaxis: { title: '<---Cylinders--->' },
            yaxis: { title: '<---Efficiency--->' },
        });

        // Prepare data for BodyType vs Mileage
        const xBodyType = [...new Set(filteredData.map(row => row.BodyType))];
        const yBodyType = xBodyType.map(x =>
            filteredData.find(row => row.BodyType === x)?.Mileage || 0
        );

        Plotly.newPlot('graph3', [{
            x: xBodyType,
            y: yBodyType,
            type: 'bar',
            name: 'BodyType vs Mileage',
            marker: { color: 'green' }
        }], {
            title: 'BodyType vs Efficiency(km/L)',
            xaxis: { title: '<---BodyType--->' },
            yaxis: { title: '<---Efficiency--->' },
        });

        // Grouping data by Displacement and calculating the average Emission for each unique Displacement
        const displacementMap = new Map();
        filteredData.forEach(row => {
            const displacement = parseFloat(row.Displacement) || 0;
            const emission = parseFloat(row.Emission) || 0;
            
            // If the displacement is already in the map, add the emission to the list, otherwise, initialize it
            if (displacementMap.has(displacement)) {
                displacementMap.get(displacement).push(emission);
            } else {
                displacementMap.set(displacement, [emission]);
            }
        });

        // Now calculate the average emission for each unique displacement
        const xDisplacement = [...displacementMap.keys()];
        const yEmission = xDisplacement.map(displacement => {
            const emissions = displacementMap.get(displacement);
            const sum = emissions.reduce((total, value) => total + value, 0);
            return sum / emissions.length; // Average Emission
        });

        // Create vertical lines from x-axis (y=0) to each point
        const verticalLines = xDisplacement.map((displacement, index) => ({
            x: [displacement, displacement],
            y: [0, yEmission[index]],
            type: 'scatter',
            mode: 'lines',
            line: { color: 'blue', width: 1 }
        }));

        // Take every second value for the x-axis tick marks
        const xDisplacementTicks = xDisplacement.filter((_, index) => index % 2 === 0);  // Every second value

        Plotly.newPlot('graph4', [
            ...verticalLines, // Add the vertical lines traces
            {
                x: xDisplacement,
                y: yEmission,
                mode: 'markers',
                type: 'scatter',
                name: 'Displacement vs Emission',
                marker: { color: 'blue' }
            }
        ], {
            title: 'CO2 Emission(g/Km)',
            xaxis: {
                title: '<---Displacement--->',
                tickvals: xDisplacementTicks,  // Only every second value for tick marks
                ticktext: xDisplacementTicks.map(String),  // Show these values as labels
                tickangle: 45,  // Rotate the tick labels for better readability
                showgrid: true,  // Optional: display grid lines
                zeroline: true,  // Optional: draw the zero line
            },
            yaxis: { title: '<---Emission--->' },
            showlegend: false  // Hides legend if you don't need it
        });

        // Populate the table UI
        populateTable(filteredData);
        tableContainer.classList.remove('hidden');
    };

    dropdown.addEventListener('change', (event) => {
        const selectedFuelType = event.target.value;
        if (selectedFuelType) {
            graphContainer.classList.remove('hidden');
            plotGraphs(selectedFuelType);
        }
    });

    loadCSV();
});
