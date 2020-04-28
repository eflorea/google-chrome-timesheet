document.addEventListener('DOMContentLoaded', function() {

    let dashboardId, harvestId, harvestApiKey;

    chrome.storage.local.get( {
        dashboardId: '',
        harvestId: '',
        harvestApiKey: ''
    }, function(items) {
        dashboardId = items.dashboardId;
        harvestId = items.harvestId;
        harvestApiKey = items.harvestApiKey;

        document.getElementById('dashboard-id').value    = dashboardId;
        document.getElementById('harvest-id').value      = harvestId;
        document.getElementById('harvest-api-key').value = harvestApiKey;
    } );

    const saveOptions = function() {
        dashboardId = document.getElementById('dashboard-id').value;
        harvestId = document.getElementById('harvest-id').value;
        harvestApiKey = document.getElementById('harvest-api-key').value;
        chrome.storage.local.set({
            dashboardId: dashboardId,
            harvestId: harvestId,
            harvestApiKey: harvestApiKey,
        }, function() {
            // Update status to let user know options were saved.
            let status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(function() {
                status.textContent = '';
            }, 750);
        });
    };

    document.getElementById( 'save' ).addEventListener( 'click', saveOptions );

}, false);