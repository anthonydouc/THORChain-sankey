google.charts.load('current', { 'packages': ['sankey'] });
google.charts.setOnLoadCallback(drawChart);


function trunc_values(swaps, vol_field) {

    var amounts = [];
    for (var i = 0; i < swaps.length; i++) {
        amounts.push(swaps[i][vol_field])
    }

    // calculate maximum value of selected entries. This is used to enforce a minimum weight on very small entries.
    max = Math.max(...amounts);

    for (var i = 0; i < swaps.length; i++) {
        swaps[i][vol_field] = Math.max(max * 0.01, swaps[i][vol_field]);
    };

    return swaps
}

function filter_by_asset(swaps, selected_asset, direction, include_synths) {
    var swaps_flt = [];

    for (var i = 0; i < swaps.length; i++) {

        from = swaps[i].FROM_ASSET;
        to = swaps[i].TO_ASSET;

        from_type = swaps[i].FROM_TYPE;
        to_type = swaps[i].TO_TYPE;

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
            swaps_flt.push(swaps[i])
        }

    };

    return swaps_flt
}


function filter_by_date(swaps, mindate, maxdate) {
    // keep only data between min & max dates.
    // TODO: confirm time zones are consistent between calendar and flipside.
    swaps_flt = [];

    for (var i = 0; i < swaps.length; i++) {
        var day = new Date(swaps[i]['DAY'])
        if ((day >= mindate) && (day <= maxdate)) {
            swaps_flt.push(swaps[i])
        }
    }

    return swaps_flt
}

function agg_by_asset(swaps, agg_field, val_field) {

    var result = [];

    swaps.reduce(function (res, value) {

        if (!res[value[agg_field]]) {
            res[value[agg_field]] = { [agg_field]: value[agg_field], [val_field]: 0 };
            result.push(res[value[agg_field]])
        }
        res[value[agg_field]][val_field] += value[val_field];
        return res;
    }, {});

    return result
}

function drawChart() {

    var json = $.ajax({
        url: "https://api.flipsidecrypto.com/api/v2/queries/816e3cff-997c-4151-8300-e5e0f97a39de/data/latest",
        dataType: "json",
        success: function (jsonData) {

            var data = new google.visualization.DataTable();
            var selected_asset = document.getElementById("selected_asset").value;
            var direction = document.getElementById("direction").value;
            var volume_type = document.getElementById("volume_type").value;
            var include_synths = document.getElementById("include_synths").value;

            const calendar = document.querySelector('#daterange');
            var mindate = new Date(calendar.bulmaCalendar.date['start']);
            var maxdate = new Date(calendar.bulmaCalendar.date['end']);

            data.addColumn('string', "FROM");
            data.addColumn('string', "TO");
            data.addColumn('number', "WEIGHT");
            data.addColumn({ type: 'string', role: 'tooltip' });

            if (volume_type == 'Total USD volume') {
                var vol_field = 'AMOUNT';
            }
            else {
                var vol_field = 'AMOUNT_RUNE';
            }

            if (direction == "Received") {
                var agg_field = 'FROM_ASSET';
            }
            else {
                var agg_field = 'TO_ASSET';
            }

            // filter by date.
            swaps = filter_by_date(jsonData, mindate, maxdate)

            // filter by asset type and direction.
            swaps = filter_by_asset(swaps, selected_asset, direction, include_synths, volume_type)

            // aggregate over days.
            swaps = agg_by_asset(swaps, agg_field, vol_field)

            // truncate to enforce minimum size of edges.
            swaps = trunc_values(swaps, vol_field)

            for (var i = 0; i < swaps.length; i++) {
                if (direction == "Received") {
                    to = selected_asset
                    from = swaps[i].FROM_ASSET;
                }
                else {
                    to = swaps[i].TO_ASSET;
                    from = selected_asset
                }

                amount = swaps[i][vol_field]

                if (volume_type == 'Total USD volume') {
                    amount_currency = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 12 }).format(amount)
                }
                else if (volume_type == 'Total RUNE volume') {
                    amount_currency = Intl.NumberFormat('en-US', { maximumSignificantDigits: 12 }).format(amount)
                }

                tooltip = '<div style="margin: 5px;"><p style=" width:150px;"><strong>' + from + '</strong> to <strong>' + to + '</strong></p><span style="color:#ffffff">' + volume_type + ': ' + amount_currency + '</span></div>';

                data.addRow([from, to, amount, tooltip]);
            };

            // Set chart options.
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


            if (swaps.length == 0) {
                document.getElementById('sankey_from').innerHTML = '<p class="has-text-weight-semibold"> No swaps occured in the selected date range.</p>'
            }
            else {
                // Instantiate and draw chart, passing in some options.
                var chart = new google.visualization.Sankey(document.getElementById('sankey_from'));
                chart.draw(data, options);
            }
        }
    });
}

