document.addEventListener('DOMContentLoaded', function() {

    const dashboardURL = 'https://dashboard.10up.com/blog/10upper/';
    let dashboardId, harvestId, harvestApiKey;
    var timesheet = {};

    chrome.storage.sync.get({
        dashboardId: '',
        harvestId: '',
        harvestApiKey: ''
    }, function(items) {
        dashboardId = items.dashboardId;
        harvestId = items.harvestId;
        harvestApiKey = items.harvestApiKey;

        checkDashboard();
    });

    const saveOptions = function() {
        dashboardId = document.getElementById('dashboard-id').value;
        harvestId = document.getElementById('harvest-id').value;
        harvestApiKey = document.getElementById('harvest-api-key').value;
        chrome.storage.sync.set({
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

    const getTimesheet = function() {

        var curr = new Date(); // get current date
        var first = curr.getDate() - curr.getDay() + 1; // First day is the day of the month - the day of the week
        var last = first + 6; // last day is the first day + 6

        var firstday = new Date(curr.setDate(first));
        var lastday = new Date(curr.setDate(last));

        const startDate = firstday.getFullYear() + '-' + ( ( firstday.getMonth() + 1 ) < 10 ? '0' : '' ) + ( firstday.getMonth() + 1 ) + '-' + ( ( firstday.getDate() < 10 ) ? '0' : '' ) + firstday.getDate();
        const endDate   = lastday.getFullYear() + '-' + ( ( lastday.getMonth() + 1 ) < 10 ? '0' : '' ) + ( lastday.getMonth() + 1 ) + '-' + ( ( lastday.getDate() < 10 ) ? '0' : '' ) + lastday.getDate();

        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.addEventListener("readystatechange", function() {
            if( this.readyState === 4 ) {
                const timeEntries = JSON.parse( this.responseText );
                timeEntries.time_entries.forEach( function( el ) {
                    if ( typeof timesheet['cp' + el.client.id + '-' + el.project.id ] !== 'undefined' ) {
                        timesheet['cp' + el.client.id + '-' + el.project.id ].hours = timesheet['cp' + el.client.id + '-' + el.project.id ].hours + parseFloat( el.rounded_hours );
                    } else {
                        timesheet['cp' + el.client.id + '-' + el.project.id ] = {
                            'client': el.client.name,
                            'client_id': el.client.id,
                            'project_id': el.project.id,
                            'project': el.project.name,
                            'hours': parseFloat( el.rounded_hours )
                        };
                    }
                } );

                chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
                    const stringTimesheet = JSON.stringify( timesheet );
                    chrome.tabs.executeScript( tabs[0].id, {
                        'code': `parseTimesheet(${stringTimesheet})`
                    } );
                } );
            }
        });

        xhr.open("GET", "https://api.harvestapp.com/v2/time_entries?from=" + startDate + '&to=' + endDate );
        xhr.setRequestHeader("Harvest-Account-Id", harvestId );
        xhr.setRequestHeader("authorization", 'Bearer ' + harvestApiKey );

        xhr.send();
    }

    const checkDashboard = function() {
        chrome.tabs.query( {
            'active': true,
            'currentWindow': true
        }, function( tabs ) {
            const regex = new RegExp( dashboardURL );
            if( ! regex.test( tabs[0].url ) ) {
                chrome.tabs.create( { 'url': dashboardURL + dashboardId + '/' } );
            }
        } );
    };

    document.getElementById( 'save' ).addEventListener( 'click', saveOptions );
    document.getElementById( 'dashboard-button' ).addEventListener( 'click', getTimesheet );

}, false);