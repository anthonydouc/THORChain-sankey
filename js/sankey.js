google.charts.load('current', { 'packages': ['sankey'] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {

    var json = $.ajax({
        url: "https://api.flipsidecrypto.com/api/v2/queries/18af3d33-c935-4148-9f4f-f30c28d3dcfb/data/latest",
        dataType: "json",
        success: function (jsonData) {
            var data = new google.visualization.DataTable();
            var selected_asset = document.getElementById("selected_asset").value;
            var direction = document.getElementById("direction").value;
            var volume_type = document.getElementById("volume_type").value;
            var include_synths = document.getElementById("include_synths").value;

            data.addColumn('string', "FROM");
            data.addColumn('string', "TO");
            data.addColumn('number', "WEIGHT");
            data.addColumn({ type: 'string', role: 'tooltip' });

            var amounts = [];
            var included = [];
            var tooltips = [];

            // first determine which entries are included based on selected filters.
            for (var i = 0; i < jsonData.length; i++) {
                from = jsonData[i].FROM_ASSET;
                to = jsonData[i].TO_ASSET;
                from_type = jsonData[i].FROM_TYPE;
                to_type = jsonData[i].TO_TYPE;

                var include = false;
                var asset_received = (from != selected_asset) && (to == selected_asset);
                var asset_offered = (from == selected_asset) && (to != selected_asset);

                var inc_synths = (include_synths == 'Assets & Synths') || (include_synths == 'Synths only')
                var inc_assets = (include_synths == 'Assets & Synths') || (include_synths == 'Assets only')

                var offered_type_inc = ((to_type == 'synth') && inc_synths) || ((to_type == 'asset') & inc_assets);

                var received_type_inc = ((from_type == 'synth') && inc_synths) || (from_type == 'asset' & inc_assets);

                if ((direction == "Received") && asset_received && received_type_inc) {
                    include = true
                }
                else if ((direction == "Offered") && asset_offered && offered_type_inc) {
                    include = true
                }

                if (include) {
                    amounts.push(parseFloat(jsonData[i].AMOUNT))
                    included.push(true)
                }
                else {
                    included.push(false)
                };

            };

            // calculate maximum value of selected entries. This is used to enforce a minimum weight on very small entries.
            max = Math.max(...amounts);

            for (var i = 0; i < jsonData.length; i++) {
                if (included[i]) {

                    from = jsonData[i].FROM_ASSET;
                    to = jsonData[i].TO_ASSET;
                    from_type = jsonData[i].FROM_TYPE;
                    to_type = jsonData[i].TO_TYPE;

                    if (volume_type == 'Total USD volume') {
                        amount = jsonData[i].AMOUNT;
                        amount_currency = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 12 }).format(amount)
                    }
                    else if (volume_type == 'Total RUNE volume') {
                        amount = jsonData[i].AMOUNT_RUNE;
                        amount_currency = Intl.NumberFormat('en-US', { maximumSignificantDigits: 12 }).format(amount)
                    }

                    tooltip = '<div style="margin: 5px;"><p style=" width:150px;"><strong>' + from + '</strong> to <strong>' + to + '</strong></p><span style="color:#ffffff">' + volume_type + ': ' + amount_currency + '</span></div>';
                    
                    data.addRow([from, to, Math.max(max * 0.001, amount), tooltip]);
                };
            };

            // Sets chart options.
            var options = {
                tooltip: { isHtml: true },
                sankey: {
                    iterations: 2,
                    link: {
                        colorMode: 'gradient',
                        color: { stroke: '#00deff', strokeWidth: 0.05 }
                    },
                    node: {
                        width: 20,
                        nodePadding: 12,
                        label: {
                            color: '#FFFFFF'
                        }
                    }
                },
            };

            // Instantiates and draws our chart, passing in some options.
            var chart = new google.visualization.Sankey(document.getElementById('sankey_from'));
            chart.draw(data, options);
        }
    });
}

window.onload = (function () {
    var json = $.ajax({
        url: "https://api.flipsidecrypto.com/api/v2/queries/044ea8ff-9093-49d2-b440-045ea4a83597/data/latest",
        dataType: "json",
        success: function (jsonData) {
            options = jsonData[0]['ASSETS'].split(',')

            select = document.getElementById("selected_asset");
            for (var i = 0; i <= options.length - 1; i++) {
                option = document.createElement("option");
                option.innerHTML = options[i];
                select.appendChild(option);
            }
        }
    });

});
