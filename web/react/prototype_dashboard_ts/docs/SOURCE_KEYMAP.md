# 실 서비스 키 매핑표
> 목적: BE 서버 키(11c-server-ko.csv)와 FE 화면 라벨(admin_lokalise.csv)을 실 서비스 용어와 매핑
> 가드레일: 추론·해석 금지. CSV 원문과 화면 확인 사실만 기록.
> 수정 방식: 기존 내용 수정 금지. 새 확인 시 날짜와 함께 섹션 추가.
> 참조: docs/SOURCE_TERMS.md (화면 용어 원문), docs/STATUS_POLICY.md (정책 정의)

출처: 11c-server-ko.csv (BE) + admin_lokalise.csv (FE) + 화면 직접 확인 (2026-04-03)

---

## 일감(티켓) 상태값 매핑

| 화면 표시(FE) | 프로토타입 키 | 비고 |
|---|---|---|
| 보고됨 | REPORTED | TicketStatus |
| 미배정 | PENDING | TicketStatus (구: UNASSIGNED) |
| 배정됨 | ASSIGNED | TicketStatus |
| 수행전 | RESERVED | TicketStatus (구: BEFORE_START) |
| 수행중 | STARTED | TicketStatus (구: IN_PROGRESS) |
| 완료 | RESOLVED | TicketStatus (구: COMPLETED) |
| 보류 | HOLD | TicketStatus (구: ON_HOLD) |
| 취소 | CANCELED | TicketStatus (구: CANCELLED) |

---

## 이슈(처리필요) 상태값 매핑

| 화면 표시(FE) | 프로토타입 키 | 비고 |
|---|---|---|
| 접수됨 | REPORTED | IssueStatus (구: RECEIVED) |
| 보류 | HOLD | IssueStatus (구: ON_HOLD) |
| 완료 | RESOLVED | IssueStatus (구: CONFIRMED + COMPLETED 통합) |
| 취소 | CANCELED | IssueStatus (신규 추가) |

---

## 클레임 상태값 매핑

| 화면 표시(FE) | 프로토타입 키 | 비고 |
|---|---|---|
| 처리 대기 | PENDING | ClaimStatus |
| 인정완료 | ACCEPTED | ClaimStatus (mock 임시 키 — BE 미확정) |
| 이의제기 | DISPUTED | ClaimStatus (mock 임시 키 — BE 미확정) |
| 이의제기 후속 처리 완료 | DISPUTE_COMPLETED | ClaimStatus (mock 임시 키 — BE 미확정) |

ACCEPTED / DISPUTED / DISPUTE_COMPLETED: BE /shared/v1/ticket-claim-statuses 실측 후 교체 필요.

---

## 실 서비스 화면 — 홈 상태값 라벨

실 서비스 홈의 일감 상태별 건수 카드에서 확인된 한글 라벨 (2026-04-03 직접 확인)
보고됨 / 미배정 / 배정됨 / 수행전 / 수행중 / 완료 / 보류 / 취소

---

## 실 서비스 화면 — 관제 필터 라벨

일감 상태 필터 (2026-04-03 직접 확인)
- 전체 / 보고됨 / 미배정 / 배정됨 / 수행전 / 수행중 / 보류
- 완료·취소는 관제 화면 일감 상태 필터 목록에 없음

우선 수행 요청 필터
- 전체 / 우선 수행 요청

---

## CSV 원문 전체 (75차 저장 2026-04-03)

### BE 서버 키 원문 (11c-server-ko.csv)

> 유효 행: 297 | 열: key, ko

| key | ko |
|---|---|
| IndicatorApi.RoomGroupNotification.body.TICKET_ASSIGNED | %1$s %2$s %3$s에 키퍼 %4$s 배정되었습니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_CANCELED | %1$s %2$s %3$s 일감이 취소 되었습니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_NOT_ASSIGNED | %1$s %2$s %3$s에 키퍼 배정이 필요합니다.. |
| IndicatorApi.RoomGroupNotification.body.TICKET_NOT_RESERVED | %1$s %2$s %3$s 예약이 필요합니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_NOT_RESOLVED | %1$s %2$s %3$s 완료가 필요합니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_NOT_STARTED | %1$s %2$s %3$s 시작이 필요합니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_PENDING | %1$s %2$s에 %3$s 대기 중입니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_REPORT_HOLD | %1$s %2$s %3$s %4$s이 보류 처리. |
| IndicatorApi.RoomGroupNotification.body.TICKET_REPORT_KEEPER_CANCELED | %1$s %2$s %3$s 키퍼 %4$s이 취소 처리. |
| IndicatorApi.RoomGroupNotification.body.TICKET_REPORT_KEEPER_REPORTED | %1$s %2$s %3$s 키퍼 %4$s이 보고. |
| IndicatorApi.RoomGroupNotification.body.TICKET_REPORT_RESOLVED | %1$s %2$s %3$s %4$s이 해결 처리. |
| IndicatorApi.RoomGroupNotification.body.TICKET_REPORT_STAFF_CANCELED | %1$s %2$s %3$s 관제 %4$s이 취소 처리. |
| IndicatorApi.RoomGroupNotification.body.TICKET_REPORT_STAFF_REPORTED | %1$s %2$s %3$s 관제 %4$s이 보고. |
| IndicatorApi.RoomGroupNotification.body.TICKET_RESERVED | %1$s %2$s %3$s %4$s에 예약되었습니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_RESOLVED | %1$s %2$s %3$s 완료되었습니다. |
| IndicatorApi.RoomGroupNotification.body.TICKET_STARTED | %1$s %2$s %3$s 시작되었습니다. |
| IndicatorApi.RoomGroupNotification.title.TICKET_ASSIGNED | 일감 배정 |
| IndicatorApi.RoomGroupNotification.title.TICKET_CANCELED | 일감 취소됨 |
| IndicatorApi.RoomGroupNotification.title.TICKET_NOT_ASSIGNED | 일감 배정 필요 |
| IndicatorApi.RoomGroupNotification.title.TICKET_NOT_RESERVED | 일감 예약 필요 |
| IndicatorApi.RoomGroupNotification.title.TICKET_NOT_RESOLVED | 일감 완료 필요 |
| IndicatorApi.RoomGroupNotification.title.TICKET_NOT_STARTED | 일감 시작 필요 |
| IndicatorApi.RoomGroupNotification.title.TICKET_PENDING | 일감 대기 |
| IndicatorApi.RoomGroupNotification.title.TICKET_REPORT_HOLD | 특이사항 보류 처리 |
| IndicatorApi.RoomGroupNotification.title.TICKET_REPORT_KEEPER_CANCELED | 특이사항 키퍼 취소 처리 |
| IndicatorApi.RoomGroupNotification.title.TICKET_REPORT_KEEPER_REPORTED | 특이사항 키퍼 보고됨 |
| IndicatorApi.RoomGroupNotification.title.TICKET_REPORT_RESOLVED | 특이사항 해결 처리 |
| IndicatorApi.RoomGroupNotification.title.TICKET_REPORT_STAFF_CANCELED | 특이사항 관제 취소 처리 |
| IndicatorApi.RoomGroupNotification.title.TICKET_REPORT_STAFF_REPORTED | 특이사항 관제 보고됨 |
| IndicatorApi.RoomGroupNotification.title.TICKET_RESERVED | 일감 예약됨 |
| IndicatorApi.RoomGroupNotification.title.TICKET_RESOLVED | 일감 완료됨 |
| IndicatorApi.RoomGroupNotification.title.TICKET_STARTED | 일감 시작됨 |
| KeeperApi.KeeperNotification.body.ROOM_SCHEDULE_CHECKED_OUT | %1$s %2$s 고객이 퇴실했습니다. |
| KeeperApi.KeeperNotification.body.ROOM_SCHEDULE_CHECK_OUT | %1$s %2$s 퇴실이 %3$s로 변경되었습니다. |
| KeeperApi.KeeperNotification.body.TICKET_ASSIGNED | %1$s %2$s %3$s 배정 되었습니다. |
| KeeperApi.KeeperNotification.body.TICKET_CANCELED | %1$s %2$s %3$s 취소되었습니다. |
| KeeperApi.KeeperNotification.body.TICKET_NOT_ASSIGNED | %1$s %2$s %3$s 배정이 필요합니다. |
| KeeperApi.KeeperNotification.body.TICKET_NOT_RESERVED | %1$s %2$s %3$s 예약이 필요합니다. |
| KeeperApi.KeeperNotification.body.TICKET_NOT_RESOLVED | %1$s %2$s %3$s 완료가 필요합니다. |
| KeeperApi.KeeperNotification.body.TICKET_NOT_STARTED | %1$s %2$s %3$s 시작이 필요합니다. |
| KeeperApi.KeeperNotification.body.TICKET_PENDING | %1$s %2$s %3$s 요청 되었습니다. |
| KeeperApi.KeeperNotification.body.TICKET_RESERVED | %1$s %2$s %3$s 예약 되었습니다. |
| KeeperApi.KeeperNotification.body.TICKET_RESOLVED | %1$s %2$s %3$s 완료되었습니다. |
| KeeperApi.KeeperNotification.body.TICKET_STARTED | %1$s %2$s %3$s 시작되었습니다. |
| KeeperApi.KeeperNotification.title.ROOM_SCHEDULE_CHECKED_OUT | 고객 퇴실 안내 |
| KeeperApi.KeeperNotification.title.ROOM_SCHEDULE_CHECK_OUT | 고객 퇴실 안내 |
| KeeperApi.KeeperNotification.title.TICKET_ASSIGNED | 일감 배정 |
| KeeperApi.KeeperNotification.title.TICKET_CANCELED | 일감 배정 필요 |
| KeeperApi.KeeperNotification.title.TICKET_NOT_ASSIGNED | 일감 배정 필요 |
| KeeperApi.KeeperNotification.title.TICKET_NOT_RESERVED | 일감 예약 필요 |
| KeeperApi.KeeperNotification.title.TICKET_NOT_RESOLVED | 일감 완료 필요 |
| KeeperApi.KeeperNotification.title.TICKET_NOT_STARTED | 일감 시작 필요 |
| KeeperApi.KeeperNotification.title.TICKET_PENDING | 일감 대기 |
| KeeperApi.KeeperNotification.title.TICKET_RESERVED | 일감 예약됨 |
| KeeperApi.KeeperNotification.title.TICKET_RESOLVED | 일감 완료됨 |
| KeeperApi.KeeperNotification.title.TICKET_STARTED | 일감 시작됨 |
| KeeperApi.KeeperNotification.body.TEST | %s 테스트 중입니다. |
| SharedApi.HealthCheck | %s 서버 상태 확인 |
| Exception.body.INVALID_OTP_DEVICE | 인증번호를 요청한 기기와 시도하는 기기가 다릅니다. |
| Exception.body.TIMEOUT_SIGN_IN | 로그인하신지 오래되어 재로그인이 필요합니다. |
| Exception.body.TOKEN_PAYLOAD_MISMATCH_KEEPER_ID | 인증번호 토큰 페이로드의 키퍼 아이디가 요청 키퍼 아이디와 일치하지 않습니다. |
| Exception.body.INVALID_TOKEN | 잘못된 접근입니다. 다시 시도해 주세요. (3) |
| Exception.body.EXCEEDED_GENERATE_OTP_ATTEMPT | 인증번호 확인 실패가 %s회를 초과했습니다.
관리자에게 초기화를 요청해 주세요. |
| Exception.title.GENERAL | 에러 |
| Exception.body.GENERAL | 에러가 발생했습니다. 잠시 후 다시 시도해 주세요. |
| Exception.body.INVALID_TOKEN_OWNERSHIP | 인증번호를 요청한 기기와 시도하는 기기가 다릅니다. (1) |
| Exception.body.OTP_VERIFICATION_REQUIRED | 인증이 필요합니다. |
| Exception.body.EXPIRED_OTP_TOKEN | 인증번호 유효기간이 지났습니다. |
| Exception.body.WRONG_OTP_CODE | 현재 입력한 인증번호는 잘못된 번호입니다. 확인 후 재입력 부탁드립니다. |
| Exception.body.NOT_VERIFIABLE_TOKEN | 유효하지 않은 토큰입니다. |
| Exception.body.AUTH_REQUIRED | 인증이 필요합니다. |
| Exception.body.FORCE_DISABLE | 강제 수정이 필요합니다. |
| Exception.body.INVALID_SIGNATURE_TOKEN | 위조된 토큰입니다. |
| Exception.body.NOT_FOUND_STAFF_DEVICE | 해당 기기에 대한 정보가 없습니다. |
| IndicatorApi.IndicatorNotification.body.SEND_OTP_CODE | 어드민 인증 번호는 %s 입니다. |
| Exception.body.SUSPENDED_ACCOUNT | 사용자 계정이 정지되었습니다. 관리자에게 문의해 주세요. |
| Exception.body.DUPLICATE_LOGIN | 해당 계정이 다른 기기에서 로그인 되었습니다. |
| Exception.body.INVALID_ROOM_ITEM_PRESET_NAME | 소모품 이름은 공백일 수 없습니다. |
| IndicatorApi.WrongReason.workspaceNameRegex | 특수문자는 허용하지 않습니다. |
| IndicatorApi.WrongReason.workspaceNameLength | %1$s자 이상 %2$s 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.workspaceNameAlreadyExists | 이미 존재하는 워크스페이스 이름입니다. |
| IndicatorApi.WrongReason.workspaceCodeRegex | 영문 소문자(a-z), 숫자(0-9), - 하이픈, 반드시 영문 또는 숫자로 시작하고 연속 하이픈은 안됩니다. |
| IndicatorApi.WrongReason.workspaceCodeLength | %1$s자 이상 %2$s 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.workspaceCodeAlreadyExists | 이미 존재하는 워크스페이스 코드입니다. |
| Enums.WorkspaceType.HEADQUARTER | 열한시 본사 |
| Enums.WorkspaceType.MOTEL | 모텔/여관 |
| Enums.WorkspaceType.HOTEL | 호텔 |
| Enums.WorkspaceType.CONDO | 콘도/리조트 |
| Enums.WorkspaceType.HOSTEL | 게스트하우스/호스텔 |
| Enums.WorkspaceType.COTTAGE | 펜션 |
| Enums.WorkspaceType.B_AND_B | 민박/공유숙박 |
| Enums.WorkspaceType.HANOK_HOMESTAY | 한옥체험숙박 |
| Enums.WorkspaceType.CAMPING | 캠핑/글램핑 |
| Enums.WorkspaceType.LIVING_ACCOMMODATION | 생활형 숙박 시설 (레지던스 호텔) |
| Enums.WorkspaceType.ZAKSIM | 작심 |
| Enums.WorkspaceType.ETC | 기타 |
| Enums.WorkspaceType.PARTNER | 파트너 |
| Enums.WorkspaceSubType.STAR_ONE | 1성 |
| Enums.WorkspaceSubType.STAR_TWO | 2성 |
| Enums.WorkspaceSubType.STAR_THREE | 3성 |
| Enums.WorkspaceSubType.STAR_FOUR | 4성 |
| Enums.WorkspaceSubType.STAR_FIVE | 5성 |
| Enums.CountryType.KR | 대한민국 |
| Enums.WorkspaceStaffRegistrationType.NONE | 요청 승인 대기 |
| Enums.WorkspaceStaffRegistrationType.SUDO | 소유주 |
| Enums.WorkspaceStaffRegistrationType.ADMIN | 총괄 관리자 |
| Enums.WorkspaceStaffRegistrationType.MANAGER | 관리자 |
| IndicatorApi.WrongReason.WORKSPACE_CODE_ALREADY_EXISTS | 이미 존재하는 워크스페이스 코드입니다. |
| IndicatorApi.WrongReason.WORKSPACE_CODE_LENGTH | %1$s자 이상 %2$s 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.WORKSPACE_CODE_REGEX | 영문 소문자(a-z), 숫자(0-9), - 하이픈, 반드시 영문 또는 숫자로 시작하고 연속 하이픈은 안됩니다. |
| IndicatorApi.WrongReason.WORKSPACE_NAME_ALREADY_EXISTS | 이미 존재하는 워크스페이스 이름입니다. |
| IndicatorApi.WrongReason.WORKSPACE_NAME_LENGTH | %1$s자 이상 %2$s 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.WORKSPACE_NAME_REGEX | 특수문자는 허용하지 않습니다. |
| IndicatorApi.WrongReason.BLACKLISTED_WORKSPACE_NAME | 회사 또는 제휴사 이름은 워크스페이스 이름으로 사용할 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_POINT_AMOUNT_ALREADY_EXISTS | 동일한 레벨업 기준 경험치가 이미 존재합니다 |
| IndicatorApi.WrongReason.KEEPER_LEVEL_CANNOT_DELETE_WHEN_EXIST_KEEPER | 해당 등급에 소속된 키퍼가 있어 삭제할 수 없습니다. 등급에 소속된 키퍼를 이동 후 삭제해 주세요. |
| IndicatorApi.WrongReason.ROOM_GROUP_NAME_LENGTH | %1$s자 이상 %2$s 이하로 입력해 주세요. |
| Exception.body.INVALID_HEADQUARTER_ACCESS | 본사 접근 권한이 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_NAME_REGEX | 키퍼 레벨 이름에 특수문자를 포함할 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_NAME_LENGTH | 키퍼 레벨 이름은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_NAME_ALREADY_EXISTS | 이미 존재하는 키퍼 레벨 이름입니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_GROUP_NAME_REGEX | 키퍼 레벨 그룹 이름에 특수문자를 포함할 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_GROUP_NAME_LENGTH | 키퍼 레벨 그룹 이름은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_GROUP_NAME_ALREADY_EXISTS | 이미 존재하는 키퍼 레벨 그룹 이름입니다. |
| IndicatorApi.WrongReason.ROOM_GROUP_NAME_REGEX | 지점 이름에 특수문자를 포함할 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_GROUP_NAME_ALREADY_EXISTS | 이미 존재하는 지점 이름입니다. |
| IndicatorApi.WrongReason.DETAIL_ADDRESS_REGEX | 상세 주소에 허용되지 않는 문자가 포함되어 있습니다. |
| IndicatorApi.WrongReason.DETAIL_ADDRESS_LENGTH | 상세 주소는 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.ROOM_CATEGORY_NAME_REGEX | 공간 타입 이름에 특수문자를 포함할 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_CATEGORY_NAME_LENGTH | 공간 타입 이름은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.ROOM_CATEGORY_NAME_ALREADY_EXISTS | 이미 존재하는 공간 타입 이름입니다. |
| IndicatorApi.WrongReason.TICKET_REQUEST_NAME_REGEX | 일감 이름에 특수문자를 포함할 수 없습니다. |
| IndicatorApi.WrongReason.TICKET_REQUEST_NAME_LENGTH | 일감 이름은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.TICKET_REQUEST_NAME_ALREADY_EXISTS | 이미 존재하는 일감 이름입니다. |
| IndicatorApi.WrongReason.TICKET_REPORT_SUB_TYPE_CONTENT_REGEX | 이슈 하위 유형 내용에 허용되지 않는 문자가 포함되어 있습니다. |
| IndicatorApi.WrongReason.TICKET_REPORT_SUB_TYPE_CONTENT_LENGTH | 이슈 하위 유형 내용은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.TICKET_REPORT_SUB_TYPE_CONTENT_ALREADY_EXISTS | 이미 존재하는 이슈 하위 유형 내용입니다. |
| IndicatorApi.WrongReason.ROOM_CHAMBER_PRESET_NAME_REGEX | 구역 이름에 특수문자를 포함할 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_CHAMBER_PRESET_NAME_LENGTH | 구역 이름은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.ROOM_CHAMBER_PRESET_NAME_ALREADY_EXISTS | 이미 존재하는 구역 이름입니다. |
| IndicatorApi.WrongReason.ROOM_CHAMBER_PRESET_DESCRIPTION_REGEX | 구역 설명에 허용되지 않는 문자가 포함되어 있습니다. |
| IndicatorApi.WrongReason.ROOM_CHAMBER_PRESET_DESCRIPTION_LENGTH | 구역 설명은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.RECURRING_RULE_OVERSIZED | 반복 규칙이 너무 큽니다. 크기를 줄여주세요. |
| IndicatorApi.WrongReason.TICKET_REQUEST_GROUP_NAME_ALREADY_EXISTS | 이미 존재하는 일감 그룹 이름입니다. |
| IndicatorApi.WrongReason.ROOM_ITEM_GROUP_PRESET_NAME_ALREADY_EXISTS | 이미 존재하는 공간 소모품 그룹 이름입니다. |
| IndicatorApi.WrongReason.ROOM_PROPERTY_GROUP_PRESET_NAME_ALREADY_EXISTS | 이미 존재하는 자산 속성 이름입니다. |
| IndicatorApi.WrongReason.TICKET_REQUEST_GROUP_NAME_LENGTH | 일감 그룹 이름은 %1$s자 이상 %2$s자 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.TICKET_REQUEST_GROUP_NAME_REGEX | 일감 그룹 이름에 특수문자를 포함할 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_GROUP_HAS_TICKETS | 해당 키퍼 레벨 그룹에 연결된 티켓이 있어 삭제할 수 없습니다. |
| Exception.body.FORCE_DISABLED | 강제 수정이 필요합니다. |
| IndicatorApi.WrongReason.ROOM_ITEM_GROUP_PRESET_NAME_LENGTH | %1$s자 이상 %2$s 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.ROOM_ITEM_GROUP_PRESET_NAME_REGEX | 공간 소모품 이름은 특수문자를 포함 할 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_PROPERTY_GROUP_PRESET_NAME_LENGTH | %1$s자 이상 %2$s 이하로 입력해 주세요. |
| IndicatorApi.WrongReason.ROOM_PROPERTY_GROUP_PRESET_NAME_REGEX | 자산 속성 이름은 특수문자를 포함 할 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_GROUP_NAME_POLICY | 키퍼 레벨 그룹 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_GROUP_NAME_HAS_INITIAL_CONSONANT | 키퍼 레벨 그룹 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_NAME_HAS_INITIAL_CONSONANT | 키퍼 레벨 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_CATEGORY_NAME_HAS_INITIAL_CONSONANT | 공간 타입 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_CHAMBER_PRESET_NAME_HAS_INITIAL_CONSONANT | 구역 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_GROUP_NAME_HAS_INITIAL_CONSONANT | 지점 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.TICKET_REQUEST_GROUP_NAME_HAS_INITIAL_CONSONANT | 일감 그룹 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.TICKET_REQUEST_NAME_HAS_INITIAL_CONSONANT | 일감 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_PROPERTY_GROUP_PRESET_NAME_HAS_INITIAL_CONSONANT | 자산 속성 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.ROOM_ITEM_GROUP_PRESET_NAME_HAS_INITIAL_CONSONANT | 공간 소모품 이름은 초성을 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.WORKSPACE_NAME_HAS_INITIAL_CONSONANT | 워크스페이스 이름에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.TICKET_REPORT_SUB_TYPE_CONTENT_HAS_INITIAL_CONSONANT | 이슈 세부 유형 내용에 초성이 포함 될 수 없습니다. |
| IndicatorApi.WrongReason.WORKSPACE_NAME_HAS_SPECIAL_CHARACTERS | 워크스페이스 이름에 특수문자를 포함 할 수 없습니다. |
| Exception.body.INVALID_AT_FORMAT | 날짜 형식이 올바르지 않습니다. %s 형식으로 입력해 주세요. |
| Exception.body.INVALID_ROOM_GROUP_ID | 유효하지 않은 지점 ID 입니다. |
| Exception.body.NOT_FOUND_ROOM_GROUP | 해당 지점을 찾을 수 없습니다 %s |
| Exception.body.INVALID_PAGE | 페이지는 %s 이상의 정수여야 합니다. |
| Exception.body.INVALID_SIZE | 페이지당 개수는 %s 이상의 정수여야 합니다. |
| Exception.body.INVALID_ROOM_GROUP_ID_LIST_LENGTH | 지점은 %s개 이하만 조회 가능합니다. |
| Enums.BaseErrorType.INTERNAL_SERVER_ERROR | 서버 오류가 발생했습니다. |
| Enums.BaseErrorType.ACCESS_DENIED | 접근 권한이 없습니다. |
| Enums.BaseErrorType.CONSTRAINT_VIOLATION | 유효성 검증에 실패하였습니다. |
| Enums.BaseErrorType.ILLEGAL_ARGUMENT | 잘못된 요청입니다. |
| Enums.BaseErrorType.INVALID_FIELD_ERROR | 유효하지 않은 입력값입니다. |
| Enums.BaseErrorType.JWT_DECODE_FAILED | 유효하지 않은 토큰입니다. |
| Enums.BaseErrorType.NOT_FOUND | 요청한 리소스를 찾을 수 없습니다. |
| Enums.BaseErrorType.NOT_IMPLEMENTED | 구현되지 않은 기능입니다. |
| Enums.BaseErrorType.TOKEN_EXPIRED | 만료된 토큰입니다. |
| Enums.BaseErrorType.TYPE_MISMATCHED | 잘못된 데이터 타입입니다. |
| Exception.body.APP_INVALID_SIZE_FILE | 파일 크기가 너무 큽니다. 30MB 이하의 파일만 업로드 가능합니다. |
| Exception.body.APP_INVALID_TARGET_USAGE_TYPE | 유효하지 않은 대상 사용 유형입니다. |
| Exception.body.APP_INVALID_TICKET_REPORT_STATUS | 유효하지 않은 특이사항 상태입니다. |
| Exception.body.APP_INVALID_TICKET_REPORT_SUB_TYPE | 유효하지 않은 특이사항 하위 유형입니다. |
| Exception.body.APP_INVALID_TICKET_REPORT_TYPE | 유효하지 않은 특이사항 유형입니다. |
| Exception.body.APP_INVALID_TICKET_STATUS | 유효하지 않은 일감 상태입니다. |
| Exception.body.APP_NOT_ASSIGNED_TICKET | 해당 일감에 배정되지 않았습니다. |
| Exception.body.APP_NOT_ASSIGNED_TICKET_REPORT | 해당 특이사항에 배정되지 않았습니다. |
| Exception.body.RECURRING_RULE_OVERSIZED | 반복일감은 최대 %s개 까지 생성 가능합니다. |
| Test.test_ci_cd | 테스트 |
| Exception.body.INVALID_ORIGIN_ID | 유효하지 않은 originId 타입입니다. |
| Exception.body.NOT_FOUND_RECURRING_RULE | 반복 일감을 찾을 수 없습니다. |
| Exception.body.NOT_FOUND_ROOM | 공간을 찾을 수 없습니다. |
| Exception.body.NOT_FOUND_TICKET_NOTE | 일감 참고사항을 찾을 수 없습니다. |
| Exception.body.TICKET_NOTE_ALREADY_EXISTS | 해당 일감에 이미 참고사항이 존재합니다. |
| Exception.body.TICKET_REPORT_UNSUPPORTED_CREATE_TICKET_NOTE | 이슈에는 참고사항을 추가할 수 없습니다. |
| Exception.body.NOT_FOUND_TICKET | 일감을 찾을 수 없습니다. |
| Exception.body.TICKET_REPORT_UNSUPPORTED_UPDATE_SETTLEMENT_REMARK_TYPE | 이슈는 특이사항 변경 기능을 지원하지 않습니다. |
| Exception.body.PENDING_TICKET_CANNOT_BE_RESOLVED | 대기 중인 일감은 완료할 수 없습니다. |
| Exception.body.ALREADY_RESOLVED_TICKET | 이미 완료된 일감 입니다. |
| Exception.body.CANCEL_TICKET_CANNOT_BE_RESOLVED | 취소된 일감은 완료할 수 없습니다. |
| Exception.body.NOT_COMPLETED_TICKET_TODO_EXISTS | 완료되지 않은 체크리스트 존재합니다. |
| Exception.body.ASSIGNED_TICKET_FORCE_CHANGE_NECESSARY_BE_RESOLVED | 배정 일감을 완료하려면 강제수정으로 진행해야 합니다. |
| Exception.body.RESERVED_TICKET_FORCE_CHANGE_NECESSARY_BE_RESOLVED | 예약 일감을 완료하려면 강제수정으로 진행해야 합니다. |
| KeeperApi.KeeperNotification.title.URGENT_TICKET | 일감 우선순위 변경 |
| KeeperApi.KeeperNotification.body.URGENT_TICKET | %1$s %2$s %3$s 우선 수행 요청으로 변경되었습니다. |
| Exception.body.NOT_FOUND_TICKET_REPORT | 보고사항을 찾을 수 없습니다. |
| Exception.body.NOT_FOUND_TICKET_REQUEST | 일감을 찾을 수 없습니다. |
| Exception.body.APP_INVALID_KEEPER_SCHEDULE_AT | 수정할 수 없는 일정입니다 (%s). |
| Exception.body.TICKET_NOTE_DESCRIPTION_NECESSARY | 일감 참고사항 내용은 필수 값 입니다. |
| Exception.body.TICKET_KEEPER_ASSIGN_TICKET_STATUS_CHANGED | 일부 일감의 상태가 변경되어 배정할 수 없습니다. 일감을 다시 불러와 주세요. |
| Exception.body.NOT_FOUND_TICKET_CLAIM | 클레임을 찾을 수 없습니다. |
| Exception.body.TICKET_REPORT_UNSUPPORTED_CREATE_TICKET_CLAIM | 이슈는 클레임 생성 기능을 지원하지 않습니다. |
| Exception.body.TICKET_CLAIM_SUB_TYPE_MUST_BELONG_TO_TYPE | 클레임의 세부항목은 항목에 속해야합니다. |
| Exception.body.KEEPER_ADMIN_CANNOT_ACCEPT_TICKET_CLAIM | 키퍼 관리자는 클레임을 인정할 수 없습니다. |
| Exception.body.KEEPER_ADMIN_CANNOT_DISPUTE_TICKET_CLAIM | 키퍼 관리자는 클레임에 이의를 제기할 수 없습니다. |
| Exception.body.PARTNER_CANNOT_DELETE_TICKET_CLAIM | 파트너는 클레임을 삭제할 수 없습니다. |
| Exception.body.PARTNER_CANNOT_UPDATE_TICKET_CLAIM | 파트너는 클레임을 수정할 수 없습니다. |
| Exception.body.ONLY_PENDING_TICKET_CLAIM_CAN_BE_DELETED | 처리 대기 상태의 클레임만 삭제할 수 있습니다. |
| Exception.body.ALREADY_DELETED_TICKET_CLAIM | 이미 삭제된 클레임입니다. |
| Exception.body.EXPECT_EXECUTION_DURATION_EXCEEDS_EXECUTABLE | 일감 완료 예상 시간은 일감 수행 가능 기간보다 작아야 합니다. |
| Exception.body.NOT_FOUND_ROOM_CATEGORY | 공간 타입을 찾을 수 없습니다. |
| Exception.body.ROOM_CANNOT_UNREGISTER_WHEN_RECURRING_RULE_EXISTS | 공간 '%1$s'에 활성화된 반복 일감(%2$s)가 연결되어 있어 배정 해제할 수 없습니다. |
| Exception.body.ROOM_MUST_BE_REGISTERED_TO_CATEGORY | 공간 타입에 배정되지 않은 공간(%s)은 반복 일감에 등록할 수 없습니다. |
| Exception.body.INVALID_START_AT | 시작 시간(%1$s)이 시작 가능 시간(%2$s) 보다 이른 시간입니다. |
| Exception.body.INVALID_START_AT_OUT_OF_RANGE | 일감의 실행 가능 시간 범위에 있지 않습니다.
일감 가능 시간: %1$s ~ %2$s
시작 시간: %3$s |
| Exception.body.CANNOT_DEREGISTER_WITH_ACTIVE_TICKET | 진행 중인 일감이 있어
워크스페이스 등록을 해제할 수 없습니다. |
| Exception.body.EXPECTED_START_AT_TOO_EARLY | 가능한 시작 시간 보다 이른 시간입니다. |
| Exception.body.EXPECTED_START_AT_TOO_LATE | 가능한 시작 시간이 시작 기한을 초과합니다. |
| Exception.body.FIXED_KEEPER_CANNOT_CANCEL | 해당 일감은 지정 일감이기에 취소할 수 없습니다.
취소를 원하시면 담당자에게 연락 부탁드립니다. |
| Exception.body.KEEPER_ACCOUNT_INACTIVE | 키퍼의 계정이 비활성화 상태입니다. |
| Exception.body.KEEPER_HAS_ACTIVE_TICKET | 진행 중 혹은 진행 예정인 %1$s에 잡으신 일감(%2$s)가 있습니다. |
| Exception.body.KEEPER_HAS_ACTIVE_TICKET_CANNOT_DEACTIVATE | 해당 키퍼는 진행중인 일감이 있어 비활성화하거나 삭제 할 수 없습니다. |
| Exception.body.KEEPER_NOT_IN_GROUP | 키퍼가 해당 일감의 키퍼 그룹에 속하지 않습니다. |
| Exception.body.ONLY_OWNER_WORKSPACE_CAN_MODIFY | 해당 지점의 소유 워크스페이스만 변경할 수 있습니다. |
| Exception.body.ROOM_SCHEDULE_CONFLICT | 해당 시간에 앞선 공간 스케줄이 있습니다. |
| Exception.body.TICKET_SCHEDULE_CONFLICT | 해당 시간에 다른 일감 스케줄이 있습니다. |
| Exception.body.ALREADY_ASSIGNED_TO_OTHER_KEEPER | 이미 다른 키퍼에게 배정된 일감입니다. |
| Exception.body.INVALID_PREV_TICKET_STATUS | 잘못된 이전 일감 상태입니다. |
| Exception.body.INVALID_TICKET_STATUS_TRANSITION | 일감 상태는 %s 여야 합니다. |
| Exception.body.KEEPER_NOT_ASSIGNED_TO_TICKET | 해당 키퍼는 해당 일감을 배정 받지 않았습니다. |
| Exception.body.TICKET_STATUS_NOT_CANCELED | 일감 상태가 취소 상태가 아닙니다. 현재 상태: %s |
| Exception.body.TODO_NOT_COMPLETED | 모든 일감 내에 체크리스트 완료가 되어야 합니다. |
| Exception.body.NOT_FOUND_MULTIMEDIA_SOURCE | 멀티미디어 소스를 찾을 수 없습니다. |
| Exception.body.MULTIMEDIA_SOURCE_FILE_NOT_FOUND | 멀티미디어 파일을 찾을 수 없습니다. |
| Exception.body.MULTIMEDIA_SOURCE_INVALID_TARGET_USAGE_TYPE | 잘못된 멀티미디어 소스입니다. |
| Exception.body.MULTIMEDIA_SOURCE_ALREADY_DELETED | 이미 삭제된 멀티미디어 소스입니다. |
| Exception.body.TICKET_REPORT_ALREADY_REPLIED | 이미 회신이 등록된 보고사항입니다. |
| Exception.body.TICKET_REPORT_INVALID_STATUS_FOR_REPLY | 회신할 수 없는 상태입니다. 회신은 접수, 보류 상태에서만 가능합니다. |
| Exception.body.TICKET_REPORT_NOT_REPLIED | 회신이 등록되지 않은 보고사항입니다. |
| Exception.body.TICKET_REPORT_REPLY_CONTENT_TOO_LONG | 피드백 내용은 300자 이하로 입력해주세요. |
| Enums.DocRequestType.TICKETS | 수행 목록 |
| Enums.DocRequestType.TICKET_CLAIMS | 클레임 목록 |
| Exception.body.NOT_FOUND_KEEPER_GROUP | 키퍼 그룹을 찾을 수 없습니다. |
| IndicatorApi.WrongReason.KEEPER_LEVEL_POINT_AMOUNT_MIN | 레벨업 기준 경험치는 1 이상이어야 합니다. |
| Exception.body.KEEPER_LEVEL_POINT_AMOUNT_ALREADY_EXISTS | 동일한 레벨업 기준 경험치가 이미 존재합니다 |
| Exception.body.KEEPER_LEVEL_POINT_AMOUNT_MIN | 레벨업 기준 경험치는 1 이상이어야 합니다. |
| Exception.body.NOT_FOUND_ROOM_SCHEDULE | 공간 스케줄을 찾을 수 없습니다. |
| Exception.body.STAYOVER_CLEAN_RULE_ALREADY_EXISTS | 해당 지점에 이미 재실청소 규칙이 존재합니다. |
| Exception.body.STAYOVER_CLEAN_RULE_INVALID_HOUR_OF_DAY | 일감 생성 시각(시)은 0~23 사이여야 합니다. |
| Exception.body.STAYOVER_CLEAN_RULE_INVALID_MINIMUM_STAY_NIGHTS | 최소 숙박 조건은 1~30 사이여야 합니다. |
| Exception.body.STAYOVER_CLEAN_RULE_INVALID_MINUTE_OF_HOUR | 일감 생성 시각(분)은 0~59 사이여야 합니다. |
| Exception.body.STAYOVER_CLEAN_RULE_INVALID_TICKET_TYPE | 재실청소 규칙은 공간 사용 내에도 생성 가능한 일감 유형만 사용할 수 있습니다. |
| Exception.body.STAYOVER_CLEAN_RULE_NOT_FOUND | 재실청소 규칙을 찾을 수 없습니다. |
| Exception.body.STAYOVER_CLEAN_RULE_ALREADY_DELETED | 이미 삭제된 재실청소 규칙입니다. |
| Exception.body.STAYOVER_CLEAN_PLAN_NOT_FOUND | 재실청소 생성 예정을 찾을 수 없습니다. |
| Exception.body.STAYOVER_CLEAN_PLAN_INVALID_STATUS_TRANSITION | 현재 상태에서는 변경할 수 없습니다. |
| Exception.body.STAYOVER_CLEAN_RULE_INVALID_INTERVAL_DAYS | 재실청소 생성 주기는 1일 이상이어야 합니다. |
| Enums.PresetExcelParsingErrorType.EXCEEDED_MAX_FILE_SIZE | 허용된 파일 용량을 초과하였습니다 |
| Enums.PresetExcelParsingErrorType.UNSUPPORTED_FILE_FORMAT | 지원하지 않는 파일 형식입니다 |
| Enums.PresetExcelParsingErrorType.SHEET_NOT_FOUND | 시트가 존재하지 않습니다 |
| Enums.PresetExcelParsingErrorType.HEADER_MISSING | 필수 헤더가 누락되었습니다 |
| Enums.PresetExcelParsingErrorType.HEADER_ORDER_MISMATCH | 헤더 순서가 양식과 일치하지 않습니다 |
| Enums.PresetExcelParsingErrorType.HEADER_NAME_MISMATCH | 헤더 이름이 양식과 일치하지 않습니다 |
| Enums.PresetExcelParsingErrorType.DATA_EMPTY | 파일에 데이터가 존재하지 않습니다 |
| Enums.PresetExcelParsingErrorType.ROW_COUNT_EXCEEDED | 최대 행수를 초과했습니다 |
| Enums.PresetExcelSkipType.DUPLICATE_PRESET | 생성 유형과 이름 조합 중복 |
| Enums.PresetExcelSkipType.DUPLICATE_PROPERTY_REGISTRATION | 공간 타입, 구역, 공간자산속성 조합 중복 |
| Enums.PresetExcelSkipType.DUPLICATE_ITEM_REGISTRATION | 공간 타입, 구역, 공간소모품속성 조합 중복 |
| Enums.PresetExcelValidationErrorTypeINVALID_PRESET_TYPE | 생성 유형 값이 유효하지 않습니다 |
| Enums.PresetExcelValidationErrorTypeNAME_EMPTY | 이름이 비어있습니다 |
| Enums.PresetExcelValidationErrorTypeNAME_TOO_SHORT | 이름은 2자 이상이어야 합니다 |
| Enums.PresetExcelValidationErrorTypeNAME_TOO_LONG | 이름은 30자 이하여야 합니다 |
| Enums.PresetExcelValidationErrorTypeNAME_INITIAL_CONSONANT | 이름에 자음 또는 모음만 단독으로 사용할 수 없습니다 |
| Enums.PresetExcelValidationErrorTypeDESCRIPTION_TOO_LONG | 설명은 50자 이하여야 합니다 |
| Enums.PresetExcelValidationErrorTypeROOM_CATEGORY_NOT_FOUND | 지점에 존재하지 않는 공간타입명입니다 |
| Enums.PresetExcelValidationErrorTypePRESET_NAME_REQUIRED | 구역 목록명은 필수 입력값입니다 |
| Enums.PresetExcelValidationErrorTypePRESET_NOT_FOUND | 프리셋생성양식에 해당하는 이름이 없습니다 |
| Enums.PresetExcelValidationErrorTypePRESET_INVALID | 프리셋생성양식에서 유효하지 않은 프리셋명입니다 |
| Enums.PresetExcelValidationErrorTypeCOUNT_INVALID | 배정수는 1 이상의 숫자여야 합니다 |
| Enums.PresetExcelValidationErrorTypeCOUNT_EXCEEDED | 배정수가 상한선을 초과했습니다 |
| Enums.PresetExcelValidationErrorTypeDATA_EMPTY | 파일에 데이터가 존재하지 않습니다 |
| Enums.PresetExcelValidationErrorTypeROW_COUNT_EXCEEDED | 최대 행수를 초과했습니다 |
| Exception.body.EMPTY_FILE | 파일이 존재하지 않습니다 |

---

### FE 화면 라벨 원문 (admin_lokalise.csv)

> 유효 행: 1433 | 열: key, ko, tags2, notes

#### 공간정보

| key | ko | notes |
|---|---|---|
| 공간정보.헤더.더보기.텍스트 | {length}개 더 보기 |  |
| 공간정보.모달.지점목록.제목 | 지점 목록 |  |

#### 공간정보.공간관리

| key | ko | notes |
|---|---|---|
| 공간타입관리.모달.공간타입삭제.에러 | 공간 타입 삭제 실패 |  |
| 공간타입관리.모달.공간타입추가.에러 | 공간 타입 추가 실패 |  |
| 공간타입관리.모달.공간타입수정.에러 | 공간 타입 수정 실패 |  |
| 공간관리.모달.공간삭제실패.에러 | 공간 삭제 실패 |  |
| 공간관리.모달.공간수정실패.에러 | 공간 수정 실패 |  |
| 공간관리.모달.공간추가실패.에러 | 공간 추가 실패 |  |
| 공간관리.스낵바.공간상태변경.에러 | 공간 상태 변경 실패 |  |
| 공간관리.스낵바.공간제외실패.에러 | 공간 제외 실패 |  |
| 공간관리.버튼.공간추가.텍스트 | 공간 추가 |  |
| 공간관리.버튼.공간타입추가.텍스트 | 공간 타입 추가 |  |
| 공간타입관리.타이포.공간타입없음.텍스트 | 등록된 공간 타입이 없습니다 |  |
| 공간관리.모달.비밀번호는자리.유효성 | 비밀번호는 4자리 이상 입력해 주세요. |  |
| 공간관리.셀렉트.삭제됨.텍스트 | 삭제됨 |  |
| 공간관리.모달.숫자및특수문.유효성 | 숫자 및 *, # 만 입력할 수 있습니다. |  |
| 공간관리.타이포.공간없음.텍스트 | 아직 생성된 공간 정보가 없습니다. 우측 상단 '공간 추가' 를 통해 생성해 주세요. |  |
| 공간타입관리.타이포.공간타입.제목 | 공간 타입 |  |
| 공간관리.타이포.연결한공간.제목 | 연결한 공간 |  |
| 공간관리.타이포.공간목록.제목 | 공간 목록 |  |
| 공간관리.모달.공간타입추가.제목 | 공간 타입 추가 |  |
| 공간타입관리.모달.공간타입수정.제목 | 공간 타입 수정 |  |
| 공간타입관리.모달.공간타입이름.라벨 | 공간 타입 이름 |  |
| 공통.라벨.지점선택 | 지점 선택 |  |
| 공간관리.모달.공간추가.제목 | 공간 추가 |  |
| 공간관리.모달.개별추가.라벨 | 개별 추가 |  |
| 공간관리.모달.일괄추가.라벨 | 일괄 추가 |  |
| 공간관리.모달.필수.안내 | *필수 |  |
| 공간관리.모달.공간이름.라벨 | 공간 이름 |  |
| 공간관리.모달.동.라벨 | 동 |  |
| 공간관리.모달.층.라벨 | 층 |  |
| 공간관리.모달.공간상태.라벨 | 공간 상태 |  |
| 공간관리.모달.마스터비밀번호.라벨 | 마스터 비밀번호 |  |
| 공간관리.모달.비밀번호.라벨 | 비밀번호 |  |
| 공간관리.모달.시작층.라벨 | 시작 층 |  |
| 공간관리.모달.마지막층.라벨 | 마지막 층 |  |
| 공간관리.모달.층당공간수.라벨 | 층당 공간 수 |  |
| 공간관리.모달.중복공간.제목 | 중복 공간 |  |
| 공간관리.모달.중복공간명목록.안내 | {duplicateRoomNames} 중복으로 제외 되었습니다. 총 {createdRoomNamesLength}개의 공간이 추가되었습니다. |  |
| 공간관리.모달.공간수정.제목 | 공간 수정 |  |
| 공간관리.모달.유의사항.라벨 | 유의사항 |  |
| 공간관리.모달.필수입력.유효성 | 필수 입력 |  |

#### 홈.대시보드

| key | ko | notes |
|---|---|---|
| 대시보드.헤더.건물번호.텍스트 | 건물번호 |  |
| 대시보드.타이포.오늘의할일.제목 | 오늘의 할 일 |  |
| 대시보드.타이포.처리필요.제목 | 처리 필요 |  |
| 대시보드.타이포.오늘의완성률.제목 | 오늘의 완성률 |  |
| 대시보드.타이포.업데이트.라벨 | 업데이트: |  |
| 대시보드.타이포.총.라벨 | 총 |  |
| 대시보드.타이포.수행완료.라벨 | 수행 완료 |  |
| 대시보드.타이포.미수행.라벨 | 미수행 |  |
| 대시보드.헤더.공간이름.텍스트 | 공간 이름 |  |
| 대시보드.셀렉트.공간이용임박순.텍스트 | 공간 이용 임박순 |  |
| 대시보드.타이포.관제사.라벨 | 관제사 |  |
| 대시보드.타이포.키퍼.라벨 | 키퍼 |  |
| 대시보드.툴팁.오늘의완성률.안내 | 오늘의 완성률이란? |  |
| 대시보드.툴팁.오늘예정된.안내 | - 오늘(00:00~23:59) 예정된 전체 일감 진행 현황을 수행 완료/미수행 상태로 구분하여 차트로 보여줍니다. |  |
| 대시보드.툴팁.집계대상.안내 | - 집계 대상: 시작 가능 일시가 오늘인 일감이 포함됩니다. 단, '보고됨' 상태의 이슈는 시작 가능 일시와 상관없이 모든 이슈가 포함됩니다. |  |
| 대시보드.툴팁.데이터갱신.안내 | - 데이터 갱신: 1분마다 자동으로 갱신되며, 필요 시 수동으로 새로고침 할 수 있습니다. |  |
| 대시보드.툴팁.총집계건수.안내 | 총 집계 건수 |  |
| 대시보드.툴팁.오늘의전체.안내 | 오늘의 전체 일감/이슈 건수입니다. (보고됨, 미배정, 배정됨, 수행전, 수행중, 완료 건) |  |
| 대시보드.툴팁.수행완료집계.안내 | 수행 완료 집계 기준 |  |
| 대시보드.툴팁.완료일감툴팁.안내 | 오늘의 완료 일감 건수입니다. |  |
| 대시보드.툴팁.미수행집계기준.안내 | 미수행 집계 기준 |  |
| 대시보드.툴팁.오늘의미수행.안내 | 오늘의 미수행 일감 건수입니다. (보고됨, 미배정, 배정됨, 수행전, 수행중 건) |  |
| 대시보드.셀렉트.관제자.텍스트 | 관제자 |  |
| 대시보드.버튼.새로고침.텍스트 | 새로고침 |  |
| 대시보드.헤더.생성일시.텍스트 | 생성 일시 |  |
| 대시보드.헤더.생성주체.텍스트 | 생성 주체 |  |
| 대시보드.셀렉트.오래된순.텍스트 | 오래된 순 |  |
| 대시보드.목록.처리대기중.텍스트 | 처리 대기 중인 항목이 없습니다. |  |
| 대시보드.셀렉트.최신등록순.텍스트 | 최신 등록순 |  |
| 대시보드.셀렉트.키퍼.텍스트 | 키퍼 |  |
| 대시보드.헤더.항목.텍스트 | 항목 |  |

