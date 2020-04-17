let timesheet = [];

const parseTimesheet = function( timeEntries ) {
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
    console.log( '----------timeentries-------' );
    console.log( timeEntries );
    console.log( '-----------------------------------' );
    let totalHoursLogged = 0;
    timesheet.forEach( function( p ) {
        totalHoursLogged += p.hours;
    } );

    chrome.storage.sync.get( {
        mapping: false,
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
                        if ( project_name.replace( '&amp;', '&' ) == p.project.replace( '&amp;', '&' ) ) {
                            hours_logged = p.hours;
                        } else {
                            // check mapping.
                            const current_project = p;
                            if ( items.mapping['project[' + project_name.replace( '&amp;', '&' ) + '][]'] ) {
                                if ( Array.isArray( items.mapping['project[' + project_name.replace( '&amp;', '&' ) + '][]'] ) ) {
                                    items.mapping['project[' + project_name.replace( '&amp;', '&' ) + '][]'].forEach( function( map_item ) {
                                        if ( map_item === 'cp' + current_project.client_id + '-' + current_project.project_id ) {
                                            hours_logged = hours_logged + parseFloat( current_project.hours );
                                        }
                                    } );
                                } else {
                                    if( items.mapping['project[' + project_name.replace( '&amp;', '&' ) + '][]'] === 'cp' + current_project.client_id + '-' + current_project.project_id ) {
                                        hours_logged = hours_logged + parseFloat( current_project.hours );
                                    }
                                }

                            }
                        }
                    } );
                }
                el.insertAdjacentHTML( 'beforeend', '<div class="employee-cell employee-client-hours-logged">' + hours_logged + '</div>' );
            }
        } );
    } );
};

const mapEntries = function( e ) {
    e.preventDefault();

    chrome.storage.sync.get( {
        mapping: {}
    }, function( items ) {

        let resourcing = document.querySelectorAll( '.employee-schedule-row' );
        let output = '<div style="padding: 1rem; background: #000; color: #FFF; position: absolute; top:0; left: 0; width: 500px; height: 500px; z-index: 99999; border: 1px solid red; overflow: auto;"><form id="form_mapping">';
        let timesheet_dropdown_options = '';
        timesheet.forEach( function( p ) {
            timesheet_dropdown_options += '<option value="cp' + p.client_id + '-' + p.project_id + '">' + p.project.replace( '&amp;', '&' ) + '</option>';
        } );
        resourcing.forEach( function( el, index )  {
            // see if we can find the project.
            const project = el.querySelector( '.employee-client-project' );
            if ( project ) {
                const project_name = project.innerHTML.replace( '&amp;', '&' );
                output += '<div><label>' + project_name + ':</label><br><select style="color: #000;" name="project[' + project_name + '][]" multiple size="5">';
                timesheet.forEach( function( p ) {
                    output += '<option value="cp' + p.client_id + '-' + p.project_id + '"';
                    // check mapping.
                    if ( items.mapping['project[' + project_name + '][]'] ) {
                        if ( Array.isArray( items.mapping['project[' + project_name + '][]'] ) ) {
                            items.mapping['project[' + project_name + '][]'].forEach(function (map_item) {
                                if ( map_item === 'cp' + p.client_id + '-' + p.project_id ) {
                                    output += ' selected';
                                }
                            });
                        } else {
                            if( items.mapping['project[' + project_name + '][]'] === 'cp' + p.client_id + '-' + p.project_id ) {
                                output += ' selected';
                            }
                        }
                    }
                    output += '>' + p.project.replace( '&amp;', '&' ) + '</option>';
                } );
                output += '</select></div><br>';
            }
        } );
        output += '<input type="submit" style="color: #000;" value="Save mapping"></form></div>';

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
           chrome.storage.sync.set( {
               mapping: object
           }, function( items ) {
               parseTimesheet( timesheet );
           } );
            return false;
        } );

    } );

    return false;
};
