import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

let storeService: (typeof import('./storeService'))['storeService'];

beforeAll(async () => {
  ({ storeService } = await import('./storeService'));
});

beforeEach(() => {
  storeService.resetForDemo();
});

describe('safe death record void', () => {
  it('restores the livestock status, health status, and notes snapshot when voided', () => {
    const livestock = storeService.livestock.find(item => item.id === 'ls-002');
    expect(livestock).toBeDefined();
    const snapshot = {
      status: livestock!.status,
      healthStatus: livestock!.healthStatus,
      notes: livestock!.notes,
    };

    storeService.addDeathRecord({
      livestockId: livestock!.id,
      tagId: livestock!.tagId,
      deathDate: '2026-08-27',
      locationId: livestock!.locationId,
      locationName: livestock!.locationName,
      suspectedCause: 'Pemeriksaan awal keliru',
      officerName: 'Petugas Uji',
    });
    const death = storeService.deathRecords[0];
    expect(death.previousLivestockState).toEqual(snapshot);

    expect(storeService.voidDeathRecord(death.id, 'Data kematian salah input')).toBe(true);
    expect(storeService.livestock.find(item => item.id === livestock!.id)).toMatchObject(snapshot);
    expect(storeService.deathRecords[0]).toMatchObject({
      voidReason: 'Data kematian salah input',
      voidedBy: storeService.currentUser.displayName,
    });
    expect(storeService.auditLogs[0]).toMatchObject({ action: 'Void Kematian Ternak', targetId: death.id });
    expect(storeService.notifications[0].message).toContain('dibatalkan');
  });
});

describe('breeding lifecycle', () => {
  it('recalculates the mother breeding status after a breeding record is removed', () => {
    const mother = storeService.livestock.find(item => item.gender === 'Betina' && item.status === 'Aktif');
    expect(mother).toBeDefined();
    const previousBreedingStatus = mother!.breedingStatus;
    const record = storeService.addBreedingRecord({
      motherId: mother!.id,
      motherTag: mother!.tagId,
      fatherTag: 'DEMO-VIDEO-PEJANTAN',
      matingDate: '2026-08-27',
      method: 'Inseminasi Buatan (IB)',
      pregStatus: 'Positif',
      notes: 'DEMO-VIDEO breeding',
    });
    expect(storeService.livestock.find(item => item.id === mother!.id)?.breedingStatus).toBe('Bunting');
    expect(storeService.deleteBreedingRecord(record.id)).toBe(true);
    expect(storeService.livestock.find(item => item.id === mother!.id)?.breedingStatus).toBe(previousBreedingStatus);
  });
});


describe('feed inventory archive', () => {
  it('hides archived feed from the active inventory while preserving its history', () => {
    const feed = storeService.feedInventory[0];

    expect(storeService.archiveFeedInventory(feed.id)).toBe(true);
    expect(storeService.feedInventory.find(item => item.id === feed.id)).toMatchObject({
      archivedBy: storeService.currentUser.displayName,
    });
    expect(storeService.getActiveFeedInventory().some(item => item.id === feed.id)).toBe(false);
    expect(storeService.feedInventory.some(item => item.id === feed.id)).toBe(true);
    expect(storeService.auditLogs[0]).toMatchObject({ action: 'Arsip Stok Pakan', targetId: feed.id });
  });
});
