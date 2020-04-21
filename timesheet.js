document.addEventListener('DOMContentLoaded', function() {

    const dashboardURL = 'https://dashboard.10up.com/blog/10upper/';
    let dashboardId, harvestId, harvestApiKey;
    var timesheet = {};
    let startOfWeek = '';

    chrome.storage.local.get({
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

    const setToMonday = function( date ) {
        let day = date.getDay() || 7;
        console.log( day );
        if ( day === 6 ) {
            date.setHours( 24 );
        } else {
            if ( day !== 1 && day !== 7 ) {
                date.setHours(-24 * (day - 1));
            }
        }
        console.log( date );
        return date;
    };

    const formatDate = function( date ) {
         return date.getFullYear() + '-' + ( ( date.getMonth() + 1 ) < 10 ? '0' : '' ) + ( date.getMonth() + 1 ) + '-' + ( ( date.getDate() < 10 ) ? '0' : '' ) + date.getDate();
    };

    const getTimesheet = function() {

        const startDate = moment( startOfWeek ).startOf('isoWeek').format( "YYYY-MM-DD" )
        const endDate   = moment( startOfWeek ).add(1, 'weeks').startOf('week').format( "YYYY-MM-DD" )

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
                    const weekStart = JSON.stringify( startOfWeek );
                    chrome.tabs.executeScript( tabs[0].id, {
                        'code': `parseTimesheet(${stringTimesheet},${weekStart})`
                    } );
                } );
            }
        });

        xhr.open("GET", "https://api.harvestapp.com/v2/time_entries?from=" + startDate + '&to=' + endDate );
        xhr.setRequestHeader("Harvest-Account-Id", harvestId );
        xhr.setRequestHeader("authorization", 'Bearer ' + harvestApiKey );

        xhr.send();
    }

    const checkDashboard = function( checkTimesheet ) {

        if ( checkTimesheet ) {
            chrome.tabs.query({
                'active': true,
                'currentWindow': true
            }, function (tabs) {
                const url = new URL(tabs[0].url);
                const arg = url.searchParams.get('week');
                if (arg) {
                    startOfWeek = arg;
                } else {
                    startOfWeek = moment().format( "YYYY-MM-DD" );
                }

                if( 0 === moment( startOfWeek ).day() ) {
                    startOfWeek = moment(startOfWeek).add( 1, 'days' ).format( 'YYYY-MM-DD' );
                }

                getTimesheet();
            });
        }

        if ( dashboardId ) {
            chrome.tabs.query({
                'active': true,
                'currentWindow': true
            }, function (tabs) {
                const regex = new RegExp(dashboardURL);
                if (!regex.test(tabs[0].url)) {
                    chrome.tabs.create({'url': dashboardURL + dashboardId + '/'});
                }
            });
        } else {
            document.getElementById( 'tab-2' ).setAttribute( 'checked', 'checked' );
        }

        document.getElementById('dashboard-id').value    = dashboardId;
        document.getElementById('harvest-id').value      = harvestId;
        document.getElementById('harvest-api-key').value = harvestApiKey;
    };

    document.getElementById( 'save' ).addEventListener( 'click', saveOptions );
    document.getElementById( 'dashboard-button' ).addEventListener( 'click', function() {
        checkDashboard( true );
    } );

}, false);