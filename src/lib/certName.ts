// ============================================================================
//  certName — cipher เบาๆ สำหรับ "ชื่อจริงบนเกียรติบัตร" ใน localStorage
//
//  ⚠️ นี่คือ OBFUSCATION ไม่ใช่ crypto จริง — key อยู่ใน client bundle
//     กันแค่คนเปิด DevTools เห็นชื่อจริงเป็นข้อความตรงๆ
//     เกราะความเป็นส่วนตัวจริงคือ "ไม่ส่งชื่อจริงออกจากเครื่อง" (local-only)
//
//  รองรับภาษาไทย: เข้ารหัสที่ระดับ byte (UTF-8) ก่อน base64
// ============================================================================

const KEY = 'saynovaping-cert-2024'; // key คงที่ (obfuscation)

// base64 ที่ปลอดภัยกับ UTF-8 (btoa รับเฉพาะ latin1)
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function xor(bytes: Uint8Array): Uint8Array {
  const key = new TextEncoder().encode(KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return out;
}

/** plaintext → ciphertext (เก็บลง localStorage) */
export function encodeName(plain: string): string {
  if (!plain) return '';
  try {
    const bytes = new TextEncoder().encode(plain);
    return bytesToB64(xor(bytes));
  } catch {
    return '';
  }
}

/** ciphertext → plaintext (อ่านจาก localStorage) */
export function decodeName(cipher: string): string {
  if (!cipher) return '';
  try {
    return new TextDecoder().decode(xor(b64ToBytes(cipher)));
  } catch {
    return '';
  }
}
