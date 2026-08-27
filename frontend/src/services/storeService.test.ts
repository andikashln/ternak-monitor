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

describe('birth lifecycle', () => {
  it('stores a typed birth event and archives its offspring when voided', () => {
    const mother = storeService.livestock.find(item => item.gender === 'Betina' && item.status === 'Aktif')!;
    const birth = storeService.addBirthRecord({
      motherId: mother.id,
      motherTag: mother.tagId,
      locationId: mother.locationId,
      gender: 'Betina',
      birthDate: '2026-08-26',
      birthWeightKg: 29,
      condition: 'DEMO-VIDEO sehat',
    });

    expect(birth).toMatchObject({ motherId: mother.id, birthDate: '2026-08-26', birthWeightKg: 29 });
    expect(storeService.livestock.find(item => item.id === birth.offspringId)).toMatchObject({
      dob: '2026-08-26',
      source: 'Kelahiran Kandang',
    });
    expect(storeService.voidBirthRecord(birth.id, 'Duplikat pencatatan')).toBe(true);
    expect(storeService.birthRecords[0]).toMatchObject({ voidReason: 'Duplikat pencatatan' });
    expect(storeService.livestock.find(item => item.id === birth.offspringId)).toMatchObject({
      status: 'Keluar',
      deletedBy: storeService.currentUser.displayName,
    });
    expect(storeService.getActiveLivestock().some(item => item.id === birth.offspringId)).toBe(false);
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

describe('daily report lifecycle', () => {
  it('allows draft edits and archive but protects approved reports', () => {
    const draft = storeService.addDailyReport({
      date: '2026-08-27', locationId: 'loc-001', locationName: 'Kandang Pusat Pekanbaru',
      popInitial: 10, popPurchase: 0, popBirth: 0, popTransferIn: 0, popSales: 0, popDeath: 0, popTransferOut: 0,
      healthyCount: 10, sickCount: 0, isolationCount: 0, inTreatmentCount: 0,
      activitiesText: 'DEMO-VIDEO awal', expensesList: [], photos: [], officerNotes: 'Catatan petugas',
      reportStatus: 'Draft', createdBy: 'Petugas Uji',
    });
    expect(storeService.updateDailyReport(draft.id, { activitiesText: 'DEMO-VIDEO revisi' })).toBe(true);
    expect(storeService.archiveDailyReport(draft.id)).toBe(true);

    const approved = storeService.dailyReports.find(item => item.id !== draft.id)!;
    storeService.updateDailyReportStatus(approved.id, 'Disetujui', 'Owner Uji');
    expect(storeService.updateDailyReport(approved.id, { activitiesText: 'Tidak boleh' })).toBe(false);
    expect(storeService.archiveDailyReport(approved.id)).toBe(false);
  });
});

describe('location lifecycle', () => {
  it('updates location fields and rejects deactivation while dependencies exist', () => {
    const occupied = storeService.locations.find(location =>
      storeService.getActiveLivestock().some(item => item.locationId === location.id))!;
    expect(storeService.updateLocation(occupied.id, { picName: 'DEMO-VIDEO PIC' })).toBe(true);
    expect(storeService.deactivateLocation(occupied.id)).toMatchObject({ ok: false });

    storeService.addLocation({ name: 'DEMO-VIDEO Kosong', address: '-', picName: 'PIC', picPhone: '-', livestockTypes: ['Sapi'], penCount: 0, status: 'Aktif' });
    const empty = storeService.locations.find(item => item.name === 'DEMO-VIDEO Kosong')!;
    expect(storeService.deactivateLocation(empty.id)).toEqual({ ok: true });
    expect(storeService.locations.find(item => item.id === empty.id)?.status).toBe('Nonaktif');
  });
});

describe('safe sale void', () => {
  it('restores livestock snapshots and reverses exactly its linked finance entry', () => {
    const animal = storeService.getActiveLivestock()[0];
    const snapshot = { status: animal.status, notes: animal.notes };
    const unrelatedFinanceIds = storeService.financialTransactions.map(item => item.id);
    const sale = storeService.addSalesTransaction({
      invoiceNo: 'DEMO-VIDEO-SALE', date: '2026-08-27', buyerName: 'Pembeli Demo', buyerPhone: '-',
      livestockIds: [animal.id], weightTotalKg: animal.currentWeightKg, priceTotal: 20_000_000,
      paymentMethod: 'Tunai', paymentStatus: 'Lunas', locationId: animal.locationId,
      locationName: animal.locationName ?? '-', salesRep: 'Petugas Uji', transactionStatus: 'Selesai', createdBy: 'Petugas Uji',
    });
    expect(sale.linkedFinanceTransactionIds).toHaveLength(1);
    expect(storeService.voidSalesTransaction(sale.id, 'Pembeli membatalkan')).toBe(true);
    expect(storeService.livestock.find(item => item.id === animal.id)).toMatchObject(snapshot);
    expect(storeService.salesRecords.find(item => item.id === sale.id)).toMatchObject({ transactionStatus: 'Batal', voidReason: 'Pembeli membatalkan' });
    expect(storeService.financialTransactions.filter(item => sale.linkedFinanceTransactionIds.includes(item.id))).toHaveLength(0);
    expect(unrelatedFinanceIds.every(id => storeService.financialTransactions.some(item => item.id === id))).toBe(true);
  });
});
