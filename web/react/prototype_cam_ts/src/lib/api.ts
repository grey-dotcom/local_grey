// ============================================================
// Flutter ApiService 대응 — mock 모드 기본 (실서버 연동 시 _mockMode = false)
// ============================================================

const BASE_URL = 'https://api.your-backend.com';
const MOCK_MODE = true;

export interface UploadResult {
  id: string;
  url?: string;
  itemId: string;
  groupId: string;
  capturedAt: string;
}

class ApiService {
  private static _instance: ApiService;
  static get instance(): ApiService {
    if (!ApiService._instance) ApiService._instance = new ApiService();
    return ApiService._instance;
  }

  async uploadCapture(params: {
    dataUrl: string;
    itemId: string;
    groupId: string;
  }): Promise<UploadResult> {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 600));
      return {
        id: `mock_${Date.now()}`,
        url: `https://mock-storage.example.com/${params.itemId}.jpg`,
        itemId: params.itemId,
        groupId: params.groupId,
        capturedAt: new Date().toISOString(),
      };
    }

    // [BE 인수인계] 실서버 연동 시 아래 코드로 교체
    const blob = await fetch(params.dataUrl).then(r => r.blob());
    const form = new FormData();
    form.append('file', blob, `${params.itemId}_${Date.now()}.jpg`);
    form.append('item_id', params.itemId);
    form.append('group_id', params.groupId);
    form.append('captured_at', new Date().toISOString());

    const res = await fetch(`${BASE_URL}/api/v1/captures`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(`업로드 실패: ${res.status}`);
    const json = await res.json();
    return {
      id: json.id,
      url: json.url,
      itemId: json.item_id ?? params.itemId,
      groupId: json.group_id ?? params.groupId,
      capturedAt: json.captured_at ?? new Date().toISOString(),
    };
  }
}

export const apiService = ApiService.instance;
