import React, { useEffect, useMemo, useRef, useState } from 'react';

import { createRoot } from 'react-dom/client';

import jsPDF from 'jspdf';

import QRCode from 'qrcode';

import { Activity, ArrowRight, BadgeCheck, CalendarDays, Clock3, FileCheck2, HeartPulse, LockKeyhole, MapPin, Menu, ShieldCheck, Stethoscope, X } from 'lucide-react';

import './style.css';



const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

const BASE = '/soni-healthcare/';

const clinic = { phone: '8266842271', address: 'Laksar Road, Dhandhera', morning: '10:00 AM – 2:00 PM', evening: '5:00 PM – 8:30 PM' };

const dateToday = () => new Date().toISOString().slice(0,10);



const getRoute = () => location.hash.slice(1).replace('/', '').split('?')[0] || '';

const qs = new URLSearchParams(location.hash.includes('?') ? location.hash.split('?').slice(1).join('?') : location.search);



function maskPatientName(name = '') {

  return String(name)

    .trim()

    .split(/\s+/)

    .map(word => {

      if (!word) return '';

      return word[0].toUpperCase() + '*'.repeat(word.length - 1);

    })

    .join(' ');

}

function api(action, data={}) {

  if (!API_URL) return Promise.reject(new Error('Apps Script URL is not configured. Follow SETUP.md.'));

  return new Promise((resolve,reject)=>{

    const nonce = crypto.randomUUID();

    const iframe = document.createElement('iframe'); iframe.name = `shc_frame_${nonce}`; iframe.hidden = true;

    const form = document.createElement('form'); form.method='POST'; form.action=API_URL; form.target=iframe.name; form.style.display='none';

    const fields={action, payload:JSON.stringify(data), nonce};

    Object.entries(fields).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input)});

    const cleanup=()=>{window.removeEventListener('message',onMessage);form.remove();iframe.remove();clearTimeout(timer)};

    const onMessage=(event)=>{const msg=event.data;if(!msg||msg.channel!=='soni-healthcare-api'||msg.nonce!==nonce)return;cleanup();msg.result?.ok?resolve(msg.result):reject(new Error(msg.result?.error||'Request failed'))};

    const timer=setTimeout(()=>{cleanup();reject(new Error('The clinic service did not respond. Check Apps Script deployment and try again.'))},25000);

    window.addEventListener('message',onMessage);document.body.append(iframe,form);form.submit();

  });

}



function App(){

 const [route,setRoute]=useState(getRoute());

 const [mobile,setMobile]=useState(false);

 useEffect(()=>{const fn=()=>setRoute(getRoute());window.addEventListener('popstate',fn);window.addEventListener('hashchange',fn);return()=>{window.removeEventListener('popstate',fn);window.removeEventListener('hashchange',fn)}},[]);

 const go=(path)=>{history.pushState({},'',BASE+(path?'#/'+path:''));setRoute(path);setMobile(false);window.scrollTo(0,0)};

 if(route==='verify') return <VerifyPage go={go}/>;

 if(route==='admin') return <AdminPage go={go}/>;

 return <Home go={go} mobile={mobile} setMobile={setMobile}/>;

}



function Header({go,mobile,setMobile}){return <header className="header"><div className="nav wrap"><button className="brand" onClick={()=>go('')}><img src={`${BASE}assets/logo.png`} /><span>SONI <b>HEALTHCARE</b><small>Your Companion for Better Health</small></span></button><button className="hamb" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button><nav className={mobile?'open':''}><a href="#about" onClick={()=>setMobile(false)}>About</a><a href="#doctors" onClick={()=>setMobile(false)}>Our Doctors</a><a href="#hours" onClick={()=>setMobile(false)}>Visiting Hours</a><button className="nav-cta" onClick={()=>go('admin')}>Doctor Login <ArrowRight size={16}/></button></nav></div></header>}

function Home({go,mobile,setMobile}){return <><Header go={go} mobile={mobile} setMobile={setMobile}/><main><section className="hero"><div className="wrap hero-grid"><div><span className="eyebrow"><HeartPulse size={15}/> CARE WITH COMPASSION</span><h1>Your health.<br/><em>Our priority.</em></h1><p>Soni HealthCare is here to support your wellbeing with attentive, patient-focused care.</p><div className="hero-actions"><a className="primary" href={`tel:${clinic.phone}`}>Call {clinic.phone}</a><a className="secondary" href="#doctors">Meet our doctors <ArrowRight size={16}/></a></div><div className="trust"><ShieldCheck size={17}/> Patient-first care <span/> Convenient clinic hours</div></div><div className="hero-card"><img src={`${BASE}assets/logo.png`}/><div className="hero-card-caption"><span>SONI HEALTHCARE</span><small>Your Companion for Better Health</small></div></div></div></section><section className="section wrap" id="about"><div className="section-label">WELCOME TO SONI HEALTHCARE</div><h2>Care that puts <em>you first.</em></h2><p className="lead">Our clinic provides consultations across general health, gynaecology and dermatology. Please contact the clinic to confirm availability and appointment details.</p><div className="service-grid"><article><div className="iconbox"><Stethoscope/></div><h3>General Physician</h3><p>Consultation for common health concerns and general medical care.</p></article><article><div className="iconbox"><Activity/></div><h3>Gynaecology</h3><p>Consultation for women’s health and related concerns.</p></article><article><div className="iconbox"><HeartPulse/></div><h3>Dermatology</h3><p>Consultation for skin concerns and related conditions.</p></article></div></section><section className="doctors" id="doctors"><div className="wrap"><div className="section-label">OUR DOCTORS</div><h2>Experienced care, <em>personal attention.</em></h2><div className="doctor-grid"><article><span className="doctor-symbol">⚕</span><h3>Dr. Aditya Chauhan</h3><p>B.A.M.S. (UAU) · Reg. No. UK7777</p><b>General Physician</b></article><article><span className="doctor-symbol">⚕</span><h3>Dr. Sonia Tomer</h3><p>B.A.M.S. (VYDS) · Reg. No. UK7890</p><b>Gynaecologist &amp; Dermatologist</b></article></div></div></section><section className="section wrap" id="hours"><div className="visit-card"><div><div className="section-label">VISIT OUR CLINIC</div><h2>We’re here to <em>help.</em></h2><p><MapPin size={17}/> {clinic.address}</p><p><Clock3 size={17}/> Morning: {clinic.morning}</p><p><Clock3 size={17}/> Evening: {clinic.evening}</p><small>Sunday closed · Please call ahead to confirm availability.</small></div><a className="primary" href={`tel:${clinic.phone}`}>Call the clinic <ArrowRight size={16}/></a></div></section><section className="verify-strip"><div className="wrap"><div><BadgeCheck/><span><b>Have a Soni HealthCare certificate?</b><small>Verify its authenticity using the certificate ID or QR code.</small></span></div><button onClick={()=>go('verify')}>Verify certificate <ArrowRight size={16}/></button></div></section></main><footer className="footer"><div className="wrap"><b>SONI HEALTHCARE</b><span>{clinic.address} · {clinic.phone}</span><small>Not for Medico-Legal Purpose</small></div></footer></>}



function VerifyPage({go}){const [id,setId]=useState(qs.get('id')||'');const [result,setResult]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');useEffect(()=>{if(id)verify()},[]);async function verify(e){e?.preventDefault();if(!id.trim())return;setBusy(true);setError('');setResult(null);try{const r=await api('verify',{certificateId:id.trim()});setResult(r.certificate||null)}catch(err){setError(err.message)}finally{setBusy(false)}}return <div className="verify-page"><header className="simple-head"><button className="brand" onClick={()=>go('')}><span>SONI <b>HEALTHCARE</b><small>Certificate verification</small></span></button><button className="text-btn" onClick={()=>go('')}>Back to website</button></header><div className="verify-card"><div className="verify-icon"><FileCheck2/></div><div className="section-label">OFFICIAL RECORD LOOKUP</div><h1>Certificate <em>verification</em></h1><p>Enter the certificate ID printed on the document, or open this page using its QR code.</p><form onSubmit={verify} className="lookup"><input value={id} onChange={e=>setId(e.target.value)} placeholder="e.g. SHC-2026-A1B2C3D4E5F6" required/><button className="primary" disabled={busy}>{busy?'Checking…':'Verify certificate'}</button></form>{error&&<div className="alert error">{error}</div>}{result&&<div className={`result ${result.status==='VALID'?'valid':'revoked'}`}><div className="result-title">{result.status==='VALID'?'Record found':'Certificate not valid'} <BadgeCheck size={19}/></div><p><b>Certificate ID:</b> {result.certificateId}</p><p><b>Patient:</b> {maskPatientName(result.patientName)}</p><p><b>Issue date:</b> {result.issueDate}</p><p><b>Issued by:</b> {result.doctorName}</p><small>This lookup confirms the record status only. Clinical details are not displayed publicly.</small></div>}{result===null&&!error&&!busy&&id&&<div className="alert">No matching certificate record found.</div>}<div className="privacy-note"><ShieldCheck size={16}/> For privacy, diagnosis and treatment details are never shown on this public page.</div></div><footer className="simple-foot">Soni HealthCare · {clinic.address} · {clinic.phone}</footer></div>}



function AdminPage({go}){const requestIdRef = useRef(null);const [token,setToken]=useState(sessionStorage.getItem('shc_session')||'');const [pw,setPw]=useState('');const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('');const [records,setRecords]=useState([]);const [form,setForm]=useState({patientName:'',gender:'',age:'',issueDate:dateToday(),reason:'',treatmentFrom:'',treatmentTo:'',restAdvice:'',fitFrom:'',doctor:'Dr. Aditya Chauhan',doctorReg:'UK7777',notes:''});const [latest,setLatest]=useState(null);

 const set=(k,v)=>setForm(f=>({...f,[k]:v}));

 async function login(e){e.preventDefault();setBusy(true);setMsg('');try{const r=await api('login',{password:pw});sessionStorage.setItem('shc_session',r.token);setToken(r.token);setPw('')}catch(err){setMsg(err.message)}finally{setBusy(false)}}

 function logout(){sessionStorage.removeItem('shc_session');setToken('');setRecords([])}

 async function load(){try{const r=await api('list',{token});setRecords(r.certificates||[])}catch(e){setMsg(e.message);if(/session|authori/i.test(e.message))logout()}}

 useEffect(()=>{if(token)load()},[token]);


 async function create(e) {
   e.preventDefault();
   if (busy) return;

   setBusy(true);
   setMsg('');

   const cleanForm = {
     ...form,
     patientName: form.patientName.trim(),
     reason: form.reason.trim(),
     notes: form.notes.trim()
   };

   const requestFingerprint = JSON.stringify(cleanForm);
   if (!requestIdRef.current || requestIdRef.current.fingerprint !== requestFingerprint) {
     requestIdRef.current = {
       id: crypto.randomUUID(),
       fingerprint: requestFingerprint
     };
   }
   const requestIdRefValue = requestIdRef.current.id;

   try {
     // Build the entire PDF before writing anything to the register.
     // This catches letterhead, QR, wrapping and content-height errors first.
     const previewUrl = `${location.origin}${BASE}#/verify?id=PREVIEW`;
     await buildPdf({
       ...cleanForm,
       certificateId: 'SHC-PREVIEW',
       verificationUrl: previewUrl
     });

     // The same requestId is reused if the network times out and the user retries.
     const r = await api('create', {
       token,
       requestId: requestIdRefValue,
       certificate: cleanForm
     });

     setLatest(r.certificate);

     const verificationUrl =
       `${location.origin}${BASE}#/verify?id=${encodeURIComponent(r.certificate.certificateId)}`;

     const finalPdf = await buildPdf({
       ...cleanForm,
       certificateId: r.certificate.certificateId,
       verificationUrl
     });

     finalPdf.save(`${r.certificate.certificateId}.pdf`);

     setMsg(`Certificate ${r.certificate.certificateId} saved to the register and PDF downloaded. Doctor must review and sign it.`);
     requestIdRef.current = null;
     setForm(f => ({
       ...f,
       patientName: '',
       gender: '',
       age: '',
       reason: '',
       notes: ''
     }));
     load();
   } catch (err) {
     setMsg(err.message || 'Could not generate the certificate.');
   } finally {
     setBusy(false);
   }
 }

 async function buildPdf(data) {
   const pdf = new jsPDF({
     orientation: 'portrait',
     unit: 'mm',
     format: 'a4'
   });

   // Add Soni HealthCare letterhead.
   const img = await loadImage(`${BASE}assets/soni-letterhead.png`);
   pdf.addImage(img, 'PNG', 0, 0, 210, 297);

   pdf.setTextColor(22, 45, 37);
   pdf.setFont('helvetica', 'bold');
   pdf.setFontSize(18);
   pdf.text('MEDICAL CERTIFICATE', 105, 91, { align: 'center' });

   pdf.setFont('helvetica', 'normal');
   pdf.setFontSize(10);
   pdf.text(`Date: ${data.issueDate || '________________'}`, 185, 103, {
     align: 'right'
   });

   let y = 117;
   const left = 25;
   const textWidth = 158;

   function addLine(label, value) {
     pdf.setFont('helvetica', 'normal');
     pdf.setFontSize(10.5);
     pdf.setTextColor(35, 45, 40);

     const content = `${label}${value || '________________'}`;
     const lines = pdf.splitTextToSize(content, textWidth);
     pdf.text(lines, left, y);
     y += lines.length * 6 + 4;
   }

   const prefix =
     data.gender === 'Female' ? 'Ms.' :
     data.gender === 'Male' ? 'Mr.' : '';

   addLine(
     'This is to certify that ',
     `${prefix ? prefix + ' ' : ''}${data.patientName}`
   );

   if (data.age) addLine('Age: ', `${data.age} years`);

   addLine('is / was under my treatment for ', data.reason);
   addLine(
     'Treatment period: ',
     `${data.treatmentFrom || '__________'} to ${data.treatmentTo || '__________'}`
   );
   addLine(
     'Advice: ',
     data.restAdvice || 'Treatment and rest as advised by the doctor.'
   );
   addLine(
     'Fit to resume duties from: ',
     data.fitFrom || 'As assessed by the treating doctor'
   );

   if (data.notes) addLine('Additional note: ', data.notes);

   // Reserve the signature area; fail before saving if content is too long.
   if (y > 193) {
     throw new Error(
       'Certificate details are too long. Please shorten the additional notes or treatment details.'
     );
   }

   pdf.setFont('helvetica', 'bold');
   pdf.setFontSize(9);
   pdf.text(`Certificate ID: ${data.certificateId}`, left, 202);

   pdf.setFont('helvetica', 'normal');
   pdf.setFontSize(8);
   pdf.text(
     "This certificate is subject to the examining doctor's review and signature.",
     left,
     208
   );

   const doctorInput = data.doctor || '';
   let doctorName = doctorInput;
   let doctorReg = data.doctorReg || '';

   if (/aditya/i.test(doctorInput)) {
     doctorName = 'Dr. Aditya Chauhan';
     doctorReg = doctorReg || 'UK7777';
   } else if (/sonia/i.test(doctorInput)) {
     doctorName = 'Dr. Sonia Tomer';
     doctorReg = doctorReg || 'UK7890';
   }

   pdf.setDrawColor(45, 60, 52);
   pdf.setLineWidth(0.35);
   pdf.line(left, 225, 88, 225);

   pdf.setFont('helvetica', 'bold');
   pdf.setFontSize(9);
   pdf.text("Doctor's signature / seal", left, 230);

   pdf.setFont('helvetica', 'normal');
   pdf.setFontSize(10);
   pdf.text(doctorName, left, 236);

   if (doctorReg) {
     pdf.setFontSize(9);
     pdf.text(`Reg. No. ${doctorReg}`, left, 242);
   }

   const qr = await QRCode.toDataURL(data.verificationUrl, {
     width: 400,
     margin: 1,
     errorCorrectionLevel: 'H'
   });

   pdf.addImage(qr, 'PNG', 157, 209, 30, 30);
   pdf.setFont('helvetica', 'bold');
   pdf.setFontSize(7);
   pdf.text('SCAN TO VERIFY', 172, 242, { align: 'center' });

   return pdf;
 }

 function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src})}

 async function revoke(id){if(!confirm(`Revoke certificate ${id}?`))return;try{await api('revoke',{token,certificateId:id});setMsg(`${id} revoked.`);load()}catch(e){setMsg(e.message)}}

 if(!token)return <div className="login-screen"><button className="back-home" onClick={()=>go('')}>← Soni HealthCare website</button><form className="login-card" onSubmit={login}><div className="login-mark"><LockKeyhole/></div><div className="section-label">RESTRICTED ACCESS</div><h1>Doctor <em>login</em></h1><p>Sign in to issue and manage medical certificates.</p><label>Admin password<input type="password" value={pw} onChange={e=>setPw(e.target.value)} required autoFocus placeholder="Enter admin password"/></label>{msg&&<div className="alert error">{msg}</div>}<button className="primary full" disabled={busy}>{busy?'Signing in…':'Sign in securely'}</button><small>Access is limited to the clinic’s authorised certificate issuer.</small></form></div>;

 return <div className="admin"><header className="admin-head"><button className="brand" onClick={()=>go('')}><span>SONI <b>HEALTHCARE</b><small>Certificate administration</small></span></button><button className="text-btn" onClick={logout}>Sign out</button></header><main className="admin-wrap"><div className="admin-title"><div><div className="section-label">DOCTOR WORKSPACE</div><h1>Medical certificate <em>issuer</em></h1><p>Enter the patient details. Review the generated PDF, then sign and seal it physically.</p></div><span className="secure-pill"><ShieldCheck size={15}/> Secure session</span></div>{msg&&<div className="alert">{msg}</div>}<div className="admin-grid"><form className="form-card" onSubmit={create}><h2>Patient &amp; certificate details</h2><div className="form-grid"><label className="span2">Patient full name *<input value={form.patientName} onChange={e=>set('patientName',e.target.value)} required maxLength="100"/></label><label>Gender<select value={form.gender} onChange={e=>set('gender',e.target.value)} required><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Age (years)<input type="number" min="0" max="120" value={form.age} onChange={e=>set('age',e.target.value)}/></label><label>Certificate date *<input type="date" value={form.issueDate} onChange={e=>set('issueDate',e.target.value)} required/></label><label>Doctor *<select value={form.doctor} onChange={e=>{set('doctor',e.target.value);set('doctorReg',e.target.value.includes('Sonia')?'UK7890':'UK7777')}}><option>Dr. Aditya Chauhan</option><option>Dr. Sonia Tomer</option></select></label><label className="span2">Reason / condition (kept private) *<textarea value={form.reason} onChange={e=>set('reason',e.target.value)} rows="2" required maxLength="500" placeholder="Enter the medically appropriate reason"/></label><label>Treatment from<input type="date" value={form.treatmentFrom} onChange={e=>set('treatmentFrom',e.target.value)}/></label><label>Treatment to<input type="date" value={form.treatmentTo} onChange={e=>set('treatmentTo',e.target.value)}/></label><label className="span2">Treatment / rest advice<textarea value={form.restAdvice} onChange={e=>set('restAdvice',e.target.value)} rows="2" placeholder="As clinically assessed by the doctor" maxLength="500"/></label><label>Fit for duties from<input type="date" value={form.fitFrom} onChange={e=>set('fitFrom',e.target.value)}/></label><label>Registration number<input value={form.doctorReg} onChange={e=>set('doctorReg',e.target.value)} required/></label><label className="span2">Additional note (optional)<textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows="2" maxLength="300"/></label></div><div className="consent-note"><ShieldCheck size={17}/><span>Only issue a certificate after an actual clinical assessment. Check every field before generating. The PDF has a blank signature/seal area for the doctor.</span></div><button className="primary full" disabled={busy}>{busy?'Validating PDF & saving…':'Validate, save & download PDF'}</button></form><aside className="side-panel"><div className="side-box"><h3><FileCheck2/> Issue workflow</h3><ol><li>Enter accurate patient details.</li><li>Save the record to the clinic register.</li><li>Download and review the PDF.</li><li>Doctor signs and applies the seal.</li><li>Give the signed certificate to the patient.</li></ol></div><div className="side-box"><h3><ShieldCheck/> Privacy</h3><p>Public QR verification shows certificate ID, patient name, issue date, issuing doctor and status only. Diagnosis and treatment information stay private.</p></div></aside></div><section className="records"><div className="records-heading"><h2>Recently issued certificates</h2><button className="text-btn" onClick={load}>Refresh</button></div>{records.length===0?<p className="muted">No certificate records to show yet.</p>:<div className="table-wrap"><table><thead><tr><th>Certificate ID</th><th>Patient</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>{records.map(r=><tr key={r.certificateId}><td>{r.certificateId}</td><td>{r.patientName}</td><td>{r.issueDate}</td><td><span className={r.status==='VALID'?'status-valid':'status-revoked'}>{r.status}</span></td><td>{r.status==='VALID'&&<button className="revoke" onClick={()=>revoke(r.certificateId)}>Revoke</button>}</td></tr>)}</tbody></table></div>}</section></main></div>

}



createRoot(document.getElementById('root')).render(<App/>);
