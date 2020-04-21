# Check 10up resourcing against time logged

## This is a concept tool to check 10up resourcing and time logged in Harvest.

#### Requirements:
* Your Google Chrome needs to be in developer mode

#### Installation:
* Download extension from here: https://github.com/eflorea/google-chrome-timesheet/archive/master.zip and unzip it locally.
* Turn Developer mode On in Google Chrome: Preferences -> Extensions -> Developer Mode = ON
* Add the extention to Google: Preferences -> Extensions -> Load unpacked -> choose the unziped folder of the extension
* You should see the extension in the list of Extensions now and a icon would appear on top right.
* Configure extension - you will need to fill in Dashboard ID, Harvest Account ID and Harvest API Key:
* * Go to 10up schedule to see your resourcing, the url should looks something like XXX.10up.com/blog/10upper/MYDASHBOARDID/ - copy MYDASHBOARDID value and set it in the extension configuration and save it.
* * Go to Harvest developers page: https://id.getharvest.com/developers, create new API Token and copy Account ID and Your Token into the extension configuration and save it
* * You are all set!

#### Usage:
* Click on the extension icon - this will open your resourcing page if you are not there already
* Click on View Stats and a new column with hours logged will show up.
* If project names don't match with Harvest you will have to map them by clickin on mapping link and save mappinp. NOTE: the mapping needs to be run for each week.

##### Good luck and submit your timesheet on time!
