/** Soni HealthCare certificate register API.
 * Deploy as a Web App: Execute as ME; access ANYONE (anonymous public verification).
 * All mutations require a short-lived session token validated on the server.
 */
const CFG = {
  SHEET_ID_KEY: 'SHC_SPREADSHEET_ID',
  PASSWORD_HASH_KEY: 'SHC_ADMIN_PASSWORD_HASH',
  PASSWORD_SALT_KEY: 'SHC_ADMIN_PASSWORD_SALT',
  SESSION_PREFIX: 'SHC_SESSION_',
  SESSION_SECONDS: 1800,
  SHEET_NAME: 'Certificates'
};
const HEADERS = ['Certificate ID','Patient Name','Gender','Age','Issue Date','Reason (PRIVATE)','Treatment From','Treatment To','Rest Advice (PRIVATE)','Fit From','Doctor','Doctor Registration','Additional Note (PRIVATE)','Status','Created At'];

function setupClinic() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(CFG.SHEET_ID_KEY);
  let ss;
  if (id) ss = SpreadsheetApp.openById(id);
  else { ss = SpreadsheetApp.create('Soni HealthCare - Certificate Register'); props.setProperty(CFG.SHEET_ID_KEY, ss.getId()); }
  let sh = ss.getSheetByName(CFG.SHEET_NAME) || ss.insertSheet(CFG.SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#123d35').setFontColor('#ffffff');
  Logger.log('Certificate spreadsheet: ' + ss.getUrl());
  Logger.log('Next: set the admin password by running setInitialAdminPassword() after changing its placeholder.');
}

// CHANGE THE PLACEHOLDER before running this function once. Then remove the literal password.
function setInitialAdminPassword() {
  const initialPassword = 'CHANGE-THIS-TO-A-LONG-UNIQUE-PASSWORD';
  if (initialPassword === 'CHANGE-THIS-TO-A-LONG-UNIQUE-PASSWORD' || initialPassword.length < 14) throw new Error('Edit initialPassword to a unique password of at least 14 characters, then run again.');
  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = passwordHash_(initialPassword, salt);
  const props = PropertiesService.getScriptProperties();
  props.setProperty(CFG.PASSWORD_SALT_KEY, salt);
  props.setProperty(CFG.PASSWORD_HASH_KEY, hash);
  Logger.log('Password hash saved. Remove the plaintext password from this function and save the project.');
}

function doGet() { return HtmlService.createHtmlOutput('Soni HealthCare API is running.'); }
function doPost(e) {
  let nonce = '';
  let result;
  try {
    const p = (e && e.parameter) || {};
    nonce = String(p.nonce || '');
    if (!/^[a-f0-9-]{30,40}$/i.test(nonce)) throw new Error('Invalid request.');
    const data = JSON.parse(p.payload || '{}');
    result = route_(String(p.action || ''), data);
  } catch (err) { result = {ok:false,error:safeMessage_(err)}; }
  const json = JSON.stringify({channel:'soni-healthcare-api',nonce:nonce,result:result}).replace(/</g,'\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><html><body><script>window.top.postMessage(' + json + ', "*");</script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function route_(action, d) {
  if (action === 'login') return login_(d.password);
  if (action === 'verify') return verify_(d.certificateId);
  if (action === 'list') { requireSession_(d.token); return {ok:true,certificates:list_()}; }
  if (action === 'create') { requireSession_(d.token); return create_(d.certificate || {}); }
  if (action === 'revoke') { requireSession_(d.token); return revoke_(d.certificateId); }
  throw new Error('Unknown action.');
}
function login_(password) {
  const props = PropertiesService.getScriptProperties();
  const salt = props.getProperty(CFG.PASSWORD_SALT_KEY), expected = props.getProperty(CFG.PASSWORD_HASH_KEY);
  if (!salt || !expected) throw new Error('Admin password is not configured. Follow SETUP.md.');
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock(); lock.waitLock(5000);
  try {
    const fails = Number(cache.get('SHC_LOGIN_FAILS') || 0);
    if (fails >= 8) throw new Error('Too many failed attempts. Try again in 15 minutes.');
    const actual = passwordHash_(String(password || ''), salt);
    if (!constantTimeEqual_(actual, expected)) { cache.put('SHC_LOGIN_FAILS', String(fails + 1), 900); throw new Error('Incorrect password.'); }
    cache.remove('SHC_LOGIN_FAILS');
  } finally { lock.releaseLock(); }
  const token = Utilities.getUuid() + Utilities.getUuid();
  cache.put(CFG.SESSION_PREFIX + sha256_(token), '1', CFG.SESSION_SECONDS);
  return {ok:true,token:token,expiresIn:CFG.SESSION_SECONDS};
}
function requireSession_(token) {
  if (!token || !CacheService.getScriptCache().get(CFG.SESSION_PREFIX + sha256_(String(token)))) throw new Error('Session expired. Please sign in again.');
}
function verify_(id) {
  id = String(id || '').trim(); if (!id) throw new Error('Enter a certificate ID.');
  const row = findRow_(id);
  if (!row) return {ok:true,certificate:null};
  // Do not disclose diagnosis, reason, age, treatment dates, rest advice or notes publicly.
  return {ok:true,certificate:{certificateId:row[0],patientName:row[1],issueDate:row[4],doctorName:row[10],status:row[13]}};
}
function create_(c) {
  const required = ['patientName','gender','issueDate','reason','doctor','doctorReg'];
  required.forEach(k => { if (!String(c[k] || '').trim()) throw new Error('Please complete all required fields.'); });
  if (String(c.patientName).length > 100 || String(c.reason).length > 500) throw new Error('One or more fields exceed the allowed length.');
  if (!['Male','Female','Other'].includes(c.gender)) throw new Error('Select a valid gender.');
  const sh = sheet_();
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const year = String(new Date().getFullYear());
    // Random suffix prevents easy guessing/enumeration of public verification IDs.
    const id = 'SHC-' + year + '-' + Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase();
    sh.appendRow([id,clean_(c.patientName,100),clean_(c.gender,12),clean_(c.age,3),clean_(c.issueDate,10),clean_(c.reason,500),clean_(c.treatmentFrom,10),clean_(c.treatmentTo,10),clean_(c.restAdvice,500),clean_(c.fitFrom,10),clean_(c.doctor,80),clean_(c.doctorReg,30),clean_(c.notes,300),'VALID',new Date()]);
    return {ok:true,certificate:{certificateId:id,patientName:c.patientName,issueDate:c.issueDate,doctorName:c.doctor,status:'VALID'}};
  } finally { lock.releaseLock(); }
}
function list_() {
  const sh = sheet_(), values = sh.getDataRange().getValues();
  return values.slice(1).reverse().slice(0,100).map(r=>({certificateId:r[0],patientName:r[1],issueDate:r[4],doctorName:r[10],status:r[13]}));
}
function revoke_(id) {
  const row = findRow_(id); if (!row) throw new Error('Certificate not found.');
  const sh = sheet_(); sh.getRange(row._row,14).setValue('REVOKED');
  return {ok:true};
}
function findRow_(id) {
  const sh = sheet_(), last = sh.getLastRow(); if (last < 2) return null;
  const found = sh.getRange(2,1,last-1,1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  if (!found) return null;
  const rowNum = found.getRow(), row = sh.getRange(rowNum,1,1,HEADERS.length).getValues()[0]; row._row = rowNum; return row;
}
function sheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(CFG.SHEET_ID_KEY);
  if (!id) throw new Error('Run setupClinic() first.');
  const ss = SpreadsheetApp.openById(id); return ss.getSheetByName(CFG.SHEET_NAME);
}
function clean_(v,max) { return String(v == null ? '' : v).replace(/[\\r\\n]+/g,' ').trim().slice(0,max); }
function passwordHash_(password,salt) { return sha256_(salt + ':' + password); }
function sha256_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join(''); }
function constantTimeEqual_(a,b) { if (a.length !== b.length) return false; let n=0; for(let i=0;i<a.length;i++) n |= a.charCodeAt(i)^b.charCodeAt(i); return n===0; }
function safeMessage_(e) { const m=String(e && e.message || 'Request failed.'); return m.length>180?m.slice(0,180):m; }
