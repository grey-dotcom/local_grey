import type { TaskGroup } from './types';

export const taskGroups: TaskGroup[] = [
  {
    id: "G001",
    name: "침실 / 거실",
    tasks: [
      {
        id: "T001_01",
        title: "침실공간",
        description: "침구류의 정돈 상태와 주변 가구의 청결도가 모두 확인되도록 넓은 화각으로 촬영해주세요. 특히 베개 커버의 주름이나 바닥의 이물질이 없는지 꼼꼼히 점검한 후 정면에서 찍어주셔야 합니다.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T001_02",
        title: "옷장",
        description: "옷장 문을 열고 내부 옷걸이와 가운 등 비품이 잘 보이게 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T001_03",
        title: "룸 쓰레기통",
        description: "쓰레기통 내부가 비워져 있는지 위에서 아래 방향으로 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T001_04",
        title: "거실",
        description: "소파, 테이블 등 거실 전체 가구 배치가 한눈에 들어오도록 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T001_05",
        title: "TV",
        description: "TV 전원을 켜서 작동 여부를 확인하고, 리모컨 위치가 보이게 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T001_06",
        title: "내부 발코니/창",
        description: "커튼을 완전히 걷고 창틀의 먼지 제거 상태가 확인되도록 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T001_07",
        title: "외부 발코니",
        description: "테라스 바닥과 난간 상태가 보이도록 전체 전경을 촬영하세요.",
        status: 'pending',
        requirement: "optional", 
      }
    ]
  },
  {
    id: "G002",
    name: "주방",
    tasks: [
      {
        id: "T002_01",
        title: "주방 싱크대",
        description: "상부장과 하부장 문을 모두 열어 내부에 비치된 식기류와 냄비 등이 빠짐없이 보이도록 전체적인 샷을 촬영해주세요. 내부에 물기가 남아있지 않은지 확인하는 것이 필수입니다.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T002_02",
        title: "싱크대 배수구",
        description: "배수구 망 내부의 음식물 찌꺼기가 완벽히 제거되었는지 가까이서 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T002_03",
        title: "세탁기와 세제구",
        description: "세탁기 도어와 세제 투입구를 열어 잔여물이 없는지 확인되도록 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T002_04",
        title: "냉장/냉동고",
        description: "냉장고 문을 열어 기본 제공되는 생수 세팅 상태와 내부 청결도를 촬영하세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T002_05",
        title: "커피 스테이션",
        description: "커피 머신과 포트 주변의 물기 제거 상태와 캡슐 등 비품을 촬영하세요.",
        status: 'pending',
        requirement: "required",
      }
    ]
  },
  {
    id: "G003",
    name: "화장실",
    tasks: [
      {
        id: "T003_01",
        title: "세면대",
        description: "세면대 볼 내부의 물기와 머리카락 등 오염 물질이 완벽히 제거되었는지 확인되도록 촬영해주세요. 거울의 얼룩 여부와 비누, 양치컵 등 어메니티 세팅 상태가 모두 앵글에 담겨야 합니다.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T003_02",
        title: "변기와 화장실 쓰레기통",
        description: "변기 커버를 열고 안쪽 물때 제거 상태와 옆의 쓰레기통 비움 상태를 함께 찍어주세요.",
        status: 'pending',
        requirement: "required",
      },
      {
        id: "T003_03",
        title: "샤워실",
        description: "샤워 부스 유리의 물때와 바닥 배수구의 머리카락 제거 상태를 촬영하세요.",
        status: 'pending',
        requirement: "required",
      }
    ]
  },
  {
    id: "G004",
    name: "현관",
    tasks: [
      {
        id: "T004_01",
        title: "신발장",
        description: "신발장 내부 전체를 촬영해주세요.",
        status: 'pending',
        requirement: "required",
      }
    ]
  }
];
