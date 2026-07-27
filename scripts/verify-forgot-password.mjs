// Xác minh luồng "Quên mật khẩu".
// Phần A (luôn chạy): kiểm thử LOGIC lõi — sinh mật khẩu -> hash bcrypt -> đăng nhập lại được.
// Phần B (nếu DB có bảng users): kiểm thử round-trip cập nhật password_hash trên DB thật.
// Chạy: node scripts/verify-forgot-password.mjs
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf-8');
  SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1].trim() || '';
  SUPABASE_SERVICE_ROLE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1].trim() || '';
}

let failures = 0;
function assert(name, cond, detail = '') {
  console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!cond) failures++;
}

// Bản sao logic sinh mật khẩu trong src/app/api/auth/forgot-password/route.ts
function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function testLogic() {
  console.log('\n=== PHẦN A: Kiểm thử LOGIC lõi (không phụ thuộc DB) ===');
  const newPassword = generatePassword();
  assert('Sinh mật khẩu mới đúng 8 ký tự', newPassword.length === 8, newPassword);
  assert('Mật khẩu chỉ gồm ký tự an toàn (không dấu, không O/0/I/l/1)', /^[A-HJ-NP-Za-hj-np-z2-9]+$/.test(newPassword));

  const hash = await bcrypt.hash(newPassword, 12);
  assert('Hash bằng bcrypt cost 12 (prefix $2b$12$)', hash.startsWith('$2b$12$') || hash.startsWith('$2a$12$'), hash.slice(0, 7));

  const matchNew = await bcrypt.compare(newPassword, hash);
  assert('Đăng nhập được bằng MẬT KHẨU MỚI (bcrypt.compare = true)', matchNew === true);

  const matchWrong = await bcrypt.compare(newPassword + 'x', hash);
  assert('Mật khẩu SAI bị từ chối (bcrypt.compare = false)', matchWrong === false);
}

async function testDb() {
  console.log('\n=== PHẦN B: Round-trip trên DB thật ===');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⏭️  Bỏ qua: thiếu credentials Supabase trong .env.local');
    return;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Lấy 1 user bất kỳ để test round-trip
  const { data: users, error } = await supabase.from('users').select('id, email, password_hash').limit(1);
  if (error) {
    console.log(`⏭️  Bỏ qua: không truy vấn được bảng users (${error.message}). Có thể DB chưa seed schema.`);
    return;
  }
  if (!users || users.length === 0) {
    console.log('⏭️  Bỏ qua: bảng users rỗng, không có tài khoản để test.');
    return;
  }

  const user = users[0];
  const originalHash = user.password_hash;
  const newPassword = generatePassword();
  const newHash = await bcrypt.hash(newPassword, 12);

  const { error: upErr } = await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id);
  assert(`Cập nhật password_hash cho ${user.email}`, !upErr, upErr?.message || '');

  const { data: after } = await supabase.from('users').select('password_hash').eq('id', user.id).single();
  assert('Đăng nhập được bằng mật khẩu mới trên DB', await bcrypt.compare(newPassword, after.password_hash));

  // Khôi phục hash gốc
  const { error: restoreErr } = await supabase.from('users').update({ password_hash: originalHash }).eq('id', user.id);
  assert('Khôi phục password_hash gốc', !restoreErr, restoreErr?.message || '');
}

async function main() {
  await testLogic();
  await testDb();
  console.log('\n' + (failures === 0 ? '🎉 TẤT CẢ KIỂM TRA (đã chạy) PASS' : `⚠️ ${failures} kiểm tra THẤT BẠI`));
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error('❌ Lỗi chạy test:', e); process.exit(1); });
