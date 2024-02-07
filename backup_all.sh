#!/bin/bash
#/bin/bash
#cd "$( dirname "${BASH_SOURCE[0]}" )"
#DIR="$(cd -P "$(dirname "$0")" && pwd)"
cd -P "$(dirname "$0")"
backup_dir=../backup
DATE=`date +%Y%m%d-%H%M%S`
root_dir=$backup_dir/all_$DATE
submissions_dir=./submissions
homeworks_dir=./homeworks
problems_dir=./problems
git_dir=/home/git/repositories
gitosis_admin=./gitosis-admin
dist_static_dir=./dist/static
config_file=./dist/config.js
semantic_src_dir=./semantic/src
apache2_config_dir=/etc/apache2/sites-available/
mkdir -p $root_dir
mongodump --archive=$root_dir/dsajudge.${DATE}.gz --gzip --db dsajudge
tar -cf $root_dir/submissions.tar.zst $submissions_dir
tar -cf $root_dir/homeworks.tar.zst $homeworks_dir
tar -cf $root_dir/git.tar.zst $git_dir
tar -cf $root_dir/problems.tar.zst $problems_dir
tar -cf $root_dir/gitosis_admin.tar.zst $gitosis_admin
tar -cf $root_dir/dist.static.tar.zst $dist_static_dir
tar -cf $root_dir/semantic.src.tar.zst $semantic_src_dir
tar -cf $root_dir/apache2.config.tar.zst $apache2_config_dir
cp $config_file $root_dir/
rclone sync $root_dir dsa2024:dsajudge/all_$DATE
