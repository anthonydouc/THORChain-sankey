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