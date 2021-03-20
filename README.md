# ADA Judge
https://ada-judge.csie.ntu.edu.tw

# Original Project
https://github.com/bobogei81123/adajudge  
https://github.com/tzupengwang/adajudge

# Installation
```
# install nvm
# https://github.com/creationix/nvm

# install node
nvm install v10.10.0

# install mongodb
sudo apt update
sudo apt install mongodb

# install gulp and forever
# npm update; npm audit fix;
npm install -g gulp forever

# Install package, it would take a while
npm install

# Init
gulp init
# Semantic auto install is bugged
# So choose extend my settings > automatic manually when prompted

# Build semantic again...
(cd semantic; gulp build)
# // Copy ./semantic to dist/static/semantic

# Change src/server/config.js
# example: config.example.js

# Build
gulp build
ln -s $(pwd)/semantic/dist dist/static/semantic

# Install seccomp
sudo apt install libseccomp-dev libseccomp2 seccomp libcap-dev asciidoc gcc g++ make python
# Install python2 setuptools

# Build and copy isolate
# sudo -H gulp isolate
(cd isolate; make isolate)
cp ./isolate/isolate dist/judger/
sudo chown root:root dist/judger/isolate
sudo chmod +s dist/judger/isolate

# Unzip fonts.tar.gz in dist/static
tar xvf fonts.tar.gz -C dist/static/

# Link MathJax
ln -s ../../node_modules/mathjax/ dist/static/MathJax

# Edit isolate config
sudo mkdir /usr/local/etc
sudo cp isolate.conf /usr/local/etc/isolate

# Build gitosis from https://github.com/res0nat0r/gitosis
sudo adduser --system --shell /bin/sh --gecos 'git version control' --group --disabled-password --home /home/git git
# create ssh key: ssh-keygen
# Initialize gitosis
sudo -H -u git gitosis-init < ~/.ssh/id_rsa.pub
git clone git@localhost:gitosis-admin.git
# Set git config
# git config --global user.email "you@example.com"
# git config --global user.name "Your Name"
# Copy /bin/cp to /home/git/cp with owner 'git' and set its set-user-id bit
sudo cp /bin/cp /home/git/; sudo chown git:git /home/git/cp; sudo chmod +s /home/git/cp;

# Run server on port 3333
./start.sh

# forever list

# install apache2 server or nginx server and redirect connection to port 80 to http://localhost:3333/ and start the server
```

# Misc

## override semantic css
/*******************************
         Site Overrides
*******************************/

.ui.definition.table tr td.definition, .ui.definition.table > tbody > tr > td:first-child:not(.ignored), .ui.definition.table > tfoot > tr > td:first-child:not(.ignored), .ui.definition.table > tr > td:first-child:not(.ignored) {
    background: rgba(0, 0, 0, .03);
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-transform: '';
    -webkit-box-shadow: '';
    box-shadow: '';
    text-align: '';
    font-size: 1em;
    padding-left: '';
    padding-right: ''
}

# Issue
Kindly submit any issue you found on github.
