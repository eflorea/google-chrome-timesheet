let timesheet = [];
let startOfWeek;
let storageKey;

const getCookie = function( name ) {
    const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
};

const setCookie = function( name, value, days ) {
    let d = new Date();
    d.setTime( d.getTime() + 24 * 60 * 60 * 1000 * days );
    document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
};

const parseTimesheet = function( timeEntries, startDate ) {
    startOfWeek = startDate;
    // reset everything.
    [].forEach.call(document.querySelectorAll('.employee-client-hours-logged'),function(e){
        e.parentNode.removeChild(e);
    });

    let resourcing = document.querySelectorAll( '.employee-schedule-row' );
    if( ! Array.isArray( timeEntries ) ) {
        timesheet = Object.values(timeEntries);
    } else {
        timesheet = timeEntries;
    }
    console.log( timesheet );
    setCookie( 'mapping-' + startOfWeek, JSON.stringify( timesheet ), 365 );
    storageKey = 'mapping-' + startOfWeek;
    let totalHoursLogged = 0;
    let totalHoursMapped = 0;
    timesheet.forEach( function( p ) {
        totalHoursLogged += p.hours;
    } );

    chrome.storage.local.get( {
        [storageKey]: false,
    }, function( items ) {

        resourcing.forEach( function( el, index )  {
            if ( 0 === index ) {
                el.insertAdjacentHTML( 'beforeend', '<div class="employee-cell employee-client-hours-logged" style="position: relative;">Hours logged<a href="#" id="mapping">mapping</a></div>' );
                document.getElementById( 'mapping' ).addEventListener( 'click', mapEntries );
            } else {
                // see if we can find the project.
                const project = el.querySelector( '.employee-client-project' );
                let hours_logged = 0;
                if ( project ) {
                    const project_name = project.innerHTML;
                    timesheet.forEach( function( p ) {
                        if ( compareNames( project_name, p.project ) ) {
                            hours_logged = p.hours;
                        } else {
                            // check mapping.
                            const current_project = p;
                            if ( items[storageKey]['project[' + project_name.replace( '&amp;', '&' ) + '][]'] ) {
                                if ( Array.isArray( items[storageKey]['project[' + project_name.replace( '&amp;', '&' ) + '][]'] ) ) {
                                    items[storageKey]['project[' + project_name.replace( '&amp;', '&' ) + '][]'].forEach( function( map_item ) {
                                        if ( map_item === 'cp' + current_project.client_id + '-' + current_project.project_id ) {
                                            hours_logged = hours_logged + parseFloat( current_project.hours );
                                        }
                                    } );
                                } else {
                                    if( items[storageKey]['project[' + project_name.replace( '&amp;', '&' ) + '][]'] === 'cp' + current_project.client_id + '-' + current_project.project_id ) {
                                        hours_logged = hours_logged + parseFloat( current_project.hours );
                                    }
                                }

                            }
                        }
                    } );
                }
                // check if last row.
                if ( ! resourcing[index+1] ) {
                    hours_logged = totalHoursLogged;
                    if ( hours_logged != totalHoursMapped ) {
                        hours_logged = parseFloat( hours_logged ).toFixed( 2 ) + ' mapped: ' + parseFloat( totalHoursMapped ).toFixed( 2 );
                    }
                } else {
                    totalHoursMapped += hours_logged;
                }
                el.insertAdjacentHTML( 'beforeend', '<div class="employee-cell employee-client-hours-logged">' + parseFloat( hours_logged ).toFixed( 2 ) + '</div>' );
            }
        } );
    } );
};

const mapEntries = function( e ) {
    e.preventDefault();

    chrome.storage.local.get( {
        [storageKey]: {}
    }, function( items ) {

        let resourcing = document.querySelectorAll( '.employee-schedule-row' );
        let output = '<div id="mapping_content"><form id="form_mapping">';
        let timesheet_dropdown_options = '';
        timesheet.forEach( function( p ) {
            timesheet_dropdown_options += '<option value="cp' + p.client_id + '-' + p.project_id + '">' + p.project.replace( '&amp;', '&' ) + '</option>';
        } );
        resourcing.forEach( function( el, index )  {
            // see if we can find the project.
            const project = el.querySelector( '.employee-client-project' );
            if ( project ) {
                const project_name = project.innerHTML.replace( '&amp;', '&' );
                output += '<div><label>' + project_name + ':</label><select name="project[' + project_name + '][]" multiple size="5">';
                timesheet.forEach( function( p ) {
                    output += '<option value="cp' + p.client_id + '-' + p.project_id + '"';
                    // check mapping.
                    if ( items[storageKey]['project[' + project_name + '][]'] ) {
                        if ( Array.isArray( items[storageKey]['project[' + project_name + '][]'] ) ) {
                            items[storageKey]['project[' + project_name + '][]'].forEach(function (map_item) {
                                if ( map_item === 'cp' + p.client_id + '-' + p.project_id ) {
                                    output += ' selected';
                                }
                            });
                        } else {
                            if( items[storageKey]['project[' + project_name + '][]'] === 'cp' + p.client_id + '-' + p.project_id ) {
                                output += ' selected';
                            }
                        }
                    }
                    output += '>' + p.project.replace( '&amp;', '&' ) + '</option>';
                } );
                output += '</select></div><br>';
            }
        } );
        output += '<input type="submit" value="Save mapping"></form></div>';

        document.getElementById( 'mapping' ).insertAdjacentHTML('afterEnd', output );

        document.getElementById( 'form_mapping' ).addEventListener( 'submit', function( e ) {
            e.preventDefault();

            var object = {};
            var formData = new FormData( e.target );
            formData.forEach((value, key) => {
                // Reflect.has in favor of: object.hasOwnProperty(key)
                if(!Reflect.has(object, key)){
                    object[key] = value;
                    return;
                }
                if(!Array.isArray(object[key])){
                    object[key] = [object[key]];
                }
                object[key].push(value);
            });
           chrome.storage.local.set( {
               [storageKey]: object
           }, function( items ) {
               parseTimesheet( timesheet, startOfWeek );
           } );
            return false;
        } );

    } );

    return false;
};

const init = function() {
    let startOfWeek;
    const url = new URL( document.location.href );
    const arg = url.searchParams.get( 'week' );
    if ( arg ) {
        startOfWeek = arg;
    } else {
        startOfWeek = moment().format( "YYYY-MM-DD" );
    }

    if( 0 === moment( startOfWeek ).day() ) {
        startOfWeek = moment( startOfWeek ).add( 1, 'days' ).format( 'YYYY-MM-DD' );
    }

    const startDate = moment( startOfWeek ).startOf( 'isoWeek' ).format( 'YYYY-MM-DD' );

    try {
        const timeSheet = JSON.parse( getCookie( 'mapping-' + startDate ) );
        if ( timeSheet ) {
            parseTimesheet( timeSheet, startDate );
        }
    } catch ( e ) {
        // do nothing.
    }
};

const cleanName = function( name ) {
    let n = name.replace( /[^A-Za-z\s\-]/g, ' ' );
    n = n.replace( /\-/g, ' ' );
    n = n.replace( /\s\s+/g, ' ');
    let m;
    let output = '';
    const regex = /\b\w{4,}/g;

    while ( ( m = regex.exec( n ) ) !== null ) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach( ( match, groupIndex) => {
            output += ' ' + match;
        } );
    }

    output = output.replace( /\s+/g, '' ).toLowerCase();

    return output;
};

const compareNames = function( original, logged ) {
  original = cleanName( original );
  logged = cleanName( logged );

  // hardcoded the company time.
  if ( 'overhead' === original &&
     'companytimeplanningbrainstorming' === logged ) {
      return true;
  }

  if ( original === logged ) {
      return true;
  }

  if ( -1 !== original.indexOf( logged ) ) {
      return true;
  }

  if ( -1 !== logged.indexOf( original ) ) {
      return true;
  }

  return false;
};


if (
    document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
    init();
} else {
    document.addEventListener("DOMContentLoaded", init);
}
