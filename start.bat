@echo off
@chcp 65001

call local_path.bat

cd main
call npm run dev
