document.getElementById('enable2faBtn').onclick = async function() {
  const res = await fetch('/auth/setup-2fa', { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    alert('Failed to setup 2FA');
    return;
  }
  const data = await res.json();

  // Show QR code
  document.getElementById('qrImage').src = data.qr;

  // Show backup codes
  const ul = document.getElementById('backupCodes');
  ul.innerHTML = '';
  data.backupCodes.forEach(code => {
    const li = document.createElement('li');
    li.textContent = code;
    ul.appendChild(li);
  });

  // Show the 2FA setup section
  document.getElementById('twofa-setup').style.display = 'block';
};

// Copy backup codes to clipboard
document.getElementById('copyBackupCodes').onclick = function() {
  const codes = Array.from(document.querySelectorAll('#backupCodes li')).map(li => li.textContent).join('\n');
  navigator.clipboard.writeText(codes);
  alert('Backup codes copied to clipboard!');
};
