#/bin/sh
mkdir /dev/shm/isolate
mkdir /dev/shm/isolate/META
mkdir /tmp/judge-comp
mkdir /tmp/judge_git
sudo bash ./start_root.sh
(cd dist; NODE_ENV=production forever start server.js)
# (cd dist; NODE_ENV=production forever start -l forever.log -o out.log -e err.log server.js)
# (cd dist; NODE_ENV=production nodemon server.js)
# forever start -c python3 update_git.py
