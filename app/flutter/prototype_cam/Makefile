PORT     = 9005
DEVTOOLS = 9100

.PHONY: run run-dev tunnel build get setup check-port kill-port

run:
	flutter run -d chrome --web-port=$(PORT)

run-dev:
	flutter run -d chrome --web-port=$(PORT) --dart-define=FLUTTER_WEB_DEVTOOLS_PORT=$(DEVTOOLS)

tunnel:
	ngrok http $(PORT)

build:
	flutter build web

get:
	flutter pub get

setup:
	bash setup.sh

check-port:
	lsof -i :$(PORT) || echo "포트 $(PORT) 사용 중인 프로세스 없음"

kill-port:
	lsof -ti :$(PORT) | xargs kill -9 2>/dev/null && echo "포트 $(PORT) 해제 완료" || echo "해제할 프로세스 없음"
