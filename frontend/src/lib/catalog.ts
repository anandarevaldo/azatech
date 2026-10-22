const productVisuals = [
  { terms: ['kopi', 'aren'], image: 'https://i.gojekapi.com/darkroom/gofood-indonesia/v2/images/uploads/35b7370a-a805-4581-9869-4ef8d8bc1cd5_Go-Biz_20240926_173307.jpeg' },
  { terms: ['teh', 'melati'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/103/MTA-155875710/teh_pucuk_teh_pucuk_350ml_full01_5320d981.jpg' },
  { terms: ['granola'], image: 'https://id-live-01.slatic.net/p/6e3533a24b6f2ef1654ed2d4826965c4.png' },
  { terms: ['tempe'], image: 'https://pesonanusantara.co.id/images/upload/p/e/pes-kdr020037003944.jpg' },
  { terms: ['sambal'], image: 'https://pesonanusantara.co.id/images/upload/p/e/pes-kdr020037003944.jpg' },
  { terms: ['indomie', 'mie'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/resize/sedaap_sedaap_mie_kuah_kari_ayam_72_g_full01_k9qk6bnm.jpg' },
  { terms: ['air', 'mineral'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-4492431/aqua_aqua_air_mineral_botol_600_ml_full04_ol4hu7bg.webp' },
  { terms: ['sabun'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6920210/lifebuoy_lifebuoy_sabun_cuci_tangan_anti_bakteri_total_10_pump_200_ml_full02_ohax27q2.jpeg' },
  { terms: ['tisu'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/97/MTA-32835084/tessa_tessa_facial_tissue_-200_sheet-_full01_sfn2sfke.jpg' },
  { terms: ['beras', 'pandan'], image: 'https://down-id.img.susercontent.com/file/id-11134207-7r98u-lv99ptnu63ir63' },
  { terms: ['biskuit', 'gandum'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/102/MTA-45460649/roma_roma_sari_gandum_biskuit_240_gram_full01_jafsl0ag.jpg' },
  { terms: ['susu', 'uht'], image: 'https://down-id.img.susercontent.com/file/id-11134207-822wj-mlxlgdk7e0ase9' },
  { terms: ['cokelat', 'chocolate'], image: 'https://down-id.img.susercontent.com/file/id-11134207-822wj-mlxlgdk7e0ase9' },
  { terms: ['madu', 'honey'], image: 'https://id-live-01.slatic.net/p/6e3533a24b6f2ef1654ed2d4826965c4.png' },
  { terms: ['keripik', 'snack', 'piscok'], image: 'https://pesonanusantara.co.id/images/upload/p/e/pes-kdr020037003944.jpg' },
  { terms: ['minyak'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/86/MTA-3007416/bimoli_surabaya---bimoli-classic-minyak-goreng--1-l--botol-_full02.jpg' },
  { terms: ['pasta', 'gigi'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/97/MTA-5645455/PEPSODENT_Bandung_-_PEPSODENT_Natural_Herbal_Toothpaste_-120_g-_full01_pwx95t79.jpg' },
  { terms: ['roti'], image: 'https://image.astronauts.cloud/product-images/2024/10/SariRotiTawarGandum10Lembar400gram_5a795539-f8c1-4378-857c-dce70930ea80_900x900.jpg' },
  { terms: ['selai', 'kacang'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/106/MTA-181932928/selma_selma-peanut-butter-creamy-340gr_full01-00033060.jpg' },
  { terms: ['kecap'], image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/102/MTA-163814817/manisin_gula_aren_cair_500ml_simanis_full13_jxlvmfaj.jpg' },
];

export function getProductImage(name: string, imageUrl?: string | null): string {
  if (imageUrl) return imageUrl;
  const normalized = name.toLowerCase();
  return productVisuals.find((visual) => visual.terms.some((term) => normalized.includes(term)))?.image
    ?? 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-4492431/aqua_aqua_air_mineral_botol_600_ml_full04_ol4hu7bg.webp';
}

export function getCustomerAvatar(name: string, gender: 'PRIA' | 'WANITA'): string {
  const seed = [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % 50;
  return `https://randomuser.me/api/portraits/${gender === 'WANITA' ? 'women' : 'men'}/${seed || 1}.jpg`;
}

export function initials(name: string): string {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}
