@echo off
@chcp 65001

set local_path_bat= local_path.bat

if exist "%local_path_bat%" (
    echo local_path.bat найден. Использование локальной среды.
    call %local_path_bat%
) else (
    echo local_path.bat не найден. Использование глобальной среды.
)


call local_path.bat

cd main
call npm run dev
