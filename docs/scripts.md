#Scripts

Inside src/server/scripts, there are utility scripts for the admin to access and modify data. To run a script, go to dist/scripts and run code from there. For `.js` files, the command is `node SCRIPTNAME.js <ARGS>`. 

Below is the description (and use case) for some scripts.

## Important

* `common.js`: Imports common packages and objects for other scripts to use.

## Managing Users

For scripts that need to send emails, login with your NTU ID and password, this will be used for authorization and the email is sent by `dsa_ta@csie.ntu.edu.tw`.

For scripts requiring an xlsx file, the required format is as follows:
- The first row contains headers (name, role, etc.) and it is not included in the list.
- Starting from the second row, each row represents data of a student.
- Inside the scripts, there will be a list of const values for certain fields (ROLE, ID, NAME, EMAIL). Change their values to the corresponding column numbers in your file (xlsx). Note: there are currently three supported ROLES: "admin", "TA", "student".
- The program reads the file until the first empty line.

* `add_admin.js`: Adds the admin account with username "Admin".
* `addUsersByXlsx.js <file>`: Adds all users in `file.xlsx`, existing users will still be sent an email. 
* `addNewUsers.js <file>`: Adds all users in `file.xlsx`, existing users will not be sent an email.
* `updateUsersByXlsx.js <file>` Update users role by `file.xlsx`. It checks the user by email (not by username).
* `resetPasswd.js`: Reset the password for a specific user.


## Fetching scores
This is used whenever a homework is due, and the scores need to be collected. There are "homework ids", but the "homeworks" directory is apparently empty (I don't know what it's for?). The homework id for a particular homework can be found by looking at the url in the scoreboard for a homework (/#!/homework/id/scoreboard).

### Calculating scores for homework
The policy for calculating scores is as follows.
* The score for a homework is the sum of scores for each individual problem multiplied by their weights.
* The score for a submission will be discounted by a "late multiplier".
    * If the code was submitted before the due date, the multiplier is 1.0
    * The multiplier decreases linearly through a period of 5 days from 1.0 to 0
* The score of a problem is the maximum score obtained after considering the multiplier. 

* `genScore.py`: This program reads the data from backend (mongodb) and calculates the score, assuming a 5 day soft->hard deadline. Note that it needs to be run with python3. 


