# 프로메테우스 TODO 앱

프로메테우스를 이용한 코드 계측 테스트용 토이 프로젝트

## 주요 기능

- TODO 항목의 CRUD 작업
- 프로메테우스 메트릭 수집
- SQLite 데이터베이스 (인메모리)
- RESTful API 엔드포인트

## 수집되는 메트릭

- HTTP 요청 지속 시간
- TODO 작업 카운터 (생성, 수정, 삭제)
- Node.js 기본 메트릭 (CPU, 메모리 등)

## 설치 및 실행 방법

1. 의존성 설치:
```bash
npm install
```

2. 서버 실행:
```bash
npm start
```

서버는 3000번 포트에서 실행됩니다.

## API 엔드포인트

- GET /todos - 모든 TODO 항목 조회
- POST /todos - 새로운 TODO 항목 생성
- PUT /todos/:id - TODO 항목 상태 업데이트
- DELETE /todos/:id - TODO 항목 삭제
- GET /metrics - 프로메테우스 메트릭 엔드포인트

## 프로메테우스 연동

애플리케이션은 `/metrics` 엔드포인트에서 메트릭을 노출합니다. 프로메테우스에서 이 메트릭을 수집하도록 하려면 프로메테우스 설정 파일에 다음 내용을 추가하세요:

```yaml
scrape_configs:
  - job_name: 'todo-app'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:3000']
```

## 수집되는 메트릭 예시

- `http_request_duration_seconds` - HTTP 요청 지속 시간
- `todo_operations_total` - TODO 작업 카운터
- Node.js 기본 메트릭 (CPU, 메모리 등)

## API 사용 예시

### TODO 항목 생성
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "새로운 할 일"}'
```

### TODO 항목 조회
```bash
curl http://localhost:3000/todos
```

### TODO 항목 상태 업데이트
```bash
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### TODO 항목 삭제
```bash
curl -X DELETE http://localhost:3000/todos/1
``` 